import type { GenerationMode, GenerationStatus } from "@ornava/shared";

export const betaNavItems = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/upload", label: "Create", icon: "plus" },
  { href: "/gallery", label: "Gallery", icon: "image" },
  { href: "/profile", label: "Profile", icon: "user" },
] as const;

export const generationModeCards: Record<
  GenerationMode,
  {
    title: string;
    description: string;
    cta: string;
    icon: "user" | "bag" | "search";
  }
> = {
  on_model: {
    title: "On model",
    description: "Best when buyer needs scale and styling.",
    cta: "Generate on model",
    icon: "user",
  },
  studio: {
    title: "Studio catalog",
    description: "Clean image for reseller lists and product grids.",
    cta: "Generate studio catalog",
    icon: "bag",
  },
  close_up: {
    title: "Close-up detail",
    description: "Highlight stones, finish, prongs, and polish.",
    cta: "Generate close-up",
    icon: "search",
  },
};

export type UploadActivityStep =
  | "reading"
  | "optimizing"
  | "preparing"
  | "uploading"
  | "saving"
  | "uploaded";

export const uploadActivitySteps: Record<
  UploadActivityStep,
  { label: string; progress: number }
> = {
  reading: { label: "Reading image", progress: 12 },
  optimizing: { label: "Optimizing for generation", progress: 38 },
  preparing: { label: "Preparing secure upload", progress: 58 },
  uploading: { label: "Uploading optimized image", progress: 82 },
  saving: { label: "Saving upload", progress: 94 },
  uploaded: { label: "Upload ready", progress: 100 },
};

export function getUploadStepProgress(step: UploadActivityStep) {
  return uploadActivitySteps[step].progress;
}

export function getGenerationProgressPercent(
  status: GenerationStatus | undefined,
  elapsedSeconds: number,
) {
  if (status === "completed") {
    return 100;
  }

  if (status === "failed") {
    return 100;
  }

  if (status === "processing") {
    return Math.min(92, 34 + Math.floor(elapsedSeconds * 0.46));
  }

  if (status === "queued") {
    return Math.min(32, 10 + Math.floor(elapsedSeconds * 0.36));
  }

  return Math.min(18, 6 + Math.floor(elapsedSeconds * 0.25));
}
