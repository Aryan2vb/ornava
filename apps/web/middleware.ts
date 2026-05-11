import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getRequiredAuthSecret } from "./src/lib/env";

const protectedPrefixes = [
  "/onboarding",
  "/upload",
  "/generating",
  "/result",
  "/dashboard",
  "/profile",
  "/admin/generations",
  "/brief",
] as const;

const inviteExemptPaths = ["/invite", "/api/invite/validate"] as const;

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isProtectedApiPath(pathname: string) {
  return pathname.startsWith("/api/") && !pathname.startsWith("/api/auth") && !pathname.startsWith("/api/invite");
}

function isInviteExemptPath(pathname: string) {
  return inviteExemptPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({
    req: request,
    secret: getRequiredAuthSecret(process.env),
  });

  if (!isProtectedPath(pathname) && !isProtectedApiPath(pathname) && !isInviteExemptPath(pathname)) {
    return NextResponse.next();
  }

  if (isInviteExemptPath(pathname)) {
    if (!token) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (!token) {
    if (isProtectedApiPath(pathname)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("callbackUrl", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  // Check invite code for authenticated users accessing protected routes
  if (!token.hasInviteCode && isProtectedPath(pathname)) {
    const inviteUrl = request.nextUrl.clone();
    inviteUrl.pathname = "/invite";
    return NextResponse.redirect(inviteUrl);
  }

  if (!token.hasInviteCode && isProtectedApiPath(pathname)) {
    return NextResponse.json({ error: "invite_code_required" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/onboarding/:path*",
    "/upload/:path*",
    "/brief/:path*",
    "/generating/:path*",
    "/result/:path*",
    "/dashboard/:path*",
    "/admin/generations/:path*",
    "/invite/:path*",
    "/api/:path*",
  ],
};
