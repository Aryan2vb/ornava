import {
  GENERATION_MODES,
  GENERATION_QUEUE_NAME,
  buildGenerationJobId,
  type GenerationMode,
} from "@ornava/shared";
import type { Route } from "next";
import { z } from "zod";
import { env } from "./env";

const createGenerationSchema = z.object({
  imageId: z.string().uuid(),
  mode: z.enum(GENERATION_MODES),
  clientRequestId: z.string().min(1).max(120),
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
