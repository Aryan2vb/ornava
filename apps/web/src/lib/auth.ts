import { env } from "./env";
import { getSupabaseConfig } from "./supabase/config";

const adminEmails = new Set(
  (env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

export function isAdminEmail(email?: string | null) {
  return Boolean(email && adminEmails.has(email.toLowerCase()));
}

/** Whether "Continue with Google" is switched on for the Supabase project. */
export async function isGoogleAuthEnabled() {
  try {
    const { url, key } = getSupabaseConfig();
    const res = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: key },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return false;
    }

    const settings = (await res.json()) as { external?: { google?: boolean } };

    return Boolean(settings.external?.google);
  } catch {
    return false;
  }
}
