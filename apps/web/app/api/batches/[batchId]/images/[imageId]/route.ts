import { NextResponse } from "next/server";
import { z } from "zod";
import { getBatchForUser, removeBatchImageForUser } from "@/lib/db";
import { getRequiredUserId } from "@/lib/session";

const paramsSchema = z.object({
  batchId: z.string().uuid(),
  imageId: z.string().uuid(),
});

type RouteParams = {
  params: Promise<{
    batchId: string;
    imageId: string;
  }>;
};

export async function DELETE(_request: Request, { params }: RouteParams) {
  const userId = await getRequiredUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "invalid_batch_image" }, { status: 400 });
  }

  const { batchId, imageId } = parsedParams.data;
  const batch = await getBatchForUser({ userId, batchId });
  if (!batch) {
    return NextResponse.json({ error: "batch_not_found" }, { status: 404 });
  }
  if (batch.status === "generating" || batch.status === "completed") {
    return NextResponse.json({ error: "batch_locked" }, { status: 409 });
  }

  const removed = await removeBatchImageForUser({ userId, batchId, imageId });
  if (!removed) {
    return NextResponse.json({ error: "image_not_found" }, { status: 404 });
  }

  return NextResponse.json({ imageId, status: "removed" });
}
