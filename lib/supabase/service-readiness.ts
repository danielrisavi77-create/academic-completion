const SUPABASE_SERVICE_ENV_KEYS = [
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

export function hasSupabaseServiceCredential(
  env: NodeJS.ProcessEnv = process.env,
) {
  return SUPABASE_SERVICE_ENV_KEYS.some((key) => Object.hasOwn(env, key));
}
