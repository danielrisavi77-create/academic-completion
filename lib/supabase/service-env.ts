import { getSupabasePublicEnv } from "@/lib/supabase/env";

export function getSupabaseServiceEnv() {
  const { url } = getSupabasePublicEnv();
  const serviceRoleKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SECRET_KEY is required for trusted Completion App mutations (legacy SUPABASE_SERVICE_ROLE_KEY is also supported).",
    );
  }

  return { url, serviceRoleKey };
}
