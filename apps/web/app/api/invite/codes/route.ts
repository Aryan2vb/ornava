import { NextResponse, type NextRequest } from "next/server";
import { isAdminEmail } from "@/lib/auth";
import { getRequiredUserId, getSessionUser } from "@/lib/session";
import { createInviteCode, listInviteCodesForUser } from "@/lib/db";
import { randomBytes } from "crypto";

function generateCode() {
  return randomBytes(4).toString("hex"); // 8-char hex code
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // /api/invite is exempt from the middleware invite gate (so new users can
  // redeem a code), so gate creating codes here: only beta members and admins.
  if (!user.hasInviteCode && !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "invite_code_required" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const maxUses = Math.min(Math.max(Number(body?.maxUses) || 1, 1), 10);
  const code = generateCode();

  const inviteCode = await createInviteCode({ code, createdBy: user.id, maxUses });

  return NextResponse.json(inviteCode, { status: 201 });
}

export async function GET() {
  const userId = await getRequiredUserId();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const codes = await listInviteCodesForUser(userId);

  return NextResponse.json({ codes });
}
