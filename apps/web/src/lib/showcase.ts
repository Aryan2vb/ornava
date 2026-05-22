import { z } from "zod";

export const DEFAULT_SHOWCASE_TITLE = "My Catalog Collection";
export const MAX_SHOWCASE_ITEMS = 50;

export function buildShowcasePublicPath(publicCode: string) {
  return `/s/${publicCode}`;
}

const createShowcaseInputSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  generationIds: z.array(z.string().uuid()).min(1).max(MAX_SHOWCASE_ITEMS),
});

export type NormalizedCreateShowcaseInput = {
  title: string;
  generationIds: string[];
};

export function normalizeCreateShowcaseInput(input: unknown): NormalizedCreateShowcaseInput {
  const parsed = createShowcaseInputSchema.parse(input);

  return {
    title: parsed.title ?? DEFAULT_SHOWCASE_TITLE,
    generationIds: [...new Set(parsed.generationIds)],
  };
}

export function buildShowcaseWhatsappInquiryUrl(input: {
  phone?: string | null;
  showcaseUrl: string;
  designNumber: number;
}) {
  const phone = input.phone?.replace(/\D/g, "");
  const designUrl = new URL(input.showcaseUrl);
  designUrl.searchParams.set("d", String(input.designNumber));
  const message = `Hi! I am interested in this design:\n${designUrl}`;

  return `https://wa.me/${phone ?? ""}?text=${encodeURIComponent(message)}`;
}

export function buildShowcaseWhatsappShareText(showcaseUrl: string) {
  return [
    "New jewelry collection for you.",
    `View the selected designs: ${showcaseUrl}`,
    "Reply on WhatsApp to ask about any design.",
  ].join("\n\n");
}

export function shouldLoadShowcaseCandidates(input: {
  open: boolean;
  loaded: boolean;
  loading: boolean;
}) {
  return input.open && !input.loaded && !input.loading;
}

export function toggleShowcaseGenerationSelection(
  generationIds: string[],
  generationId: string,
) {
  if (generationIds.includes(generationId)) {
    return generationIds.filter((id) => id !== generationId);
  }

  if (generationIds.length >= MAX_SHOWCASE_ITEMS) {
    return generationIds;
  }

  return [...generationIds, generationId];
}
