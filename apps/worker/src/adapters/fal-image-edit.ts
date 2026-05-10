import { fal } from "@fal-ai/client";
import type {
  GenerationMode,
  ImageGenerationRequest,
  ImageGenerationResult,
  ImageModelAdapter,
  NormalizedGenerationError,
  OutputFormat,
  OutputQuality,
} from "@ornava/shared";
import { env } from "../env";

export const FAL_IMAGE_EDIT_ADAPTER_VERSION = "fal-image-edit-v1";

type FalImageResult = {
  url: string;
  width?: number;
  height?: number;
};

type FalImageSize = "square_hd" | "portrait_4_3";
type FalQuality = "low" | "medium" | "high";

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : undefined;
}

function asNumber(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

export function extractFalImageResult(output: unknown): FalImageResult {
  const data = asRecord(output);
  const imageCandidate =
    Array.isArray(data?.images) && data.images.length > 0
      ? asRecord(data.images[0])
      : asRecord(data?.image) ?? data;

  const url = imageCandidate?.url;

  if (typeof url !== "string" || url.length === 0) {
    throw new Error("fal response did not include an output image URL.");
  }

  return {
    url,
    width: asNumber(imageCandidate?.width),
    height: asNumber(imageCandidate?.height),
  };
}

export async function downloadGeneratedImage(
  url: string,
  fetcher: typeof fetch = fetch,
) {
  const response = await fetcher(url);

  if (!response.ok) {
    throw new Error(
      `Failed to download generated image: HTTP ${response.status} ${response.statusText}`,
    );
  }

  return new Uint8Array(await response.arrayBuffer());
}

export async function uploadInputImageToFal(input: {
  bytes: Uint8Array;
  mimeType: string;
}) {
  if (!env.FAL_KEY) {
    throw new Error("FAL_KEY is required for the fal image edit adapter.");
  }

  fal.config({ credentials: env.FAL_KEY });

  return fal.storage.upload(
    new Blob([Buffer.from(input.bytes)], {
      type: input.mimeType,
    }),
    {
      lifecycle: {
        expiresIn: "1d",
      },
    },
  );
}

export function buildFalEditInput(input: {
  mode: GenerationMode;
  prompt: string;
  inputImageUrl: string;
  outputFormat: OutputFormat;
  outputQuality: OutputQuality;
}) {
  return {
    prompt: input.prompt,
    image_urls: [input.inputImageUrl],
    image_size: falImageSizeForMode(input.mode),
    quality: falQualityForOutputQuality(input.outputQuality),
    num_images: 1,
    output_format: input.outputFormat,
  };
}

export function falImageSizeForMode(mode: GenerationMode): FalImageSize {
  const imageSizeByMode: Record<GenerationMode, FalImageSize> = {
    studio: "square_hd",
    close_up: "square_hd",
    on_model: "portrait_4_3",
  };

  return imageSizeByMode[mode];
}

export function falQualityForOutputQuality(
  quality: OutputQuality,
): FalQuality {
  const qualityMap: Record<OutputQuality, FalQuality> = {
    draft: "low",
    standard: "medium",
    high: "high",
  };

  return qualityMap[quality];
}

export const falImageEditAdapter: ImageModelAdapter = {
  async submit(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    if (!env.FAL_KEY) {
      throw new Error("FAL_KEY is required for the fal image edit adapter.");
    }

    fal.config({ credentials: env.FAL_KEY });

    const startedAt = Date.now();
    const result = await fal.subscribe(request.model.providerModelId, {
      input: buildFalEditInput({
        mode: request.mode,
        prompt: request.prompt,
        inputImageUrl: request.inputImage.signedUrl,
        outputFormat: request.output.format,
        outputQuality: request.output.quality,
      }),
      logs: true,
    } as never);
    const image = extractFalImageResult(result.data);

    return {
      provider: "fal",
      modelId: request.model.providerModelId,
      providerJobId: result.requestId || undefined,
      outputUrl: image.url,
      width: image.width,
      height: image.height,
      latencyMs: Date.now() - startedAt,
      rawMetadata: {
        adapterVersion: FAL_IMAGE_EDIT_ADAPTER_VERSION,
        modelRoute: request.model.route,
        falRequestId: result.requestId || null,
        falImageSize: falImageSizeForMode(request.mode),
        falQuality: falQualityForOutputQuality(request.output.quality),
      },
    };
  },

  normalizeError(error: unknown): NormalizedGenerationError {
    const maybeStatus = asRecord(error)?.status;
    const rawMessage = error instanceof Error ? error.message : String(error);
    const providerStatusCode =
      typeof maybeStatus === "number" ? maybeStatus : undefined;

    if (providerStatusCode === 408 || providerStatusCode === 504) {
      return {
        code: "provider_timeout",
        retryable: true,
        safeMessage: "Image generation timed out. Please try again.",
        providerStatusCode,
        rawMessage,
      };
    }

    if (providerStatusCode === 429) {
      return {
        code: "provider_rate_limited",
        retryable: true,
        safeMessage: "Image generation is busy right now. Please try again.",
        providerStatusCode,
        rawMessage,
      };
    }

    if (providerStatusCode && providerStatusCode >= 500) {
      return {
        code: "provider_unavailable",
        retryable: true,
        safeMessage: "Image generation is temporarily unavailable. Please try again.",
        providerStatusCode,
        rawMessage,
      };
    }

    return {
      code: "unknown",
      retryable: false,
      safeMessage: "We could not generate this image. Please try again.",
      providerStatusCode,
      rawMessage,
    };
  },
};
