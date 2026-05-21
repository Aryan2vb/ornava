import type {
  FeedbackRating,
  FeedbackReason,
  GenerationBrief,
  GenerationMode,
  GenerationStatus,
} from "./types";

export type UploadInitRequest = {
  fileName: string;
  fileType: "image/jpeg" | "image/png";
  fileSizeBytes: number;
  width?: number;
  height?: number;
  batchId?: string;
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
  generationBrief: GenerationBrief;
  clientRequestId: string;
};

export type CreateGenerationResponse = {
  generationId: string;
  status: Extract<GenerationStatus, "queued" | "processing">;
};

export type GenerationStatusResponse = {
  generationId: string;
  imageId: string;
  mode: GenerationMode;
  status: GenerationStatus;
  failureCode?: string;
  failureMessage?: string;
  generationDurationMs?: number;
  queuePosition?: number;
};

export type GenerationResultResponse = {
  generationId: string;
  imageId: string;
  mode: GenerationMode;
  status: Extract<GenerationStatus, "completed">;
  generationDurationMs?: number;
  overlayText?: OverlayText | null;
  assets: {
    original: {
      url: string;
      expiresAt: string;
    };
    generated: {
      url: string;
      expiresAt: string;
    };
  };
};

export type OverlayText = {
  purity: "24K" | "22K" | "20K" | "18K";
  weightGm: string;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "bottom-center";
  size?: "small" | "medium" | "large";
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

export type CreateShowcaseRequest = {
  title?: string;
  generationIds: string[];
};

export type CreateShowcaseResponse = {
  showcaseId: string;
  title: string;
  publicPath: string;
};

export type PublicShowcaseResponse = {
  showcaseId: string;
  title: string;
  jeweler: {
    name?: string;
    phone?: string;
    logo?: {
      url: string;
      expiresAt: string;
    };
  };
  items: Array<{
    generationId: string;
    mode: GenerationMode;
    jewelryType?: GenerationBrief["jewelryType"];
    overlayText?: OverlayText | null;
    image: {
      url: string;
      expiresAt: string;
    };
  }>;
};

export type CreateShowcaseViewRequest = {
  generationId?: string;
  fingerprint?: string;
  deviceInfo?: string;
};

export type ShowcaseActivityResponse = {
  activities: Array<{
    id: string;
    showcaseId: string;
    showcaseTitle: string;
    generationId?: string;
    mode?: GenerationMode;
    jewelryType?: GenerationBrief["jewelryType"];
    deviceInfo?: string;
    viewerLocation?: string;
    viewedAt: string;
  }>;
};

// --- Batch types ---

export type CreateBatchResponse = {
  batchId: string;
  status: "uploading";
};

export type BatchGenerateRequest = {
  mode: GenerationMode;
  generationBrief: GenerationBrief;
  clientRequestId: string;
};

export type BatchGenerateResponse = {
  batchId: string;
  generations: Array<{
    generationId: string;
    imageId: string;
    status: "queued" | "skipped_no_credits";
  }>;
  creditsDeducted: number;
  creditsRemaining: number;
};

export type BatchStatusResponse = {
  batchId: string;
  status: "uploading" | "ready" | "generating" | "completed" | "cancelled";
  generationBrief: GenerationBrief | null;
  images: Array<{
    imageId: string;
    uploadStatus: "created" | "uploaded" | "failed";
    originalUrl?: string;
    overlayText?: OverlayText | null;
  }>;
  generations: Array<{
    generationId: string;
    imageId: string;
    status: GenerationStatus;
    failureCode?: string;
    failureMessage?: string;
    generationDurationMs?: number;
    completedAt?: string;
    overlayText?: OverlayText | null;
  }>;
  totalImages: number;
  completedCount: number;
  failedCount: number;
};
