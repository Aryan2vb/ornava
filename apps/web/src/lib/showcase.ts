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

const updateShowcaseInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
});

export type NormalizedCreateShowcaseInput = {
  title: string;
  generationIds: string[];
};

export type NormalizedUpdateShowcaseInput = {
  title: string;
};

export function normalizeCreateShowcaseInput(input: unknown): NormalizedCreateShowcaseInput {
  const parsed = createShowcaseInputSchema.parse(input);

  return {
    title: parsed.title ?? DEFAULT_SHOWCASE_TITLE,
    generationIds: [...new Set(parsed.generationIds)],
  };
}

export function normalizeUpdateShowcaseInput(input: unknown): NormalizedUpdateShowcaseInput {
  return updateShowcaseInputSchema.parse(input);
}

export function buildShowcaseWhatsappInquiryUrl(input: {
  phone?: string | null;
  showcaseUrl: string;
  designNumber?: number;
  designNumbers?: number[];
}) {
  const phone = input.phone?.replace(/\D/g, "");
  const designNumbers = input.designNumbers?.length
    ? [...new Set(input.designNumbers)].sort((a, b) => a - b)
    : input.designNumber
      ? [input.designNumber]
      : [];
  const designUrls = designNumbers.map((designNumber) => {
    const designUrl = new URL(input.showcaseUrl);
    designUrl.searchParams.set("d", String(designNumber));
    return { designNumber, designUrl };
  });
  const message =
    designUrls.length > 1
      ? [
          "Hi! I am interested in these designs:",
          ...designUrls.map(
            ({ designNumber, designUrl }) =>
              `Design ${designNumber}: ${designUrl}`,
          ),
        ].join("\n")
      : `Hi! I am interested in this design:\n${designUrls[0]?.designUrl ?? input.showcaseUrl}`;

  return `https://wa.me/${phone ?? ""}?text=${encodeURIComponent(message)}`;
}

export function buildShowcaseWhatsappShareText(showcaseUrl: string) {
  return [
    "New jewelry collection for you.",
    `View the selected designs: ${showcaseUrl}`,
    "Reply on WhatsApp to ask about any design.",
  ].join("\n\n");
}

export function formatShowcaseSummaryMeta(input: {
  itemCount: number;
  createdAt: string;
}) {
  const itemLabel = input.itemCount === 1 ? "design" : "designs";
  const createdLabel = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(new Date(input.createdAt));

  return `${input.itemCount} ${itemLabel} · ${createdLabel}`;
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
