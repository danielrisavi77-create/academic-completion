import { getSupabasePublicEnv } from "@/lib/supabase/env";

const SUPABASE_SERVICE_ENV_KEYS = [
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

export function getConfiguredSupabaseServiceKey(
  env: NodeJS.ProcessEnv = process.env,
) {
  for (const key of SUPABASE_SERVICE_ENV_KEYS) {
    const value = env[key]?.trim();
    if (value) return value;
  }

  return null;
}

export function hasSupabaseServiceCredential(
  env: NodeJS.ProcessEnv = process.env,
) {
  return Boolean(getConfiguredSupabaseServiceKey(env));
}

export function getSupabaseServiceEnv() {
  const { url } = getSupabasePublicEnv();
  const serviceRoleKey = getConfiguredSupabaseServiceKey();

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SECRET_KEY is required for trusted Completion App mutations (legacy SUPABASE_SERVICE_ROLE_KEY is also supported).",
    );
  }

  return { url, serviceRoleKey };
}
