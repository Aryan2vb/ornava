import type {
  GenerationMode,
  ImageModelRegistryEntry,
} from "@ornava/shared";
import { env } from "./env";

export const imageModelRegistry = {
  "ornava-default-v1": {
    provider: "fal",
    modelId: "openai/gpt-image-2/edit",
    adapter: "falImageEdit",
    enabled: true,
    capabilities: {
      imageToImage: true,
      supportsAspectRatio: ["1:1", "4:5", "9:16"],
      supportsMultipleInputs: false,
      supportsStreaming: false,
    },
    limits: {
      maxInputBytes: 4_000_000,
      maxLongEdgePx: 2048,
      timeoutMs: 120_000,
    },
    cost: {
      unit: "per_image",
      estimatedMinor: 0,
      currency: "INR",
    },
  },
} satisfies Record<string, ImageModelRegistryEntry>;

export type ImageModelRoute = keyof typeof imageModelRegistry;

const modeEnvMap: Record<GenerationMode, string | undefined> = {
  studio: env.IMAGE_MODEL_STUDIO,
  on_model: env.IMAGE_MODEL_ON_MODEL,
  close_up: env.IMAGE_MODEL_CLOSE_UP,
};

export function resolveModelRoute(mode: GenerationMode): ImageModelRoute {
  const route = modeEnvMap[mode] || env.IMAGE_MODEL_DEFAULT;

  if (!Object.hasOwn(imageModelRegistry, route)) {
    throw new Error(`Unknown image model route: ${route}`);
  }

  return route as ImageModelRoute;
}

export function getModelRegistryEntry(route: ImageModelRoute) {
  const entry = imageModelRegistry[route];

  if (!entry.enabled) {
    throw new Error(`Image model route is disabled: ${route}`);
  }

  return entry;
}
