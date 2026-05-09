import { GENERATION_MODES } from "@ornava/shared";
import { getModelRegistryEntry, resolveModelRoute } from "./model-registry";

for (const mode of GENERATION_MODES) {
  const route = resolveModelRoute(mode);
  const entry = getModelRegistryEntry(route);

  console.info(
    `[worker] ${mode} uses ${route} -> ${entry.provider}/${entry.modelId}`,
  );
}

console.info("[worker] Phase 1 worker scaffold ready. Queue wiring comes in ENG-013.");
