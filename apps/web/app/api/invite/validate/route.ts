import { NextResponse, type NextRequest } from "next/server";
import { grantCredits, linkInviteCodeToUser, validateAndClaimInviteCode } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function POST(request: NextRequest) {
  // getSessionUser also creates the app_users row if this is the user's first request.
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const code = body?.code?.trim();

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "invite_code_required" }, { status: 400 });
  }

  const claimed = await validateAndClaimInviteCode({ code, userId: user.id });

  if (!claimed) {
    return NextResponse.json({ error: "invalid_or_used_code" }, { status: 400 });
  }

  await linkInviteCodeToUser({ userId: user.id, inviteCodeId: claimed.id });
  await grantCredits(user.id, 20);

  // Middleware reads invite status from the database, so no session update is needed.
  return NextResponse.json({ ok: true });
}
