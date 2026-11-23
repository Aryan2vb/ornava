import { NextResponse, type NextRequest } from "next/server";
import { getRequiredUserId } from "@/lib/session";
import { createInviteCode, listInviteCodesForUser } from "@/lib/db";
import { randomBytes } from "crypto";

function generateCode() {
  return randomBytes(4).toString("hex"); // 8-char hex code
}

export async function POST(request: NextRequest) {
  const userId = await getRequiredUserId();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const maxUses = Math.min(Math.max(body?.maxUses ?? 1, 1), 10);
  const code = generateCode();

  const inviteCode = await createInviteCode({ code, createdBy: userId, maxUses });

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
