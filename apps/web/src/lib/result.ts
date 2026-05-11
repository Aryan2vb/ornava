import type {
  GenerationBrief,
  GenerationMode,
  GenerationResultResponse,
} from "@ornava/shared";
import type { Route } from "next";

export type GenerationResultRow = {
  id: string;
  image_id: string;
  mode: GenerationMode;
  status: "completed";
  model_route: string;
  generation_brief: GenerationBrief;
  provider: string | null;
  provider_model_id: string | null;
  provider_job_id: string | null;
  generation_duration_ms: number | null;
  original_object_key: string;
  output_object_key: string;
};

export function buildResultPagePath(generationId: string): Route {
  return `/result?generationId=${encodeURIComponent(generationId)}` as Route;
}

export function toGenerationResultResponse(
  generation: GenerationResultRow,
  urls: {
    originalUrl: string;
    generatedUrl: string;
    expiresAt: string;
  },
): GenerationResultResponse {
  return {
    generationId: generation.id,
    imageId: generation.image_id,
    mode: generation.mode,
    status: generation.status,
    modelRoute: generation.model_route,
    generationBrief: generation.generation_brief,
    provider: generation.provider ?? undefined,
    providerModelId: generation.provider_model_id ?? undefined,
    providerJobId: generation.provider_job_id ?? undefined,
    generationDurationMs: generation.generation_duration_ms ?? undefined,
    assets: {
      original: {
        url: urls.originalUrl,
        objectKey: generation.original_object_key,
        expiresAt: urls.expiresAt,
      },
      generated: {
        url: urls.generatedUrl,
        objectKey: generation.output_object_key,
        expiresAt: urls.expiresAt,
      },
    },
  };
}
