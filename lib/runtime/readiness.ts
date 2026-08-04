const DEFAULT_LEKTA_URL = "https://lektahr.netlify.app";

export const PRODUCTION_ACCEPTANCE_CONTRACT = "epic-12.5";

function normalizedHttpOrigin(value: string | undefined) {
  const candidate = value?.trim();
  if (!candidate) return null;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

function buildRevision(env: NodeJS.ProcessEnv) {
  return (
    env.ACADEMIC_COMPLETION_BUILD_REVISION?.trim() ||
    env.COMMIT_REF?.trim() ||
    env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    env.GITHUB_SHA?.trim() ||
    null
  );
}

export function productionReadiness(env: NodeJS.ProcessEnv = process.env) {
  const completionOrigin = normalizedHttpOrigin(env.COMPLETION_APP_URL);
  const lektaOrigin = normalizedHttpOrigin(env.LEKTA_APP_URL || DEFAULT_LEKTA_URL);
  const supabaseUrl = normalizedHttpOrigin(env.NEXT_PUBLIC_SUPABASE_URL);
  const publicKeyConfigured = Boolean(
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
  const serviceCredentialConfigured = Boolean(
    env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );

  const checks = {
    completionOriginConfigured: Boolean(completionOrigin),
    lektaOriginConfigured: Boolean(lektaOrigin),
    supabasePublicConfigured: Boolean(supabaseUrl && publicKeyConfigured),
    supabaseServiceConfigured: serviceCredentialConfigured,
  };

  return {
    service: "academic-completion" as const,
    contractVersion: PRODUCTION_ACCEPTANCE_CONTRACT,
    revision: buildRevision(env),
    completionOrigin,
    lektaOrigin,
    supabaseOrigin: supabaseUrl,
    checks,
    readyForLektaHandoff: Object.values(checks).every(Boolean),
  };
}
