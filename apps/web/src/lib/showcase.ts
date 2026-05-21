import { z } from "zod";

export const DEFAULT_SHOWCASE_TITLE = "My Catalog Collection";
export const MAX_SHOWCASE_ITEMS = 50;

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

export function getViewerLocationFromHeaders(headers: Headers) {
  const city = decodeLocationHeader(
    headers.get("x-vercel-ip-city") ?? headers.get("cf-ipcity"),
  );
  const region = decodeLocationHeader(
    headers.get("x-vercel-ip-country-region") ?? headers.get("cf-region"),
  );
  const country = decodeLocationHeader(
    headers.get("x-vercel-ip-country") ?? headers.get("cf-ipcountry"),
  );
  const parts = [city, region, country].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : null;
}

export function describeShowcaseViewer(input: {
  deviceInfo?: string | null;
  viewerLocation?: string | null;
}) {
  if (input.viewerLocation) {
    return `A client in ${input.viewerLocation}`;
  }

  const device = getShowcaseDeviceLabel(input.deviceInfo);
  return device ? `A client on ${device}` : "A client";
}

export function buildShowcaseWhatsappInquiryUrl(input: {
  phone?: string | null;
  showcaseUrl: string;
  imageUrl: string;
}) {
  const phone = input.phone?.replace(/\D/g, "");
  const message = [
    `Hi! I am interested in this design from your showcase: ${input.imageUrl}`,
    `Showcase: ${input.showcaseUrl}`,
  ].join("\n\n");

  return `https://wa.me/${phone ?? ""}?text=${encodeURIComponent(message)}`;
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

function decodeLocationHeader(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return decodeURIComponent(value).trim() || null;
  } catch {
    return value.trim() || null;
  }
}

function getShowcaseDeviceLabel(deviceInfo?: string | null) {
  if (!deviceInfo) {
    return null;
  }

  if (/iphone/i.test(deviceInfo)) {
    return "iPhone";
  }

  if (/ipad/i.test(deviceInfo)) {
    return "iPad";
  }

  if (/android/i.test(deviceInfo)) {
    return "Android";
  }

  if (/mac/i.test(deviceInfo)) {
    return "Mac";
  }

  if (/windows/i.test(deviceInfo)) {
    return "Windows";
  }

  return null;
}
