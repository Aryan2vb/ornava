import {
  FEEDBACK_RATINGS,
  FEEDBACK_REASONS,
  type FeedbackReason,
} from "@ornava/shared";
import { z } from "zod";

export const feedbackReasonLabels: Record<FeedbackReason, string> = {
  design_changed: "Design changed",
  stone_or_detail_changed: "Stone or detail changed",
  unrealistic_model_or_skin: "Model or skin looked unrealistic",
  too_dark_or_dull: "Too dark or dull",
  bad_crop_or_composition: "Bad crop or composition",
  generation_failed_or_incomplete: "Generation failed or incomplete",
  other: "Other",
};

const submitFeedbackSchema = z
  .object({
    rating: z.enum(FEEDBACK_RATINGS),
    reason: z.enum(FEEDBACK_REASONS).optional(),
    freeText: z.string().max(1000).optional(),
  })
  .superRefine((value, context) => {
    if (value.rating === "not_usable" && !value.reason) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Reason is required for not usable feedback.",
        path: ["reason"],
      });
    }
  });

export type ValidatedSubmitFeedbackRequest = z.infer<
  typeof submitFeedbackSchema
>;

export function validateSubmitFeedbackRequest(input: unknown) {
  return submitFeedbackSchema.parse(input);
}
