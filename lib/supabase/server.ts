import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const { url, key } = getSupabasePublicEnv();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components may be unable to mutate cookies. The proxy/session
          // refresh path remains responsible for keeping auth cookies current.
        }
      },
    },
  });
}

export async function requireAuthenticatedUser() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user || data.user.is_anonymous) {
    return null;
  }

  return data.user;
}

/**
 * Build a request-scoped RLS data client from a server-validated Supabase Auth
 * session. The public API key identifies the project while the access-token
 * callback supplies the signed-in user's short-lived JWT for PostgREST/RPC.
 */
export async function createAuthenticatedSupabaseDataClient(expectedUserId?: string) {
  const authClient = await createServerSupabaseClient();
  const { data: userData, error: userError } = await authClient.auth.getUser();

  if (userError || !userData.user || userData.user.is_anonymous) {
    throw new Error("Authenticated Supabase user session is required.");
  }
  if (expectedUserId && userData.user.id !== expectedUserId) {
    throw new Error("Authenticated Supabase session does not match the requested owner.");
  }

  // Identity was validated above; session access is used only to forward the
  // request-scoped JWT to the data API. The token is never logged or persisted.
  const { data: sessionData, error: sessionError } = await authClient.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (sessionError || !accessToken) {
    throw new Error("Authenticated Supabase access token is unavailable.");
  }

  const { url, key } = getSupabasePublicEnv();
  return createClient(url, key, {
    accessToken: async () => accessToken,
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
