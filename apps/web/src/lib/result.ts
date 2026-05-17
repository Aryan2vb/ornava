import type {
  GenerationBrief,
  GenerationMode,
  GenerationResultResponse,
  OverlayText,
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
  overlay_text: OverlayText | null;
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
    generationDurationMs: generation.generation_duration_ms ?? undefined,
    overlayText: generation.overlay_text ?? undefined,
    assets: {
      original: {
        url: urls.originalUrl,
        expiresAt: urls.expiresAt,
      },
      generated: {
        url: urls.generatedUrl,
        expiresAt: urls.expiresAt,
      },
    },
  };
}
