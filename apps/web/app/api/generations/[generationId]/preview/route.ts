import { NextResponse } from "next/server";
import sharp from "sharp";
import { z } from "zod";
import { getCompletedGenerationResultForUser } from "@/lib/db";
import { env } from "@/lib/env";
import { getRequiredUserId } from "@/lib/session";
import { createObjectReadUrl } from "@/lib/storage";

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
  const previewBytes = await sharp(imageBytes)
    .rotate()
    .resize({ width: 640, height: 640, fit: "cover" })
    .jpeg({ quality: 78, mozjpeg: true })
    .toBuffer();

  return new NextResponse(new Uint8Array(previewBytes), {
    status: 200,
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, max-age=900",
      "Content-Disposition": "inline",
    },
  });
}
