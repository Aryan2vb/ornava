import type { ShowcaseActivityResponse } from "@ornava/shared";
import { NextResponse } from "next/server";
import { listShowcaseActivityForUser } from "@/lib/db";
import { getRequiredUserId } from "@/lib/session";

export async function GET(request: Request) {
  const userId = await getRequiredUserId();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const requestedLimit = Number(url.searchParams.get("limit") ?? 10);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 25)
    : 10;
  const activity = await listShowcaseActivityForUser(userId, limit);
  const response: ShowcaseActivityResponse = {
    activities: activity.map((item) => ({
      id: item.id,
      showcaseId: item.showcase_id,
      showcaseTitle: item.showcase_title,
      generationId: item.generation_id ?? undefined,
      mode: item.mode ?? undefined,
      jewelryType: item.generation_brief?.jewelryType,
      deviceInfo: item.device_info ?? undefined,
      viewerLocation: item.viewer_location ?? undefined,
      viewedAt: item.viewed_at,
    })),
  };

  return NextResponse.json(response);
}
