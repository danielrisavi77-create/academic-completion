import { createHash, randomBytes } from "node:crypto";
import type { AcademicProject } from "@/domain/project/types";
import { toDatabaseWorkType } from "@/domain/persistence/types";

const DEFAULT_LEKTA_URL = "https://lektahr.netlify.app";
const HANDOFF_TTL_MS = 6 * 60 * 60 * 1000;

export type LektaHandoffCapability = {
  rawToken: string;
  tokenHash: string;
  expiresAt: string;
};

export function hashLektaHandoffToken(rawToken: string) {
  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}

export function mintLektaHandoffCapability(now = Date.now()): LektaHandoffCapability {
  const rawToken = randomBytes(32).toString("base64url");
  return {
    rawToken,
    tokenHash: hashLektaHandoffToken(rawToken),
    expiresAt: new Date(now + HANDOFF_TTL_MS).toISOString(),
  };
}

function configuredLektaBaseUrl() {
  const candidate = process.env.LEKTA_APP_URL?.trim() || DEFAULT_LEKTA_URL;
  const url = new URL(candidate);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("LEKTA_APP_URL must use http(s).");
  }
  url.search = "";
  url.hash = "";
  return url;
}

export function buildLektaHandoffUrl(project: AcademicProject, rawToken: string) {
  const url = configuredLektaBaseUrl();
  url.searchParams.set("project", project.id);
  url.searchParams.set("unit", project.identity.facultyId);
  if (project.identity.programId) url.searchParams.set("program", project.identity.programId);
  url.searchParams.set("profile", project.identity.profileId);
  url.searchParams.set("workType", toDatabaseWorkType(project.identity.workType));
  if (project.policy.rulesetId) url.searchParams.set("ruleset", project.policy.rulesetId);

  // Capability stays after # so it is not sent to Netlify/server access logs or
  // HTTP Referer headers. Lekta captures it into sessionStorage and removes it
  // from the address bar during bootstrap.
  url.hash = new URLSearchParams({ handoff: rawToken }).toString();
  return url.toString();
}
