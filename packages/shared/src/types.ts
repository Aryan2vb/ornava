export const GENERATION_MODES = ["on_model", "studio", "close_up"] as const;
export type GenerationMode = (typeof GENERATION_MODES)[number];

export const IMAGE_STATUSES = ["created", "uploaded", "failed", "deleted"] as const;
export type ImageStatus = (typeof IMAGE_STATUSES)[number];

export const GENERATION_STATUSES = [
  "queued",
  "processing",
  "completed",
  "failed",
  "cancelled",
] as const;
export type GenerationStatus = (typeof GENERATION_STATUSES)[number];

export const FEEDBACK_RATINGS = ["usable", "not_usable"] as const;
export type FeedbackRating = (typeof FEEDBACK_RATINGS)[number];

export const FEEDBACK_REASONS = [
  "design_changed",
  "stone_or_detail_changed",
  "unrealistic_model_or_skin",
  "too_dark_or_dull",
  "bad_crop_or_composition",
  "generation_failed_or_incomplete",
  "other",
] as const;
export type FeedbackReason = (typeof FEEDBACK_REASONS)[number];

export const NORMALIZED_GENERATION_ERROR_CODES = [
  "provider_timeout",
  "provider_rate_limited",
  "provider_unavailable",
  "provider_rejected_image",
  "invalid_input_image",
  "storage_read_failed",
  "storage_write_failed",
  "unknown",
] as const;
export type NormalizedGenerationErrorCode =
  (typeof NORMALIZED_GENERATION_ERROR_CODES)[number];

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
