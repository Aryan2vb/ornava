import { randomUUID } from "node:crypto";
import type { UploadInitResponse } from "@ornava/shared";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createImageUpload, getBatchForUser, getBatchImages } from "@/lib/db";
import { getRequiredUserId } from "@/lib/session";
import { logAnalyticsEventSafe } from "@/lib/events";
import { createOriginalUploadUrl } from "@/lib/storage";
import {
  buildOriginalObjectKey,
  validateUploadInitRequest,
} from "@/lib/upload";

const MAX_BATCH_SIZE = 10;

export async function POST(request: Request) {
  const userId = await getRequiredUserId();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const uploadRequest = validateUploadInitRequest(await request.json());
    if (uploadRequest.batchId) {
      const batch = await getBatchForUser({
        userId,
        batchId: uploadRequest.batchId,
      });
      if (!batch) {
        return NextResponse.json({ error: "batch_not_found" }, { status: 404 });
      }
      const images = await getBatchImages(uploadRequest.batchId);
      if (images.length >= MAX_BATCH_SIZE) {
        return NextResponse.json(
          { error: "batch_full", message: `A batch can contain up to ${MAX_BATCH_SIZE} images.` },
          { status: 409 },
        );
      }
    }

    const imageId = randomUUID();
    const objectKey = buildOriginalObjectKey({
      userId,
      imageId,
      fileName: uploadRequest.fileName,
      fileType: uploadRequest.fileType,
    });

    const signedUpload = await createOriginalUploadUrl({
      objectKey,
      fileType: uploadRequest.fileType,
    });

    await createImageUpload({
      imageId,
      userId,
      objectKey,
      fileType: uploadRequest.fileType,
      fileSizeBytes: uploadRequest.fileSizeBytes,
      width: uploadRequest.width,
      height: uploadRequest.height,
      batchId: uploadRequest.batchId,
    });
    await logAnalyticsEventSafe({
      userId,
      name: "upload_started",
      properties: {
        imageId,
        fileType: uploadRequest.fileType,
        fileSizeBytes: uploadRequest.fileSizeBytes,
        width: uploadRequest.width,
        height: uploadRequest.height,
      },
    });

    const response: UploadInitResponse = {
      imageId,
      objectKey,
      uploadUrl: signedUpload.uploadUrl,
      expiresAt: signedUpload.expiresAt,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "invalid_upload", issues: error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    console.error("[uploads:init]", error);
    return NextResponse.json({ error: "upload_init_failed" }, { status: 500 });
  }
}
