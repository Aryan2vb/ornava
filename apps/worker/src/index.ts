import { GENERATION_MODES } from "@ornava/shared";
import { getModelRegistryEntry, resolveModelRoute } from "./model-registry";
import { closeGenerationWorker, startGenerationWorker } from "./queue";

for (const mode of GENERATION_MODES) {
  const route = resolveModelRoute(mode);
  const entry = getModelRegistryEntry(route);

  console.info(
    `[worker] ${mode} uses ${route} -> ${entry.provider}/${entry.modelId}`,
  );
}

const worker = startGenerationWorker();

console.info("[worker] Generation queue consumer ready.");

async function shutdown() {
  console.info("[worker] Shutting down.");
  await closeGenerationWorker(worker);
  process.exit(0);
}

process.once("SIGINT", () => {
  void shutdown();
});

process.once("SIGTERM", () => {
  void shutdown();
});
