import { describe, expect, it } from "vitest";
import {
  PRODUCTION_ACCEPTANCE_CONTRACT,
  productionReadiness,
} from "@/lib/runtime/readiness";

describe("production readiness", () => {
  it("fails closed when the Completion production origin or server authority is missing", () => {
    const readiness = productionReadiness({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable",
    });

    expect(readiness.contractVersion).toBe(PRODUCTION_ACCEPTANCE_CONTRACT);
    expect(readiness.lektaOrigin).toBe("https://lektahr.netlify.app");
    expect(readiness.checks).toEqual({
      completionOriginConfigured: false,
      lektaOriginConfigured: true,
      supabasePublicConfigured: true,
      supabaseServiceConfigured: false,
    });
    expect(readiness.readyForLektaHandoff).toBe(false);
  });

  it("reports ready with the canonical Supabase secret key", () => {
    const readiness = productionReadiness({
      COMPLETION_APP_URL: "https://completion.example/ignored/path",
      LEKTA_APP_URL: "https://lektahr.netlify.app/analyzer",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable",
      SUPABASE_SECRET_KEY: "test-service-credential",
      COMMIT_REF: "abc123",
    });

    expect(readiness).toMatchObject({
      completionOrigin: "https://completion.example",
      lektaOrigin: "https://lektahr.netlify.app",
      supabaseOrigin: "https://example.supabase.co",
      revision: "abc123",
      readyForLektaHandoff: true,
    });
  });

  it("keeps the legacy service-role key as a migration fallback", () => {
    const readiness = productionReadiness({
      COMPLETION_APP_URL: "https://completion.example",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      SUPABASE_SERVICE_ROLE_KEY: "legacy-service-role",
    });

    expect(readiness.checks.supabaseServiceConfigured).toBe(true);
    expect(readiness.readyForLektaHandoff).toBe(true);
  });

  it("rejects non-http origins instead of treating them as configured", () => {
    const readiness = productionReadiness({
      COMPLETION_APP_URL: "javascript:alert(1)",
      LEKTA_APP_URL: "file:///tmp/lekta",
      NEXT_PUBLIC_SUPABASE_URL: "not a url",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      SUPABASE_SECRET_KEY: "test-service-credential",
    });

    expect(readiness.checks).toEqual({
      completionOriginConfigured: false,
      lektaOriginConfigured: false,
      supabasePublicConfigured: false,
      supabaseServiceConfigured: true,
    });
    expect(readiness.readyForLektaHandoff).toBe(false);
  });
});
