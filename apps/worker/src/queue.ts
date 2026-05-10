import { Worker } from "bullmq";
import {
  GENERATION_QUEUE_NAME,
  type GenerationJobData,
} from "@ornava/shared";
import { env } from "./env";
import {
  closePool,
  markGenerationFailed,
  markGenerationProcessing,
} from "./db";

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

      await markGenerationFailed({
        generationId: job.data.generationId,
        failureCode: "adapter_not_implemented",
        failureMessageSafe:
          "Generation worker is connected. The model adapter is not implemented yet.",
      });

      console.info(
        `[worker] marked generation ${job.data.generationId} failed in ${
          Date.now() - startedAt
        }ms`,
      );
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
