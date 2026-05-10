import type { GenerationMode } from "./types";

export const GENERATION_QUEUE_NAME = "ornava-generation";

export type GenerationJobData = {
  generationId: string;
  userId: string;
  imageId: string;
  mode: GenerationMode;
  modelRoute: string;
};

export function buildGenerationJobId(generationId: string) {
  return `generation-${generationId}`;
}
