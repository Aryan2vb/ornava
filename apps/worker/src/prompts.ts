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
    "Create a premium studio product photograph of this Indian jewelry, styled like a Tanishq or CaratLane e-commerce catalog. Place the jewelry on a polished reflective surface. Use three-point studio lighting: key light from top-left for metallic highlights, fill light to soften shadows, and rim light for edge separation. Render realistic hard shadows and subtle surface reflections to convey depth and weight. Keep the exact item count from the uploaded photo. Do not add or remove any pieces. Preserve the original jewelry design, stone placement, metal color, texture, scale, and fine details with 100% fidelity. Do not add extra jewelry, logos, text, watermarks, or alter the product in any way.",
  on_model:
    "Create a photorealistic image of an Indian model wearing this jewelry for a premium WhatsApp-ready catalog. Use natural warm skin tones and elegant Indian retail styling. Light the scene with soft diffused key light and a subtle hair/rim light for depth. The jewelry must be the focal point, sharp and detailed, while the model and background have gentle bokeh. Keep the exact item count from the uploaded photo. Do not add or remove any pieces. Preserve the original jewelry design, stone placement, metal color, texture, scale, and fine details with 100% fidelity. Do not add extra jewelry, logos, text, watermarks, or alter the product in any way.",
  close_up:
    "Create a sharp macro close-up product photograph of this jewelry, styled like a luxury brand detail shot. Use focused directional lighting to emphasize stone sparkle, prong work, surface polish, engraving, and craftsmanship. Render visible metallic reflections and micro-shadows that convey texture and dimension. Use shallow depth of field with the front face tack-sharp and edges softly falling off. Keep the exact item count from the uploaded photo. Do not add or remove any pieces. Preserve the original design, stone placement, metal color, texture, scale, and fine details with 100% fidelity. Do not add extra jewelry, logos, text, watermarks, or alter the product in any way.",
};

const bangleOnModelPrompt =
  "Create a premium photorealistic Indian jewelry catalog image showing a model wearing one rigid closed circular antique-gold kada/bangle, exactly as shown in the reference product image. Product identity (preserve 100%): closed circular shape, thick carved body, centerpiece at the top, side motifs, any stone details, lower clasp detail, antique gold color and texture, deep relief carving, inner opening, outer silhouette, and overall scale. Do not redesign, simplify, reshape, open, bend, stretch, or convert it into a cuff, chain bracelet, thin bangle, or modern bracelet. Keep the centerpiece on top of the wrist facing the camera, and keep the lower clasp visible at the bottom. Wearing mechanics (critical): the model's wrist and forearm must actually pass through the inner circular opening of the kada so it looks truly worn. The kada must encircle the wrist with correct perspective, realistic contact points, natural cast shadows, and slight skin occlusion where the metal touches the wrist. The kada must not appear floating, pasted, overlaid, or merely placed in front of the wrist. The kada remains visibly rigid, circular, and wearable on a real human wrist. Model: elegant Indian female model with warm natural skin tone, soft refined makeup, neat hair, soft elegant expression. Outfit: subtle ivory, beige, cream, or champagne ethnic wear so the antique gold kada stands out. Lighting: soft diffused studio key light with a gentle rim light. Focus and sharpness: the kada must be the sharpest, most detailed element in the frame; the model and background can be softly blurred. Composition: exactly one kada only, fully visible, no obstruction. Photorealistic, high detail, WhatsApp-ready premium Indian jewelry catalog image. Strictly avoid: open cuff, flexible bracelet, chain bracelet, split bangle, partial arc, broken circle, distorted geometry, warped or elliptical shape, missing centerpiece or clasp, redesigned product, simplified product, extra bangles, rings, earrings, necklace, text, logo, watermark, props, distorted hands, extra fingers, blurry jewelry, kada floating or pasted or overlaid in front of the wrist, kada not actually encircling the wrist, no shadow contact, no skin occlusion.";

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
    "Critical product identity for bracelet/bangle/kada: preserve the exact rigid geometry from the uploaded photo. If it is a closed circular bangle, keep it a closed circular bangle; do not convert it into an open cuff, crescent, partial arc, chain bracelet, or flexible bracelet. Preserve the centerpiece, face, clasp, carved motif placement, thickness, inner opening, and outer silhouette exactly. If multiple bangles are shown, reproduce the exact same count and stacking arrangement.",
  earrings:
    "Critical product identity for earrings: if the photo shows a pair, output exactly 2 earrings. Preserve the exact drop length, jhumka shape, hook style, and stone arrangement. Do not merge a pair into one or split one into two.",
  necklace:
    "Critical product identity for necklace: preserve the exact chain length, pendant size ratio, clasp position, and layering. If multiple necklaces are shown as a set, keep the exact count and layering order.",
};

export function buildGenerationPrompt(
  mode: GenerationMode,
  brief?: GenerationBrief,
) {
  if (brief?.jewelryType === "bracelet_bangle" && mode === "on_model") {
    const posePreset = getPosePreset(brief.posePresetId);
    const backgroundPreset = getBackgroundPreset(brief.backgroundPresetId);
    const posePrompt =
      posePreset?.promptFragment ?? "natural wrist pose with the kada clearly visible";
    const backgroundPrompt =
      backgroundPreset?.promptFragment ?? "clean white studio background";
    return [
      bangleOnModelPrompt,
      `Pose: ${posePrompt}.`,
      `Background: ${backgroundPrompt}.`,
    ].join(" ");
  }

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
    identityRule,
    "Use the selected preset as a composition guide only; the uploaded jewelry identity is the hard constraint.",
  ].join(" ");
}
