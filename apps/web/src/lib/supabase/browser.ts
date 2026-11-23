import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

/** Supabase client for client components; keeps the session in cookies the server can read. */
export function createSupabaseBrowserClient() {
  const { url, key } = getSupabaseConfig();

  return createBrowserClient(url, key);
}
