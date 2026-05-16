import { getPool } from "./db";
import { createObjectReadUrl } from "./storage";
import { env } from "./env";

export type LogoPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "bottom-center";

export type LogoSettings = {
  logoObjectKey: string;
  position: LogoPosition;
  sizePercent: number;
};

// In-memory cache for logo buffers (avoids R2 read per download)
const logoCache = new Map<string, { buffer: Buffer; fetchedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX = 50;

export async function getUserLogoSettings(
  userId: string,
): Promise<LogoSettings | null> {
  const result = await getPool().query(
    `select logo_object_key, position, size_percent
     from user_logo_settings where user_id = $1 and enabled = true`,
    [userId],
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    logoObjectKey: row.logo_object_key,
    position: row.position,
    sizePercent: row.size_percent,
  };
}

export async function fetchLogoBuffer(objectKey: string): Promise<Buffer> {
  const cached = logoCache.get(objectKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.buffer;
  }

  const { url } = await createObjectReadUrl({
    bucket: env.R2_ORIGINALS_BUCKET,
    objectKey,
  });

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch logo: ${res.status}`);

  const buffer = Buffer.from(await res.arrayBuffer());

  if (logoCache.size >= CACHE_MAX) {
    const oldest = [...logoCache.entries()].sort(
      (a, b) => a[1].fetchedAt - b[1].fetchedAt,
    )[0];
    if (oldest) logoCache.delete(oldest[0]);
  }

  logoCache.set(objectKey, { buffer, fetchedAt: Date.now() });
  return buffer;
}

export function computeLogoPosition(
  position: LogoPosition,
  imageWidth: number,
  imageHeight: number,
  logoWidth: number,
  logoHeight: number,
): { left: number; top: number } {
  const padding = Math.round(imageWidth * 0.03);

  switch (position) {
    case "top-left":
      return { left: padding, top: padding };
    case "top-right":
      return { left: imageWidth - logoWidth - padding, top: padding };
    case "bottom-left":
      return { left: padding, top: imageHeight - logoHeight - padding };
    case "bottom-right":
      return { left: imageWidth - logoWidth - padding, top: imageHeight - logoHeight - padding };
    case "bottom-center":
      return { left: Math.round((imageWidth - logoWidth) / 2), top: imageHeight - logoHeight - padding };
  }
}

export type OverlayText = {
  purity: string;
  weightGm: string;
  position: LogoPosition;
  size?: "small" | "medium" | "large";
};

const TEXT_SIZE_SCALE: Record<string, number> = {
  small: 0.018,
  medium: 0.022,
  large: 0.028,
};

/**
 * Create a text pill SVG (dark text on semi-transparent white rounded rect).
 * Returns a Sharp-compatible buffer.
 */
export function createTextPillSvg(
  text: string,
  imageWidth: number,
  size: "small" | "medium" | "large" = "medium",
): Buffer {
  const fontSize = Math.round(imageWidth * TEXT_SIZE_SCALE[size]);
  const paddingX = Math.round(fontSize * 0.8);
  const paddingY = Math.round(fontSize * 0.4);
  const textWidth = text.length * fontSize * 0.55;
  const width = Math.round(textWidth + paddingX * 2);
  const height = Math.round(fontSize + paddingY * 2);
  const radius = Math.round(height * 0.35);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="rgba(255,255,255,0.72)"/>
    <text x="${paddingX}" y="${height - paddingY - 1}" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="600" fill="#1A1A1A">${text}</text>
  </svg>`;

  return Buffer.from(svg);
}
