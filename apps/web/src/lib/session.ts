import { cache } from "react";
import { findAppUserByEmail, upsertUserFromOAuthProfile } from "./db";
import { normalizeEmail } from "./identity";
import { createSupabaseServerClient } from "./supabase/server";

export type SessionUser = {
  /** app_users.id — the id every Ornava table refers to (not the Supabase auth id). */
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  hasInviteCode: boolean;
};

function metadataString(metadata: Record<string, unknown> | undefined, ...keys: string[]) {
  for (const key of keys) {
    const value = metadata?.[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

/**
 * The signed-in user, or null. Verifies the Supabase session, then links it to
 * the app_users row by email, creating that row on first sign-in.
 * Cached per request.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const email = normalizeEmail(typeof claims?.email === "string" ? claims.email : null);

  if (error || !claims || !email) {
    return null;
  }

  const metadata = claims.user_metadata as Record<string, unknown> | undefined;
  const dbUser =
    (await findAppUserByEmail(email)) ??
    (await upsertUserFromOAuthProfile({
      email,
      name: metadataString(metadata, "full_name", "name") ?? email.split("@")[0],
      image: metadataString(metadata, "avatar_url", "picture"),
    }));

  return {
    id: dbUser.id,
    email,
    name: dbUser.name,
    image: dbUser.avatar_url,
    hasInviteCode: Boolean(dbUser.invite_code_id),
  };
});

export async function getRequiredUserId() {
  const user = await getSessionUser();

  return user?.id ?? null;
}
