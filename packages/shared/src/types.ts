export const GENERATION_MODES = ["on_model", "studio", "close_up"] as const;
export type GenerationMode = (typeof GENERATION_MODES)[number];

export const JEWELRY_TYPES = [
  "necklace",
  "ring",
  "bracelet_bangle",
  "earrings",
  "pendant",
  "other",
] as const;
export type JewelryType = (typeof JEWELRY_TYPES)[number];

export const BACKGROUND_PRESETS = [
  "pure_white",
  "warm_ivory",
  "light_gray",
  "charcoal_black",
  "marble",
  "deep_red_luxury",
  "emerald_luxury",
] as const;
export type BackgroundPresetId = (typeof BACKGROUND_PRESETS)[number];

export const ASPECT_RATIOS = ["1:1", "4:5", "3:4"] as const;
export type AspectRatio = (typeof ASPECT_RATIOS)[number];

export const GUIDED_PROMPT_TEMPLATE_VERSION = "guided-v2" as const;

export type GenerationBrief = {
  jewelryType: JewelryType;
  generationMode: GenerationMode;
  modelPresetId: string;
  posePresetId: string;
  backgroundPresetId: BackgroundPresetId;
  aspectRatio: AspectRatio;
  promptTemplateVersion: typeof GUIDED_PROMPT_TEMPLATE_VERSION;
};

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
