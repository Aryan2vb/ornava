import type { CreateShowcaseViewRequest } from "@ornava/shared";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createShowcaseView } from "@/lib/db";
import { getViewerLocationFromHeaders } from "@/lib/showcase";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const viewSchema = z.object({
  generationId: z.string().uuid().optional(),
  fingerprint: z.string().trim().min(1).max(200).optional(),
  deviceInfo: z.string().trim().min(1).max(240).optional(),
});

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: RouteParams) {
  const parsedParams = paramsSchema.safeParse(await params);

  if (!parsedParams.success) {
    return NextResponse.json({ error: "invalid_showcase" }, { status: 400 });
  }

  const parsedBody = viewSchema.safeParse(
    (await request.json().catch(() => ({}))) as CreateShowcaseViewRequest,
  );

  if (!parsedBody.success) {
    return NextResponse.json({ error: "invalid_showcase_view" }, { status: 400 });
  }

  try {
    const activity = await createShowcaseView({
      showcaseId: parsedParams.data.id,
      generationId: parsedBody.data.generationId,
      viewerFingerprint: parsedBody.data.fingerprint,
      deviceInfo: parsedBody.data.deviceInfo ?? request.headers.get("user-agent") ?? undefined,
      viewerLocation: getViewerLocationFromHeaders(request.headers) ?? undefined,
    });

    if (!activity) {
      return NextResponse.json({ error: "showcase_not_found" }, { status: 404 });
    }

    return NextResponse.json({ viewId: activity.id }, { status: 201 });
  } catch (error) {
    console.error("[showcases:view]", error);
    return NextResponse.json({ error: "showcase_view_failed" }, { status: 500 });
  }
}
