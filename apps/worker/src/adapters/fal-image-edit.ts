import type {
  ImageGenerationRequest,
  ImageGenerationResult,
  ImageModelAdapter,
  NormalizedGenerationError,
} from "@ornava/shared";

export const falImageEditAdapter: ImageModelAdapter = {
  async submit(_request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    throw new Error("falImageEditAdapter.submit is not implemented yet");
  },

  normalizeError(error: unknown): NormalizedGenerationError {
    const rawMessage = error instanceof Error ? error.message : String(error);

    return {
      code: "unknown",
      retryable: false,
      safeMessage: "We could not generate this image. Please try again.",
      rawMessage,
    };
  },
};
