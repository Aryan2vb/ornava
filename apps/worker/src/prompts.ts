import type { GenerationMode } from "@ornava/shared";

export const PROMPT_TEMPLATE_VERSION = "phase1-v1";

const modePrompts: Record<GenerationMode, string> = {
  studio:
    "Create a premium studio catalog image for Indian jewelry. Preserve the original jewelry design, stone placement, metal color, scale, and fine details. Use clean luxury lighting, realistic shadows, and a simple neutral background. Do not add extra jewelry, logos, text, watermarks, or alter the product.",
  on_model:
    "Create a realistic image of a model wearing the jewelry for a WhatsApp-ready catalog. Preserve the original jewelry design, stone placement, metal color, scale, and fine details. Use elegant Indian retail styling, natural skin tones, and premium lighting. Do not add extra jewelry, logos, text, watermarks, or alter the product.",
  close_up:
    "Create a sharp close-up catalog image of the jewelry. Preserve the original design, stone placement, metal color, scale, and fine details. Emphasize stone sparkle, prong work, polish, and craftsmanship with realistic macro lighting. Do not add extra jewelry, logos, text, watermarks, or alter the product.",
};

export function buildGenerationPrompt(mode: GenerationMode) {
  return modePrompts[mode];
}
