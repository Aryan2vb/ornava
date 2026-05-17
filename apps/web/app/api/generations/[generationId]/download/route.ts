import { NextResponse } from "next/server";
import { z } from "zod";
import sharp, { type OverlayOptions } from "sharp";
import { getCompletedGenerationResultForUser } from "@/lib/db";
import { env } from "@/lib/env";
import { createObjectReadUrl } from "@/lib/storage";
import { getRequiredUserId } from "@/lib/session";
import { getUserLogoSettings, fetchLogoBuffer, computeLogoPosition, createTextPillSvg, type OverlayText } from "@/lib/logo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const paramsSchema = z.object({
  generationId: z.string().uuid(),
});

type RouteParams = {
  params: Promise<{ generationId: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const userId = await getRequiredUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "invalid_generation" }, { status: 400 });
  }

  const generation = await getCompletedGenerationResultForUser({
    userId,
    generationId: parsedParams.data.generationId,
  });

  if (!generation) {
    return NextResponse.json({ error: "result_not_found" }, { status: 404 });
  }

  const signed = await createObjectReadUrl({
    bucket: env.R2_GENERATED_BUCKET,
    objectKey: generation.output_object_key,
  });

  const r2Response = await fetch(signed.url);
  if (!r2Response.ok) {
    return NextResponse.json({ error: "r2_read_failed" }, { status: 502 });
  }

  const imageBytes = new Uint8Array(await r2Response.arrayBuffer());
  const url = new URL(_request.url);
  const wantClean = url.searchParams.get("clean") === "true";

  let outputBytes: Uint8Array | Buffer = imageBytes;

  if (!wantClean) {
    try {
      const [logoSettings, overlayText] = await Promise.all([
        getUserLogoSettings(userId),
        Promise.resolve(generation.overlay_text as OverlayText | null),
      ]);

      const composites: OverlayOptions[] = [];
      const image = sharp(imageBytes);
      const { width: imgW, height: imgH } = await image.metadata();

      if (imgW && imgH) {
        // Logo composite
        if (logoSettings) {
          const logoBuffer = await fetchLogoBuffer(
            logoSettings.logoObjectKey,
            logoSettings.cacheVersion,
          );
          const targetLogoWidth = Math.round(imgW * (logoSettings.sizePercent / 100));
          const resizedLogo = await sharp(logoBuffer)
            .resize(targetLogoWidth, undefined, { fit: "inside" })
            .toBuffer();
          const logoMeta = await sharp(resizedLogo).metadata();
          const { left, top } = computeLogoPosition(
            logoSettings.position, imgW, imgH,
            logoMeta.width ?? targetLogoWidth,
            logoMeta.height ?? targetLogoWidth,
          );
          composites.push({ input: resizedLogo, left, top });
        }

        // Text pill composite
        if (overlayText?.purity && overlayText?.weightGm) {
          const text = `Purity: ${overlayText.purity} | Weight: ${overlayText.weightGm}gm`;
          const pillSvg = createTextPillSvg(text, imgW, overlayText.size ?? "medium");
          const pillMeta = await sharp(pillSvg).metadata();
          const pillW = pillMeta.width ?? Math.round(imgW * 0.2);
          const pillH = pillMeta.height ?? Math.round(imgW * 0.04);
          const { left, top } = computeLogoPosition(
            overlayText.position as any, imgW, imgH, pillW, pillH,
          );
          composites.push({ input: pillSvg, left, top });
        }

        if (composites.length > 0) {
          outputBytes = await image
            .composite(composites)
            .jpeg({ quality: 90 })
            .toBuffer();
        }
      }

      console.info("[download]", {
        generationId: parsedParams.data.generationId,
        userId,
        hasLogo: !!logoSettings,
        hasOverlay: !!overlayText,
        composites: composites.length,
      });
    } catch (err) {
      console.warn("[download] composite failed, serving clean:", err);
    }
  }

  const fileName = `ornava-${generation.mode}-${generation.id.slice(0, 8)}.jpg`;

  return new NextResponse(Buffer.from(outputBytes), {
    status: 200,
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "private, max-age=60",
    },
  });
}
