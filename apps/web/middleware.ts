import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getRequiredAuthSecret } from "./src/lib/env";

const protectedPrefixes = [
  "/onboarding",
  "/upload",
  "/generating",
  "/result",
  "/dashboard",
  "/admin/generations",
] as const;

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isProtectedApiPath(pathname: string) {
  return pathname.startsWith("/api/") && !pathname.startsWith("/api/auth");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({
    req: request,
    secret: getRequiredAuthSecret(process.env),
  });

  if (!isProtectedPath(pathname) && !isProtectedApiPath(pathname)) {
    return NextResponse.next();
  }

  if (token) {
    return NextResponse.next();
  }

  if (isProtectedApiPath(pathname)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("callbackUrl", `${pathname}${request.nextUrl.search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/",
    "/onboarding/:path*",
    "/upload/:path*",
    "/generating/:path*",
    "/result/:path*",
    "/dashboard/:path*",
    "/admin/generations/:path*",
    "/api/:path*",
  ],
};
