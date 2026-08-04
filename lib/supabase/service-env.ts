import "server-only";

import { getSupabasePublicEnv } from "@/lib/supabase/env";

export function getSupabaseServiceEnv() {
  const { url } = getSupabasePublicEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for trusted Completion App mutations.",
    );
  }

  return { url, serviceRoleKey };
}
