import { NextResponse } from "next/server";
import {
  createAuthenticatedSupabaseDataClient,
  createServerSupabaseClient,
} from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

function decodeJwtPart(token: string, index: number): Record<string, unknown> {
  try {
    const part = token.split(".")[index];
    if (!part) return {};
    const decoded = Buffer.from(part, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function publicKeyFamily(key: string) {
  if (key.startsWith("sb_publishable_")) return "publishable";
  if (key.split(".").length === 3) return "legacy-anon";
  return "unknown";
}

function safeErrorMessage(value: unknown) {
  if (typeof value !== "string") return null;
  return value.replace(/[\r\n\0]/g, " ").slice(0, 180);
}

export async function GET() {
  const auth = await createServerSupabaseClient();
  const { data: userData, error: userError } = await auth.auth.getUser();

  if (userError || !userData.user || userData.user.is_anonymous) {
    return json(401, {
      service: "academic-completion",
      diagnostic: "session-data",
      authenticated: false,
    });
  }

  const { data: sessionData, error: sessionError } = await auth.auth.getSession();
  const accessToken = sessionData.session?.access_token ?? null;
  const { url, key } = getSupabasePublicEnv();

  const jwtHeader = accessToken ? decodeJwtPart(accessToken, 0) : {};
  const jwtPayload = accessToken ? decodeJwtPart(accessToken, 1) : {};

  let dataProbe:
    | { ok: true }
    | { ok: false; code: string | null; message: string | null };

  try {
    const dataClient = await createAuthenticatedSupabaseDataClient(userData.user.id);
    const { error } = await dataClient
      .from("academic_projects")
      .select("id", { count: "exact", head: true });

    dataProbe = error
      ? {
          ok: false,
          code: typeof error.code === "string" ? error.code : null,
          message: safeErrorMessage(error.message),
        }
      : { ok: true };
  } catch (error) {
    dataProbe = {
      ok: false,
      code: "CLIENT_SETUP_FAILED",
      message: safeErrorMessage(error instanceof Error ? error.message : null),
    };
  }

  return json(200, {
    service: "academic-completion",
    diagnostic: "session-data",
    authenticated: true,
    sessionAccessTokenPresent: Boolean(accessToken && !sessionError),
    publicKeyFamily: publicKeyFamily(key),
    jwt: {
      algorithm: typeof jwtHeader.alg === "string" ? jwtHeader.alg : null,
      keyIdPresent: typeof jwtHeader.kid === "string" && jwtHeader.kid.length > 0,
      role: typeof jwtPayload.role === "string" ? jwtPayload.role : null,
      issuerMatchesProject:
        typeof jwtPayload.iss === "string" && jwtPayload.iss === `${url}/auth/v1`,
    },
    dataProbe,
  });
}
