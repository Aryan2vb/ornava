import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Only same-site paths, so the callback cannot be used as an open redirect. */
function safeNextPath(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

// Google sign-in returns here with a one-time code, exchanged for a session cookie.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("error", "oauth");
  return NextResponse.redirect(loginUrl);
}
