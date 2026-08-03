import { createServerClient } from "@supabase/ssr";
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
