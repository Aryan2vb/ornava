import type { GenerationStatus } from "@ornava/shared";

export type AdminGenerationTone = "active" | "danger" | "muted" | "success";

export function formatAdminDuration(durationMs: number | null | undefined) {
  if (durationMs === null || durationMs === undefined) {
    return "n/a";
  }

  return `${Math.round(durationMs / 1000)}s`;
}

export function statusToneForGeneration(
  status: GenerationStatus,
): AdminGenerationTone {
  if (status === "completed") {
    return "success";
  }

  if (status === "failed" || status === "cancelled") {
    return "danger";
  }

  if (status === "processing") {
    return "active";
  }

  return "muted";
}
