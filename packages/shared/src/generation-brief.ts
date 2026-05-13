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
    bestFor: "Front-facing center view",
    jewelryTypes: ["necklace"],
    generationMode: "on_model",
    modelPresetId: "model_neck",
    defaultBackgroundPresetId: "warm_ivory",
    defaultAspectRatio: "4:5",
    promptFragment: "front neck crop on a model, focused on scale and neckline fit",
    preview: {
      scene: "neck",
      title: "Centre",
      subtitle: "Front-facing center view",
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
      title: "Left angle",
      subtitle: "Slight left turn",
      placement: "Your necklace appears here",
    },
  },
  {
    id: "necklace_left_angle_2",
    label: "Left profile",
    bestFor: "Side profile view",
    jewelryTypes: ["necklace"],
    generationMode: "on_model",
    modelPresetId: "model_neck",
    defaultBackgroundPresetId: "warm_ivory",
    defaultAspectRatio: "4:5",
    promptFragment: "left profile neck crop on a model, showing necklace drape and side view",
    preview: {
      scene: "neck",
      title: "Left profile",
      subtitle: "Side profile view",
      placement: "Your necklace appears here",
    },
  },
  {
    id: "necklace_left_with_hand",
    label: "Left with hand",
    bestFor: "Hand touching necklace",
    jewelryTypes: ["necklace"],
    generationMode: "on_model",
    modelPresetId: "model_neck",
    defaultBackgroundPresetId: "warm_ivory",
    defaultAspectRatio: "4:5",
    promptFragment: "model with hand gently touching necklace, left angle, elegant pose",
    preview: {
      scene: "neck",
      title: "Left with hand",
      subtitle: "Hand touching necklace",
      placement: "Your necklace appears here",
    },
  },
  {
    id: "necklace_right_with_hand",
    label: "Right with hand",
    bestFor: "Hand near necklace, right angle",
    jewelryTypes: ["necklace"],
    generationMode: "on_model",
    modelPresetId: "model_neck",
    defaultBackgroundPresetId: "warm_ivory",
    defaultAspectRatio: "4:5",
    promptFragment: "model with hand near necklace, right angle, elegant catalog pose",
    preview: {
      scene: "neck",
      title: "Right with hand",
      subtitle: "Hand near necklace",
      placement: "Your necklace appears here",
    },
  },
  {
    id: "necklace_right_angle",
    label: "Right angle",
    bestFor: "Right side view",
    jewelryTypes: ["necklace"],
    generationMode: "on_model",
    modelPresetId: "model_neck",
    defaultBackgroundPresetId: "warm_ivory",
    defaultAspectRatio: "4:5",
    promptFragment: "right angle neck crop on a model, showing necklace from the right side",
    preview: {
      scene: "neck",
      title: "Right angle",
      subtitle: "Right side view",
      placement: "Your necklace appears here",
    },
  },
  {
    id: "necklace_other",
    label: "Other",
    bestFor: "Studio flat lay or custom",
    jewelryTypes: ["necklace"],
    generationMode: "studio",
    modelPresetId: "studio_none",
    defaultBackgroundPresetId: "pure_white",
    defaultAspectRatio: "4:5",
    promptFragment: "necklace in a clean studio catalog layout, flat or elevated display",
    preview: {
      scene: "studio-generic",
      title: "Other",
      subtitle: "Studio flat lay",
      placement: "Your necklace appears here",
    },
  },
  {
    id: "ring_on_finger",
    label: "Hand model",
    bestFor: "Ring on finger",
    jewelryTypes: ["ring"],
    generationMode: "on_model",
    modelPresetId: "model_hand",
    defaultBackgroundPresetId: "warm_ivory",
    defaultAspectRatio: "4:5",
    promptFragment: "ring on finger with palm down, clean buyer view",
    preview: {
      scene: "hand",
      title: "Pose 1",
      subtitle: "Hand model",
      placement: "Your ring appears here",
    },
  },
  {
    id: "ring_pose_2",
    label: "Pose 2",
    bestFor: "Ring on finger angle",
    jewelryTypes: ["ring"],
    generationMode: "on_model",
    modelPresetId: "model_hand",
    defaultBackgroundPresetId: "warm_ivory",
    defaultAspectRatio: "4:5",
    promptFragment: "ring on finger, angled hand pose showing ring detail",
    preview: {
      scene: "hand",
      title: "Pose 2",
      subtitle: "Angled hand",
      placement: "Your ring appears here",
    },
  },
  {
    id: "ring_pose_3",
    label: "Pose 3",
    bestFor: "Ring close view",
    jewelryTypes: ["ring"],
    generationMode: "on_model",
    modelPresetId: "model_hand",
    defaultBackgroundPresetId: "warm_ivory",
    defaultAspectRatio: "4:5",
    promptFragment: "ring on finger close-up, elegant hand pose",
    preview: {
      scene: "hand",
      title: "Pose 3",
      subtitle: "Close view",
      placement: "Your ring appears here",
    },
  },
  {
    id: "ring_pose_4",
    label: "Pose 4",
    bestFor: "Ring display pose",
    jewelryTypes: ["ring"],
    generationMode: "on_model",
    modelPresetId: "model_hand",
    defaultBackgroundPresetId: "warm_ivory",
    defaultAspectRatio: "4:5",
    promptFragment: "ring displayed on hand, catalog-ready pose",
    preview: {
      scene: "hand",
      title: "Pose 4",
      subtitle: "Display pose",
      placement: "Your ring appears here",
    },
  },
  {
    id: "ring_pose_5",
    label: "Pose 5",
    bestFor: "Ring side angle",
    jewelryTypes: ["ring"],
    generationMode: "on_model",
    modelPresetId: "model_hand",
    defaultBackgroundPresetId: "warm_ivory",
    defaultAspectRatio: "4:5",
    promptFragment: "ring on finger, side angle showing band and stone",
    preview: {
      scene: "hand",
      title: "Pose 5",
      subtitle: "Side angle",
      placement: "Your ring appears here",
    },
  },
  {
    id: "ring_pose_6",
    label: "Pose 6",
    bestFor: "Ring top view",
    jewelryTypes: ["ring"],
    generationMode: "on_model",
    modelPresetId: "model_hand",
    defaultBackgroundPresetId: "warm_ivory",
    defaultAspectRatio: "4:5",
    promptFragment: "ring on finger, top-down view highlighting the stone",
    preview: {
      scene: "hand",
      title: "Pose 6",
      subtitle: "Top view",
      placement: "Your ring appears here",
    },
  },
  {
    id: "ring_other",
    label: "Other",
    bestFor: "Studio catalog setup",
    jewelryTypes: ["ring"],
    generationMode: "studio",
    modelPresetId: "studio_none",
    defaultBackgroundPresetId: "warm_ivory",
    defaultAspectRatio: "4:5",
    promptFragment: "ring standing in a studio catalog setup",
    preview: {
      scene: "studio-round",
      title: "Other",
      subtitle: "Studio setup",
      placement: "Your ring appears here",
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
    defaultAspectRatio: "4:5",
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
    bestFor: "Ear close-up",
    jewelryTypes: ["earrings"],
    generationMode: "on_model",
    modelPresetId: "model_ear",
    defaultBackgroundPresetId: "warm_ivory",
    defaultAspectRatio: "4:5",
    promptFragment: "on-ear side crop showing earring scale and fit",
    preview: {
      scene: "ear",
      title: "Pose 1",
      subtitle: "Ear close-up",
      placement: "Your earring appears here",
    },
  },
  {
    id: "earrings_pose_2",
    label: "Pose 2",
    bestFor: "Ear angle view",
    jewelryTypes: ["earrings"],
    generationMode: "on_model",
    modelPresetId: "model_ear",
    defaultBackgroundPresetId: "warm_ivory",
    defaultAspectRatio: "4:5",
    promptFragment: "earring on ear, angled view showing drop and detail",
    preview: {
      scene: "ear",
      title: "Pose 2",
      subtitle: "Angle view",
      placement: "Your earring appears here",
    },
  },
  {
    id: "earrings_pose_3",
    label: "Pose 3",
    bestFor: "Profile with earring",
    jewelryTypes: ["earrings"],
    generationMode: "on_model",
    modelPresetId: "model_ear",
    defaultBackgroundPresetId: "warm_ivory",
    defaultAspectRatio: "4:5",
    promptFragment: "profile view with earring visible, elegant pose",
    preview: {
      scene: "ear",
      title: "Pose 3",
      subtitle: "Profile view",
      placement: "Your earring appears here",
    },
  },
  {
    id: "earrings_pose_4",
    label: "Pose 4",
    bestFor: "Front-facing earring",
    jewelryTypes: ["earrings"],
    generationMode: "on_model",
    modelPresetId: "model_ear",
    defaultBackgroundPresetId: "warm_ivory",
    defaultAspectRatio: "4:5",
    promptFragment: "front-facing model with earring clearly visible",
    preview: {
      scene: "ear",
      title: "Pose 4",
      subtitle: "Front facing",
      placement: "Your earring appears here",
    },
  },
  {
    id: "earrings_other",
    label: "Other",
    bestFor: "Studio pair layout",
    jewelryTypes: ["earrings"],
    generationMode: "studio",
    modelPresetId: "studio_none",
    defaultBackgroundPresetId: "pure_white",
    defaultAspectRatio: "4:5",
    promptFragment: "pair of earrings presented as a studio catalog shot",
    preview: {
      scene: "studio-pair",
      title: "Other",
      subtitle: "Studio pair",
      placement: "Your earrings appear here",
    },
  },
  {
    id: "pendant_neck_closeup",
    label: "Centre",
    bestFor: "Front-facing center view",
    jewelryTypes: ["pendant"],
    generationMode: "on_model",
    modelPresetId: "model_neck",
    defaultBackgroundPresetId: "warm_ivory",
    defaultAspectRatio: "4:5",
    promptFragment: "front neck crop on a model, focused on pendant scale and placement",
    preview: {
      scene: "neck",
      title: "Centre",
      subtitle: "Front-facing center view",
      placement: "Your pendant appears here",
    },
  },
  {
    id: "pendant_left_angle",
    label: "Left angle",
    bestFor: "Slight left turn",
    jewelryTypes: ["pendant"],
    generationMode: "on_model",
    modelPresetId: "model_neck",
    defaultBackgroundPresetId: "warm_ivory",
    defaultAspectRatio: "4:5",
    promptFragment: "left angle neck crop showing pendant drape and placement",
    preview: {
      scene: "neck",
      title: "Left angle",
      subtitle: "Slight left turn",
      placement: "Your pendant appears here",
    },
  },
  {
    id: "pendant_left_profile",
    label: "Left profile",
    bestFor: "Side profile view",
    jewelryTypes: ["pendant"],
    generationMode: "on_model",
    modelPresetId: "model_neck",
    defaultBackgroundPresetId: "warm_ivory",
    defaultAspectRatio: "4:5",
    promptFragment: "left profile neck crop on a model, showing pendant from the side",
    preview: {
      scene: "neck",
      title: "Left profile",
      subtitle: "Side profile view",
      placement: "Your pendant appears here",
    },
  },
  {
    id: "pendant_left_with_hand",
    label: "Left with hand",
    bestFor: "Hand touching pendant",
    jewelryTypes: ["pendant"],
    generationMode: "on_model",
    modelPresetId: "model_neck",
    defaultBackgroundPresetId: "warm_ivory",
    defaultAspectRatio: "4:5",
    promptFragment: "model with hand gently touching pendant, left angle, elegant pose",
    preview: {
      scene: "neck",
      title: "Left with hand",
      subtitle: "Hand touching pendant",
      placement: "Your pendant appears here",
    },
  },
  {
    id: "pendant_right_with_hand",
    label: "Right with hand",
    bestFor: "Hand near pendant, right angle",
    jewelryTypes: ["pendant"],
    generationMode: "on_model",
    modelPresetId: "model_neck",
    defaultBackgroundPresetId: "warm_ivory",
    defaultAspectRatio: "4:5",
    promptFragment: "model with hand near pendant, right angle, elegant catalog pose",
    preview: {
      scene: "neck",
      title: "Right with hand",
      subtitle: "Hand near pendant",
      placement: "Your pendant appears here",
    },
  },
  {
    id: "pendant_right_angle",
    label: "Right angle",
    bestFor: "Right side view",
    jewelryTypes: ["pendant"],
    generationMode: "on_model",
    modelPresetId: "model_neck",
    defaultBackgroundPresetId: "warm_ivory",
    defaultAspectRatio: "4:5",
    promptFragment: "right angle neck crop on a model, showing pendant from the right side",
    preview: {
      scene: "neck",
      title: "Right angle",
      subtitle: "Right side view",
      placement: "Your pendant appears here",
    },
  },
  {
    id: "pendant_other",
    label: "Other",
    bestFor: "Studio flat lay or macro",
    jewelryTypes: ["pendant"],
    generationMode: "studio",
    modelPresetId: "studio_none",
    defaultBackgroundPresetId: "marble",
    defaultAspectRatio: "4:5",
    promptFragment: "pendant in a clean studio catalog layout, showing craftsmanship details",
    preview: {
      scene: "studio-generic",
      title: "Other",
      subtitle: "Studio layout",
      placement: "Your pendant appears here",
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
    defaultAspectRatio: "4:5",
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
