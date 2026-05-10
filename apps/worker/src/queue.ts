import { Worker } from "bullmq";
import {
  GENERATION_QUEUE_NAME,
  type ImageModelAdapter,
  type GenerationJobData,
} from "@ornava/shared";
import {
  FAL_IMAGE_EDIT_ADAPTER_VERSION,
  downloadGeneratedImage,
  falImageEditAdapter,
  uploadInputImageToFal,
} from "./adapters/fal-image-edit";
import { env } from "./env";
import {
  closePool,
  getGenerationWorkItem,
  markGenerationCompleted,
  markGenerationFailed,
  markGenerationProcessing,
} from "./db";
import {
  buildGeneratedObjectKey,
  contentTypeForOutputFormat,
  getOriginalImageObject,
  putGeneratedImageObject,
} from "./storage";
import { getModelRegistryEntry, type ImageModelRoute } from "./model-registry";
import { buildGenerationPrompt } from "./prompts";

const adapters: Record<string, ImageModelAdapter> = {
  falImageEdit: falImageEditAdapter,
};

function redisConnectionOptions() {
  const redisUrl = new URL(env.REDIS_URL);

  return {
    host: redisUrl.hostname,
    port: Number(redisUrl.port || 6379),
    password: redisUrl.password || undefined,
    maxRetriesPerRequest: null,
  };
}

export function startGenerationWorker() {
  const worker = new Worker<GenerationJobData>(
    GENERATION_QUEUE_NAME,
    async (job) => {
      const startedAt = Date.now();
      console.info(`[worker] processing generation ${job.data.generationId}`);

      await markGenerationProcessing(job.data.generationId);

      const workItem = await getGenerationWorkItem(job.data.generationId);

      if (!workItem) {
        await markGenerationFailed({
          generationId: job.data.generationId,
          failureCode: "invalid_input_image",
          failureMessageSafe:
            "We could not find the uploaded image for this generation.",
        });
        return;
      }

      const registryEntry = getModelRegistryEntry(
        workItem.model_route as ImageModelRoute,
      );
      const adapter = adapters[registryEntry.adapter];

      if (!adapter) {
        throw new Error(`Unknown image model adapter: ${registryEntry.adapter}`);
      }

      let originalImage: Awaited<ReturnType<typeof getOriginalImageObject>>;

      try {
        originalImage = await getOriginalImageObject(workItem.original_object_key);
      } catch (error) {
        const rawMessage = error instanceof Error ? error.message : String(error);
        await markGenerationFailed({
          generationId: workItem.id,
          failureCode: "storage_read_failed",
          failureMessageSafe:
            "We could not read the uploaded image. Please upload it again.",
        });
        console.error(
          `[worker] failed to read original image for generation ${workItem.id}`,
          rawMessage,
        );
        return;
      }

      try {
        const inputImageUrl = await uploadInputImageToFal({
          bytes: originalImage.bytes,
          mimeType: originalImage.contentType ?? workItem.file_type,
        });
        const outputFormat = "jpeg";
        const result = await adapter.submit({
          generationId: workItem.id,
          userId: workItem.user_id,
          mode: workItem.mode,
          model: {
            route: workItem.model_route,
            providerModelId: registryEntry.modelId,
          },
          inputImage: {
            objectKey: workItem.original_object_key,
            signedUrl: inputImageUrl,
            mimeType: workItem.file_type,
          },
          prompt: buildGenerationPrompt(workItem.mode),
          output: {
            aspectRatio: "1:1",
            format: outputFormat,
            quality: "standard",
          },
          metadata: {
            promptTemplateVersion: workItem.prompt_template_version,
            clientRequestId: workItem.client_request_id,
          },
        });
        const generatedBytes =
          result.outputBytes ??
          (result.outputUrl
            ? await downloadGeneratedImage(result.outputUrl)
            : undefined);

        if (!generatedBytes) {
          throw new Error("Model adapter did not return output bytes or URL.");
        }

        const outputObjectKey = buildGeneratedObjectKey({
          userId: workItem.user_id,
          generationId: workItem.id,
          format: outputFormat,
        });

        await putGeneratedImageObject({
          objectKey: outputObjectKey,
          bytes: generatedBytes,
          contentType: contentTypeForOutputFormat(outputFormat),
        });

        await markGenerationCompleted({
          generationId: workItem.id,
          outputObjectKey,
          provider: result.provider,
          providerModelId: result.modelId,
          providerJobId: result.providerJobId,
          adapterVersion: FAL_IMAGE_EDIT_ADAPTER_VERSION,
          generationDurationMs: Date.now() - startedAt,
          estimatedCostMinor: result.costEstimateMinor,
          rawProviderMetadata: result.rawMetadata,
        });

        console.info(
          `[worker] completed generation ${workItem.id} in ${
            Date.now() - startedAt
          }ms`,
        );
      } catch (error) {
        const normalizedError = adapter.normalizeError(error);

        await markGenerationFailed({
          generationId: workItem.id,
          failureCode: normalizedError.code,
          failureMessageSafe: normalizedError.safeMessage,
        });

        console.error(
          `[worker] failed generation ${workItem.id}: ${normalizedError.code}`,
          normalizedError.rawMessage ?? error,
        );
      }
    },
    {
      connection: redisConnectionOptions(),
      concurrency: 2,
    },
  );

  worker.on("failed", (job, error) => {
    console.error(
      `[worker] generation job ${job?.id ?? "unknown"} failed`,
      error,
    );
  });

  return worker;
}

export async function closeGenerationWorker(
  worker: ReturnType<typeof startGenerationWorker>,
) {
  await worker.close();
  await closePool();
}
