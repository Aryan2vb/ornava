import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { grantCredits, linkInviteCodeToUser, validateAndClaimInviteCode } from "@/lib/db";
import { encode, getToken } from "next-auth/jwt";
import { getRequiredAuthSecret } from "@/lib/env";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const code = body?.code?.trim();

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "invite_code_required" }, { status: 400 });
  }

  const claimed = await validateAndClaimInviteCode({ code, userId });

  if (!claimed) {
    return NextResponse.json({ error: "invalid_or_used_code" }, { status: 400 });
  }

  await linkInviteCodeToUser({ userId, inviteCodeId: claimed.id });
  await grantCredits(userId, 20);

  // Update the JWT token to reflect hasInviteCode = true
  const secret = getRequiredAuthSecret(process.env);
  const token = await getToken({ req: request, secret });

  if (token) {
    token.hasInviteCode = true;
    const newToken = await encode({ token, secret });
    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      value: newToken,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  }

  return NextResponse.json({ ok: true });
}
