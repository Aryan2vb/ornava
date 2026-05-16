import type { CreateBatchResponse } from "@ornava/shared";
import { NextResponse } from "next/server";
import { createBatch } from "@/lib/db";
import { getRequiredUserId } from "@/lib/session";

export async function POST() {
  const userId = await getRequiredUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const batch = await createBatch({ userId });
  const response: CreateBatchResponse = { batchId: batch.id, status: "uploading" };
  return NextResponse.json(response, { status: 201 });
}
