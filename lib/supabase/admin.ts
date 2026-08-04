import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceEnv } from "@/lib/supabase/service-env";

export function createAdminSupabaseClient() {
  const { url, serviceRoleKey } = getSupabaseServiceEnv();

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
