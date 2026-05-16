import type { BatchStatusResponse } from "@ornava/shared";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getBatchForUser, getBatchImages, getBatchGenerations } from "@/lib/db";
import { env } from "@/lib/env";
import { getRequiredUserId } from "@/lib/session";
import { createObjectReadUrl } from "@/lib/storage";

const paramsSchema = z.object({ batchId: z.string().uuid() });

type RouteParams = { params: Promise<{ batchId: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  const userId = await getRequiredUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const includeOriginals = new URL(request.url).searchParams.get("includeOriginals") !== "false";
  const { batchId } = paramsSchema.parse(await params);
  const batch = await getBatchForUser({ userId, batchId });
  if (!batch) return NextResponse.json({ error: "batch_not_found" }, { status: 404 });

  const [images, generations] = await Promise.all([
    getBatchImages(batchId),
    getBatchGenerations(batchId),
  ]);
  const imageUrls = await Promise.all(
    images.map(async (image) => {
      if (!includeOriginals || image.status !== "uploaded") return null;
      const signed = await createObjectReadUrl({
        bucket: env.R2_ORIGINALS_BUCKET,
        objectKey: image.original_object_key,
      });
      return signed.url;
    }),
  );
  const uploadedImageCount = images.filter((image) => image.status === "uploaded").length;

  const response: BatchStatusResponse = {
    batchId: batch.id,
    status: batch.status as BatchStatusResponse["status"],
    generationBrief: batch.generation_brief,
    images: images.map((img, index) => ({
      imageId: img.id,
      uploadStatus: img.status,
      originalUrl: imageUrls[index] ?? undefined,
      overlayText: img.overlay_text,
    })),
    generations: generations.map((g) => ({
      generationId: g.id,
      imageId: g.image_id,
      status: g.status,
      failureCode: g.failure_code ?? undefined,
      failureMessage: g.failure_message_safe ?? undefined,
      generationDurationMs: g.generation_duration_ms ?? undefined,
      completedAt: g.completed_at ?? undefined,
      overlayText: g.overlay_text,
    })),
    totalImages: uploadedImageCount,
    completedCount: batch.completed_count,
    failedCount: batch.failed_count,
  };

  return NextResponse.json(response);
}
