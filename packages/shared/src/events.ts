import type { FeedbackRating, FeedbackReason, GenerationMode, JsonValue } from "./types";

export const ANALYTICS_EVENTS = [
  "signup_started",
  "auth_completed",
  "onboarding_started",
  "upload_started",
  "upload_validation_failed",
  "upload_completed",
  "mode_selected",
  "generation_requested",
  "job_status_changed",
  "generation_completed",
  "generation_failed",
  "result_viewed",
  "feedback_submitted",
  "retry_clicked",
  "download_clicked",
  "share_clicked",
  "onboarding_completed",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export type AnalyticsEvent = {
  name: AnalyticsEventName;
  userId?: string;
  properties?: Record<string, JsonValue>;
  createdAt?: string;
};

export type FeedbackSubmittedProperties = {
  rating: FeedbackRating;
  reason?: FeedbackReason;
  mode: GenerationMode;
  productTypeOptional?: string;
};
