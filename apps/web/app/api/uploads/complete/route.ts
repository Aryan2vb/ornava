import type { UploadCompleteResponse } from "@ornava/shared";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { markImageUploaded } from "@/lib/db";
import { getRequiredUserId } from "@/lib/session";

const completeUploadSchema = z.object({
  imageId: z.string().uuid(),
  objectKey: z.string().min(1),
});

export async function POST(request: Request) {
  const userId = await getRequiredUserId();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const uploadRequest = completeUploadSchema.parse(await request.json());
    const image = await markImageUploaded({
      userId,
      imageId: uploadRequest.imageId,
      objectKey: uploadRequest.objectKey,
    });

    if (!image) {
      return NextResponse.json({ error: "image_not_found" }, { status: 404 });
    }

    const response: UploadCompleteResponse = {
      imageId: image.id,
      status: "uploaded",
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "invalid_upload_complete", issues: error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    console.error("[uploads:complete]", error);
    return NextResponse.json({ error: "upload_complete_failed" }, { status: 500 });
  }
}
