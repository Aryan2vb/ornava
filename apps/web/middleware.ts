import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { findAppUserByEmail } from "./src/lib/db";
import { getSupabaseConfig } from "./src/lib/supabase/config";

const protectedPrefixes = [
  "/onboarding",
  "/upload",
  "/generating",
  "/result",
  "/dashboard",
  "/gallery",
  "/profile",
  "/admin/generations",
  "/brief",
] as const;

const inviteExemptPaths = ["/invite", "/api/invite/validate"] as const;

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isProtectedApiPath(pathname: string) {
  return pathname.startsWith("/api/") && !pathname.startsWith("/api/invite") && !pathname.startsWith("/api/webhooks") && !pathname.startsWith("/api/showcases/public");
}

function isInviteExemptPath(pathname: string) {
  return inviteExemptPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { url, key } = getSupabaseConfig();
  let response = NextResponse.next({ request });

  // Refreshes an expired access token and writes the new session cookies to
  // both the forwarded request and the response.
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const email = typeof data?.claims?.email === "string" ? data.claims.email : null;

  // Redirects must carry any refreshed session cookies too.
  const withSessionCookies = (next: NextResponse) => {
    for (const cookie of response.cookies.getAll()) {
      next.cookies.set(cookie);
    }
    return next;
  };

  if (!isProtectedPath(pathname) && !isProtectedApiPath(pathname) && !isInviteExemptPath(pathname)) {
    return response;
  }

  if (!email) {
    if (pathname.startsWith("/api/")) {
      return withSessionCookies(NextResponse.json({ error: "unauthorized" }, { status: 401 }));
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("callbackUrl", `${pathname}${request.nextUrl.search}`);
    return withSessionCookies(NextResponse.redirect(loginUrl));
  }

  if (isInviteExemptPath(pathname)) {
    return response;
  }

  // A user without a row yet (first request after sign-up) has no invite code.
  const appUser = await findAppUserByEmail(email);
  const hasInviteCode = Boolean(appUser?.invite_code_id);

  if (!hasInviteCode && isProtectedPath(pathname)) {
    const inviteUrl = request.nextUrl.clone();
    inviteUrl.pathname = "/invite";
    inviteUrl.search = "";
    return withSessionCookies(NextResponse.redirect(inviteUrl));
  }

  if (!hasInviteCode && isProtectedApiPath(pathname)) {
    return withSessionCookies(NextResponse.json({ error: "invite_code_required" }, { status: 403 }));
  }

  return response;
}

export const config = {
  // Node.js runtime so the invite-code check can read Postgres.
  runtime: "nodejs",
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
