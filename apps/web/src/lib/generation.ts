import {
  ASPECT_RATIOS,
  BACKGROUND_PRESETS,
  GENERATION_MODES,
  GENERATION_QUEUE_NAME,
  GUIDED_PROMPT_TEMPLATE_VERSION,
  JEWELRY_TYPES,
  buildGenerationJobId,
  type GenerationMode,
} from "@ornava/shared";
import { isGenerationBriefCompatible } from "@ornava/shared";
import type { Route } from "next";
import { z } from "zod";
import { env } from "./env";

const createGenerationSchema = z.object({
  imageId: z.string().uuid(),
  mode: z.enum(GENERATION_MODES),
  generationBrief: z.object({
    jewelryType: z.enum(JEWELRY_TYPES),
    generationMode: z.enum(GENERATION_MODES),
    modelPresetId: z.string().min(1).max(80),
    posePresetId: z.string().min(1).max(120),
    backgroundPresetId: z.enum(BACKGROUND_PRESETS),
    aspectRatio: z.enum(ASPECT_RATIOS),
    promptTemplateVersion: z.literal(GUIDED_PROMPT_TEMPLATE_VERSION),
  }),
  clientRequestId: z.string().min(1).max(120),
}).superRefine((request, context) => {
  if (request.generationBrief.generationMode !== request.mode) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "generationBrief.generationMode must match mode",
      path: ["generationBrief", "generationMode"],
    });
  }

  if (!isGenerationBriefCompatible(request.generationBrief)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "posePresetId is not compatible with the selected brief",
      path: ["generationBrief", "posePresetId"],
    });
  }
});

export type ValidatedCreateGenerationRequest = z.infer<
  typeof createGenerationSchema
>;

export function validateCreateGenerationRequest(input: unknown) {
  return createGenerationSchema.parse(input);
}

const retryGenerationSchema = z.object({
  clientRequestId: z.string().min(1).max(120),
});

export type ValidatedRetryGenerationRequest = z.infer<
  typeof retryGenerationSchema
>;

export function validateRetryGenerationRequest(input: unknown) {
  return retryGenerationSchema.parse(input);
}

export function buildGeneratingPagePath(input: {
  imageId: string;
  generationId: string;
}): Route {
  return `/generating?imageId=${encodeURIComponent(input.imageId)}&generationId=${encodeURIComponent(input.generationId)}` as Route;
}

export function resolveModelRouteForMode(mode: GenerationMode) {
  const modeRoutes: Record<GenerationMode, string | undefined> = {
    studio: env.IMAGE_MODEL_STUDIO,
    on_model: env.IMAGE_MODEL_ON_MODEL,
    close_up: env.IMAGE_MODEL_CLOSE_UP,
  };

  return modeRoutes[mode] ?? env.IMAGE_MODEL_DEFAULT;
}

export { GENERATION_QUEUE_NAME, buildGenerationJobId };
