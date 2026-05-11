import {
  GUIDED_PROMPT_TEMPLATE_VERSION,
  getBackgroundPreset,
  getPosePreset,
  type GenerationBrief,
  type GenerationMode,
} from "@ornava/shared";

export const PROMPT_TEMPLATE_VERSION = GUIDED_PROMPT_TEMPLATE_VERSION;

const modePrompts: Record<GenerationMode, string> = {
  studio:
    "Create a premium studio catalog image for Indian jewelry. Preserve the original jewelry design, stone placement, metal color, scale, and fine details. Use clean luxury lighting, realistic shadows, and a simple neutral background. Do not add extra jewelry, logos, text, watermarks, or alter the product.",
  on_model:
    "Create a realistic image of a model wearing the jewelry for a WhatsApp-ready catalog. Preserve the original jewelry design, stone placement, metal color, scale, and fine details. Use elegant Indian retail styling, natural skin tones, and premium lighting. Do not add extra jewelry, logos, text, watermarks, or alter the product.",
  close_up:
    "Create a sharp close-up catalog image of the jewelry. Preserve the original design, stone placement, metal color, scale, and fine details. Emphasize stone sparkle, prong work, polish, and craftsmanship with realistic macro lighting. Do not add extra jewelry, logos, text, watermarks, or alter the product.",
};

const jewelryTypeLabels: Record<GenerationBrief["jewelryType"], string> = {
  necklace: "necklace",
  ring: "ring",
  bracelet_bangle: "bracelet or bangle",
  earrings: "earrings",
  pendant: "pendant",
  other: "jewelry item",
};

const jewelryIdentityRules: Partial<
  Record<GenerationBrief["jewelryType"], string>
> = {
  bracelet_bangle:
    "Critical product identity for bracelet/bangle/kada: preserve the exact rigid geometry from the uploaded photo. If it is a closed circular bangle, keep it a closed circular bangle; do not convert it to an open cuff, crescent, partial arc, chain bracelet, or flexible bracelet. Preserve the centerpiece, face, clasp, carved motif placement, thickness, inner opening, and outer silhouette exactly.",
};

export function buildGenerationPrompt(
  mode: GenerationMode,
  brief?: GenerationBrief,
) {
  const basePrompt = modePrompts[mode];

  if (!brief) {
    return basePrompt;
  }

  const posePreset = getPosePreset(brief.posePresetId);
  const backgroundPreset = getBackgroundPreset(brief.backgroundPresetId);
  const jewelryType = jewelryTypeLabels[brief.jewelryType];
  const posePrompt = posePreset?.promptFragment ?? "selected catalog pose";
  const backgroundPrompt =
    backgroundPreset?.promptFragment ?? "selected catalog background";
  const identityRule =
    jewelryIdentityRules[brief.jewelryType] ??
    "Preserve the original product outline, closures, centerpiece, motif layout, stone count, and metalwork placement exactly.";

  return [
    basePrompt,
    `Product type: ${jewelryType}.`,
    `Catalog preset: ${posePrompt}.`,
    `Background: ${backgroundPrompt}.`,
    `Output crop/aspect ratio: ${brief.aspectRatio}.`,
    identityRule,
    "Use the selected preset as a composition guide only; the uploaded jewelry identity is the hard constraint.",
  ].join(" ");
}
