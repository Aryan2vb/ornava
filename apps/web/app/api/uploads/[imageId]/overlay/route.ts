import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import {
  clearImageOverlayTextForUser,
  updateImageOverlayTextForUser,
} from "@/lib/db";
import { parseOverlayText } from "@/lib/overlay";
import { getRequiredUserId } from "@/lib/session";

const paramsSchema = z.object({
  imageId: z.string().uuid(),
});

type RouteParams = {
  params: Promise<{
    imageId: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  const userId = await getRequiredUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "invalid_image" }, { status: 400 });
  }

  try {
    const overlayText = parseOverlayText(await request.json());
    const updated = await updateImageOverlayTextForUser({
      userId,
      imageId: parsedParams.data.imageId,
      overlayText,
    });

    if (!updated) {
      return NextResponse.json({ error: "image_not_found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, overlayText });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "invalid_overlay", issues: error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    console.error("[uploads:overlay]", error);
    return NextResponse.json({ error: "overlay_save_failed" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const userId = await getRequiredUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "invalid_image" }, { status: 400 });
  }

  const cleared = await clearImageOverlayTextForUser({
    userId,
    imageId: parsedParams.data.imageId,
  });

  if (!cleared) {
    return NextResponse.json({ error: "image_not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, overlayText: null });
}
