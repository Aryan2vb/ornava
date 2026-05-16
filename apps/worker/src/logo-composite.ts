import sharp from "sharp";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getR2Client } from "./storage";
import { getPool } from "./db";
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
  enabled: boolean;
};

// Simple LRU cache for logo buffers (avoids R2 read per generation)
const logoCache = new Map<string, { buffer: Buffer; fetchedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min
const CACHE_MAX = 50;

export async function getUserLogoSettings(
  userId: string,
): Promise<LogoSettings | null> {
  const result = await getPool().query(
    `select logo_object_key, position, size_percent, enabled
     from user_logo_settings where user_id = $1 and enabled = true`,
    [userId],
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    logoObjectKey: row.logo_object_key,
    position: row.position,
    sizePercent: row.size_percent,
    enabled: row.enabled,
  };
}

async function fetchLogoBuffer(objectKey: string): Promise<Buffer> {
  const cached = logoCache.get(objectKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.buffer;
  }

  const response = await getR2Client().send(
    new GetObjectCommand({
      Bucket: env.R2_ORIGINALS_BUCKET,
      Key: objectKey,
    }),
  );

  if (!response.Body) throw new Error("Logo object body is empty");

  const buffer = Buffer.from(await response.Body.transformToByteArray());

  // Evict oldest if at capacity
  if (logoCache.size >= CACHE_MAX) {
    const oldest = [...logoCache.entries()].sort(
      (a, b) => a[1].fetchedAt - b[1].fetchedAt,
    )[0];
    if (oldest) logoCache.delete(oldest[0]);
  }

  logoCache.set(objectKey, { buffer, fetchedAt: Date.now() });
  return buffer;
}

function computeGravity(
  position: LogoPosition,
  imageWidth: number,
  imageHeight: number,
  logoWidth: number,
  logoHeight: number,
): { left: number; top: number } {
  const padding = Math.round(imageWidth * 0.03); // 3% padding from edges

  switch (position) {
    case "top-left":
      return { left: padding, top: padding };
    case "top-right":
      return { left: imageWidth - logoWidth - padding, top: padding };
    case "bottom-left":
      return { left: padding, top: imageHeight - logoHeight - padding };
    case "bottom-right":
      return {
        left: imageWidth - logoWidth - padding,
        top: imageHeight - logoHeight - padding,
      };
    case "bottom-center":
      return {
        left: Math.round((imageWidth - logoWidth) / 2),
        top: imageHeight - logoHeight - padding,
      };
  }
}

/**
 * Composite user's logo onto a generated image.
 * Returns the branded image buffer, or null if user has no logo configured.
 */
export async function compositeLogoOnImage(
  imageBuffer: Uint8Array,
  userId: string,
): Promise<Buffer | null> {
  const settings = await getUserLogoSettings(userId);
  if (!settings) return null;

  const logoBuffer = await fetchLogoBuffer(settings.logoObjectKey);
  const image = sharp(imageBuffer);
  const { width: imgW, height: imgH } = await image.metadata();

  if (!imgW || !imgH) return null;

  const targetLogoWidth = Math.round(imgW * (settings.sizePercent / 100));
  const resizedLogo = await sharp(logoBuffer)
    .resize(targetLogoWidth, undefined, { fit: "inside" })
    .toBuffer();

  const logoMeta = await sharp(resizedLogo).metadata();
  const logoW = logoMeta.width ?? targetLogoWidth;
  const logoH = logoMeta.height ?? targetLogoWidth;

  const { left, top } = computeGravity(
    settings.position,
    imgW,
    imgH,
    logoW,
    logoH,
  );

  return image
    .composite([{ input: resizedLogo, left, top }])
    .jpeg({ quality: 90 })
    .toBuffer();
}
