import type { UploadCompleteResponse } from "@ornava/shared";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import {
  getCreatedImageForUser,
  markImageUploaded,
} from "@/lib/db";
import { getRequiredUserId } from "@/lib/session";
import { uploadOriginalObject } from "@/lib/storage";

const MAX_UPLOAD_BYTES = 20_000_000;

const paramsSchema = z.object({
  imageId: z.string().uuid(),
});

const proxyUploadSchema = z.object({
  objectKey: z.string().min(1),
  fileType: z.enum(["image/jpeg", "image/png"]),
  fileSizeBytes: z.number().int().positive().max(MAX_UPLOAD_BYTES),
});

type RouteParams = {
  params: Promise<{
    imageId: string;
  }>;
};

export async function POST(request: Request, { params }: RouteParams) {
  const userId = await getRequiredUserId();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const parsedParams = paramsSchema.parse(await params);
    const formData = await request.formData();
    const file = formData.get("file");
    const objectKey = formData.get("objectKey");

    if (!(file instanceof File) || typeof objectKey !== "string") {
      return NextResponse.json({ error: "invalid_proxy_upload" }, { status: 400 });
    }

    const uploadRequest = proxyUploadSchema.parse({
      objectKey,
      fileType: file.type,
      fileSizeBytes: file.size,
    });

    const image = await getCreatedImageForUser({
      userId,
      imageId: parsedParams.imageId,
      objectKey: uploadRequest.objectKey,
    });

    if (!image) {
      return NextResponse.json({ error: "image_not_found" }, { status: 404 });
    }

    await uploadOriginalObject({
      objectKey: uploadRequest.objectKey,
      fileType: uploadRequest.fileType,
      body: new Uint8Array(await file.arrayBuffer()),
    });

    const uploadedImage = await markImageUploaded({
      userId,
      imageId: parsedParams.imageId,
      objectKey: uploadRequest.objectKey,
    });

    if (!uploadedImage) {
      return NextResponse.json({ error: "image_not_found" }, { status: 404 });
    }

    const response: UploadCompleteResponse = {
      imageId: uploadedImage.id,
      status: "uploaded",
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "invalid_proxy_upload", issues: error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    console.error("[uploads:proxy]", error);
    return NextResponse.json({ error: "upload_proxy_failed" }, { status: 500 });
  }
}
