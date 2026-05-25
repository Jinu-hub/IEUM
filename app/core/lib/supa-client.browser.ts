/**
 * Browser Supabase client for client-only auth checks (e.g. public nav).
 * Uses the public anon key from root loader data — never use service role here.
 */
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

let browserClient: SupabaseClient<Database> | null = null;

export function getSupabaseBrowserClient(
  url: string,
  anonKey: string,
): SupabaseClient<Database> {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(url, anonKey);
  }
  return browserClient;
}
