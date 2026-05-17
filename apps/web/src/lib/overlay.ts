import { z } from "zod";

export const overlayTextSchema = z.object({
  purity: z.enum(["24K", "22K", "20K", "18K"]),
  weightGm: z.string().regex(/^\d+(\.\d{1,2})?$/, "Enter weight like 4.2"),
  position: z.enum(["top-left", "top-right", "bottom-left", "bottom-right", "bottom-center"]).default("bottom-left"),
  size: z.enum(["small", "medium", "large"]).default("medium"),
});

export type OverlayTextInput = z.infer<typeof overlayTextSchema>;

export function parseOverlayText(input: unknown) {
  return overlayTextSchema.parse(input);
}

export function overlayTextLabel(overlay: Pick<OverlayTextInput, "purity" | "weightGm">) {
  return `${overlay.purity} · ${overlay.weightGm}gm`;
}
