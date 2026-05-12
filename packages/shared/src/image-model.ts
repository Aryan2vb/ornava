import type {
  GenerationMode,
  NormalizedGenerationErrorCode,
  JsonValue,
} from "./types";

export type OutputAspectRatio = "1:1" | "4:5" | "3:4" | "9:16";
export type OutputFormat = "jpeg" | "png" | "webp";
export type OutputQuality = "draft" | "standard" | "high";

export type ImageGenerationRequest = {
  generationId: string;
  userId: string;
  mode: GenerationMode;
  model: {
    route: string;
    providerModelId: string;
  };
  inputImage: {
    objectKey: string;
    signedUrl: string;
    mimeType: "image/jpeg" | "image/png" | "image/webp";
  };
  prompt: string;
  output: {
    aspectRatio: OutputAspectRatio;
    format: OutputFormat;
    quality: OutputQuality;
  };
  metadata: {
    promptTemplateVersion: string;
    clientRequestId: string;
  } & Record<string, JsonValue | undefined>;
};

export type ImageGenerationResult = {
  provider: string;
  modelId: string;
  providerJobId?: string;
  outputUrl?: string;
  outputBytes?: Uint8Array;
  width?: number;
  height?: number;
  costEstimateMinor?: number;
  latencyMs: number;
  rawMetadata?: Record<string, JsonValue>;
};

export type NormalizedGenerationError = {
  code: NormalizedGenerationErrorCode;
  retryable: boolean;
  safeMessage: string;
  providerStatusCode?: number;
  rawMessage?: string;
};

export type ImageGenerationAsyncSubmitResult = {
  provider: string;
  modelId: string;
  providerJobId: string;
  submittedAt: string;
  rawMetadata?: Record<string, JsonValue>;
};

export type ImageModelAdapter = {
  submit(request: ImageGenerationRequest): Promise<ImageGenerationResult>;
  // Async submission — returns the provider's job ID immediately without
  // waiting for generation to complete. Completion arrives via webhook.
  submitAsync?(
    request: ImageGenerationRequest,
    options: { webhookUrl: string },
  ): Promise<ImageGenerationAsyncSubmitResult>;
  normalizeError(error: unknown): NormalizedGenerationError;
};

export type ImageModelRegistryEntry = {
  provider: string;
  modelId: string;
  adapter: string;
  enabled: boolean;
  capabilities: {
    imageToImage: boolean;
    supportsAspectRatio: OutputAspectRatio[];
    supportsMultipleInputs: boolean;
    supportsStreaming: boolean;
  };
  limits: {
    maxInputBytes: number;
    maxLongEdgePx: number;
    timeoutMs: number;
  };
  cost: {
    unit: "per_image";
    estimatedMinor: number;
    currency?: string;
  };
};
