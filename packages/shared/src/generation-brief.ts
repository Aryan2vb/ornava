import type {
  AspectRatio,
  BackgroundPresetId,
  GenerationBrief,
  GenerationMode,
  JewelryType,
} from "./types";
import { GUIDED_PROMPT_TEMPLATE_VERSION } from "./types";

export type PosePreset = {
  id: string;
  label: string;
  bestFor: string;
  jewelryTypes: readonly JewelryType[];
  generationMode: GenerationMode;
  modelPresetId: string;
  defaultBackgroundPresetId: BackgroundPresetId;
  defaultAspectRatio: AspectRatio;
  promptFragment: string;
  preview: PoseTemplatePreview;
};

export type BackgroundPreset = {
  id: BackgroundPresetId;
  label: string;
  promptFragment: string;
};

export type PoseTemplatePreview = {
  scene:
    | "neck"
    | "ear"
    | "hand"
    | "wrist"
    | "studio-round"
    | "studio-pair"
    | "macro"
    | "studio-generic";
  title: string;
  subtitle: string;
  placement: string;
};

export const BACKGROUND_PRESET_OPTIONS: readonly BackgroundPreset[] = [
  {
    id: "pure_white",
    label: "Pure white",
    promptFragment: "pure white catalog background",
  },
  {
    id: "warm_ivory",
    label: "Warm ivory",
    promptFragment: "warm ivory premium catalog background",
  },
  {
    id: "light_gray",
    label: "Light gray",
    promptFragment: "soft light gray studio background",
  },
  {
    id: "charcoal_black",
    label: "Charcoal black",
    promptFragment: "charcoal black luxury background",
  },
  {
    id: "marble",
    label: "Marble",
    promptFragment: "subtle marble surface with premium lighting",
  },
  {
    id: "deep_red_luxury",
    label: "Deep red luxury",
    promptFragment: "deep red luxury catalog background",
  },
  {
    id: "emerald_luxury",
    label: "Emerald luxury",
    promptFragment: "emerald green luxury catalog background",
  },
];

export const POSE_PRESETS: readonly PosePreset[] = [
  {
    id: "necklace_front_neck_crop",
    label: "Classic neckline",
    bestFor: "Empty model neckline",
    jewelryTypes: ["necklace"],
    generationMode: "on_model",
    modelPresetId: "model_neck",
    defaultBackgroundPresetId: "warm_ivory",
    defaultAspectRatio: "4:5",
    promptFragment: "front neck crop on a model, focused on scale and neckline fit",
    preview: {
      scene: "neck",
      title: "Classic neckline",
      subtitle: "Empty model neckline",
      placement: "Your necklace appears here",
    },
  },
  {
    id: "necklace_traditional_saree",
    label: "Festive neckline",
    bestFor: "Bridal and ethnic look",
    jewelryTypes: ["necklace"],
    generationMode: "on_model",
    modelPresetId: "model_neck",
    defaultBackgroundPresetId: "deep_red_luxury",
    defaultAspectRatio: "4:5",
    promptFragment:
      "traditional blouse or saree neckline styling, cropped to show the necklace clearly",
    preview: {
      scene: "neck",
      title: "Festive neckline",
      subtitle: "Blouse-ready model",
      placement: "Your necklace appears here",
    },
  },
  {
    id: "ring_on_finger",
    label: "Hand model",
    bestFor: "Empty finger pose",
    jewelryTypes: ["ring"],
    generationMode: "on_model",
    modelPresetId: "model_hand",
    defaultBackgroundPresetId: "warm_ivory",
    defaultAspectRatio: "4:5",
    promptFragment: "ring on finger with palm down, clean buyer view",
    preview: {
      scene: "hand",
      title: "Hand model",
      subtitle: "Empty finger pose",
      placement: "Your ring appears here",
    },
  },
  {
    id: "ring_standing_studio",
    label: "White studio",
    bestFor: "Clean catalog setup",
    jewelryTypes: ["ring"],
    generationMode: "studio",
    modelPresetId: "studio_none",
    defaultBackgroundPresetId: "warm_ivory",
    defaultAspectRatio: "1:1",
    promptFragment: "ring standing in a studio catalog setup",
    preview: {
      scene: "studio-round",
      title: "White studio",
      subtitle: "Clean catalog setup",
      placement: "Your ring appears here",
    },
  },
  {
    id: "ring_stone_macro",
    label: "Close-up detail",
    bestFor: "Gemstone and carving",
    jewelryTypes: ["ring"],
    generationMode: "close_up",
    modelPresetId: "studio_none",
    defaultBackgroundPresetId: "charcoal_black",
    defaultAspectRatio: "1:1",
    promptFragment: "macro view of the ring stone and top details",
    preview: {
      scene: "macro",
      title: "Close-up detail",
      subtitle: "Gemstone and carving",
      placement: "Your ring detail fills this crop",
    },
  },
  {
    id: "bracelet_straight_wrist",
    label: "Classic wrist",
    bestFor: "Empty wrist pose",
    jewelryTypes: ["bracelet_bangle"],
    generationMode: "on_model",
    modelPresetId: "model_wrist",
    defaultBackgroundPresetId: "warm_ivory",
    defaultAspectRatio: "4:5",
    promptFragment:
      "wrist scale view only if the uploaded item can remain the exact same shape, without opening or bending the jewelry",
    preview: {
      scene: "wrist",
      title: "Classic wrist",
      subtitle: "Empty wrist pose",
      placement: "Your bracelet appears here",
    },
  },
  {
    id: "bracelet_studio_circular",
    label: "White studio",
    bestFor: "Clean bangle catalog",
    jewelryTypes: ["bracelet_bangle"],
    generationMode: "studio",
    modelPresetId: "studio_none",
    defaultBackgroundPresetId: "pure_white",
    defaultAspectRatio: "1:1",
    promptFragment:
      "full closed circular bangle or kada in a studio catalog layout, entire ring visible, centerpiece facing forward",
    preview: {
      scene: "studio-round",
      title: "White studio",
      subtitle: "Clean bangle catalog",
      placement: "Your bangle stays circular",
    },
  },
  {
    id: "earrings_on_ear_side",
    label: "Ear model",
    bestFor: "Empty ear close-up",
    jewelryTypes: ["earrings"],
    generationMode: "on_model",
    modelPresetId: "model_ear",
    defaultBackgroundPresetId: "warm_ivory",
    defaultAspectRatio: "4:5",
    promptFragment: "on-ear side crop showing earring scale and fit",
    preview: {
      scene: "ear",
      title: "Ear model",
      subtitle: "Empty ear close-up",
      placement: "Your earring appears here",
    },
  },
  {
    id: "earrings_pair_studio",
    label: "Pair studio",
    bestFor: "Clean catalog pair",
    jewelryTypes: ["earrings"],
    generationMode: "studio",
    modelPresetId: "studio_none",
    defaultBackgroundPresetId: "pure_white",
    defaultAspectRatio: "1:1",
    promptFragment: "pair of earrings presented as a studio catalog shot",
    preview: {
      scene: "studio-pair",
      title: "Pair studio",
      subtitle: "Clean catalog pair",
      placement: "Your earrings appear here",
    },
  },
  {
    id: "pendant_neck_closeup",
    label: "Pendant neckline",
    bestFor: "Empty neckline pose",
    jewelryTypes: ["pendant"],
    generationMode: "on_model",
    modelPresetId: "model_neck",
    defaultBackgroundPresetId: "warm_ivory",
    defaultAspectRatio: "4:5",
    promptFragment: "neck close-up showing pendant scale and placement",
    preview: {
      scene: "neck",
      title: "Pendant neckline",
      subtitle: "Empty neckline pose",
      placement: "Your pendant appears here",
    },
  },
  {
    id: "pendant_macro",
    label: "Close-up detail",
    bestFor: "Stone and craft detail",
    jewelryTypes: ["pendant"],
    generationMode: "close_up",
    modelPresetId: "studio_none",
    defaultBackgroundPresetId: "marble",
    defaultAspectRatio: "3:4",
    promptFragment: "close-up macro view of pendant stone and craftsmanship details",
    preview: {
      scene: "macro",
      title: "Close-up detail",
      subtitle: "Stone and craft detail",
      placement: "Your pendant detail fills this crop",
    },
  },
  {
    id: "other_studio_catalog",
    label: "Studio catalog",
    bestFor: "Clean product setup",
    jewelryTypes: ["other"],
    generationMode: "studio",
    modelPresetId: "studio_none",
    defaultBackgroundPresetId: "warm_ivory",
    defaultAspectRatio: "1:1",
    promptFragment: "simple studio catalog setup for the uploaded jewelry item",
    preview: {
      scene: "studio-generic",
      title: "Studio catalog",
      subtitle: "Clean product setup",
      placement: "Your item appears here",
    },
  },
];

export function getPosePreset(posePresetId: string) {
  return POSE_PRESETS.find((preset) => preset.id === posePresetId);
}

export function getPoseTemplatePreview(posePresetId: string) {
  return getPosePreset(posePresetId)?.preview;
}

export function getBackgroundPreset(backgroundPresetId: BackgroundPresetId) {
  return BACKGROUND_PRESET_OPTIONS.find(
    (preset) => preset.id === backgroundPresetId,
  );
}

export function getPosePresetsForJewelryType(jewelryType: JewelryType) {
  return POSE_PRESETS.filter((preset) =>
    preset.jewelryTypes.includes(jewelryType),
  );
}

export function getDefaultGenerationBrief(
  jewelryType: JewelryType,
): GenerationBrief {
  const preset =
    getPosePresetsForJewelryType(jewelryType)[0] ??
    POSE_PRESETS.find((option) => option.id === "ring_standing_studio")!;

  return {
    jewelryType,
    generationMode: preset.generationMode,
    modelPresetId: preset.modelPresetId,
    posePresetId: preset.id,
    backgroundPresetId: preset.defaultBackgroundPresetId,
    aspectRatio: preset.defaultAspectRatio,
    promptTemplateVersion: GUIDED_PROMPT_TEMPLATE_VERSION,
  };
}

export function isGenerationBriefCompatible(brief: GenerationBrief) {
  const preset = getPosePreset(brief.posePresetId);

  if (!preset) {
    return false;
  }

  return (
    preset.jewelryTypes.includes(brief.jewelryType) &&
    preset.generationMode === brief.generationMode &&
    preset.modelPresetId === brief.modelPresetId
  );
}
