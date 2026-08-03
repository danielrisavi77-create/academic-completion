"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createBrowserSupabaseClient() {
  if (browserClient) return browserClient;
  const { url, key } = getSupabasePublicEnv();
  browserClient = createBrowserClient(url, key);
  return browserClient;
}
