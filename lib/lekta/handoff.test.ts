import { describe, expect, it } from "vitest";
import { buildFpzgDemoProject } from "@/data/demo/fpzg-project";
import {
  buildLektaHandoffUrl,
  hashLektaHandoffToken,
  mintLektaHandoffCapability,
} from "@/lib/lekta/handoff";

describe("Lekta handoff capability", () => {
  it("mints an opaque capability and stores a SHA-256 compatible hash", () => {
    const capability = mintLektaHandoffCapability(Date.parse("2026-08-03T12:00:00Z"));
    expect(capability.rawToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(capability.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(capability.tokenHash).toBe(hashLektaHandoffToken(capability.rawToken));
    expect(capability.expiresAt).toBe("2026-08-03T18:00:00.000Z");
  });

  it("keeps the raw capability out of query params", () => {
    const project = buildFpzgDemoProject(new Date("2026-08-03T12:00:00Z"));
    const token = "x".repeat(43);
    const url = new URL(buildLektaHandoffUrl(project, token));

    expect(url.searchParams.get("project")).toBe(project.id);
    expect(url.searchParams.get("unit")).toBe("fpzg");
    expect(url.searchParams.get("profile")).toBe("fpzg-politologija-diplomski");
    expect(url.searchParams.get("workType")).toBe("graduate");
    expect(url.searchParams.has("handoff")).toBe(false);
    expect(new URLSearchParams(url.hash.slice(1)).get("handoff")).toBe(token);
  });
});
