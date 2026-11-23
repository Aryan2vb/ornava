import { NextResponse } from "next/server";
import { getRequiredUserId } from "@/lib/session";
import { getPool, listInviteCodesForUser } from "@/lib/db";

export async function GET() {
  const userId = await getRequiredUserId();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const userResult = await getPool().query(
    `select id, email, name, avatar_url, credits, created_at::text from app_users where id = $1`,
    [userId],
  );
  const user = userResult.rows[0];

  if (!user) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  const inviteCodes = await listInviteCodesForUser(userId);

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatar_url,
    credits: user.credits,
    createdAt: user.created_at,
    inviteCodes,
  });
}
