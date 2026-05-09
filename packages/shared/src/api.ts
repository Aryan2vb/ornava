import type {
  FeedbackRating,
  FeedbackReason,
  GenerationMode,
  GenerationStatus,
} from "./types";

export type UploadInitRequest = {
  fileName: string;
  fileType: "image/jpeg" | "image/png";
  fileSizeBytes: number;
  width?: number;
  height?: number;
};

export type UploadInitResponse = {
  imageId: string;
  uploadUrl: string;
  objectKey: string;
  expiresAt: string;
};

export type UploadCompleteRequest = {
  imageId: string;
  objectKey: string;
};

export type UploadCompleteResponse = {
  imageId: string;
  status: "uploaded";
};

export type CreateGenerationRequest = {
  imageId: string;
  mode: GenerationMode;
  clientRequestId: string;
};

export type CreateGenerationResponse = {
  generationId: string;
  status: Extract<GenerationStatus, "queued" | "processing">;
  modelRoute: string;
};

export type GenerationStatusResponse = {
  generationId: string;
  imageId: string;
  mode: GenerationMode;
  status: GenerationStatus;
  modelRoute: string;
  provider?: string;
  providerModelId?: string;
  outputUrl?: string;
  failureCode?: string;
  failureMessage?: string;
  generationDurationMs?: number;
  queuePosition?: number;
};

export type SubmitFeedbackRequest = {
  rating: FeedbackRating;
  reason?: FeedbackReason;
  freeText?: string;
};

export type SubmitFeedbackResponse = {
  feedbackId: string;
};

export type RetryGenerationRequest = {
  clientRequestId: string;
};

export type RetryGenerationResponse = CreateGenerationResponse & {
  previousGenerationId: string;
};
