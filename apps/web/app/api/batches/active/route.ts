import { NextResponse } from "next/server";
import { getActiveBatchForUser, getBatchImages } from "@/lib/db";
import { getRequiredUserId } from "@/lib/session";

export async function GET() {
  const userId = await getRequiredUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const batch = await getActiveBatchForUser(userId);
  if (!batch) return NextResponse.json({ batch: null });
  const images = await getBatchImages(batch.id);
  const uploadedCount = images.filter((image) => image.status === "uploaded").length;

  return NextResponse.json({
    batch: {
      batchId: batch.id,
      status: batch.status,
      imageCount: uploadedCount,
      generatedCount: batch.generated_count,
      completedCount: batch.completed_count,
      failedCount: batch.failed_count,
    },
  });
}
