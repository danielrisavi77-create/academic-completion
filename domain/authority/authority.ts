export const authorityTypes = [
  "USER_REPORTED",
  "OFFICIAL_RULE",
  "MENTOR_REPORTED",
  "SYSTEM_ASSESSED",
  "KATEDRA_ASSESSED",
  "LEKTA_VERIFIED",
] as const;

export type AuthorityType = (typeof authorityTypes)[number];

export type AuthorityRef = {
  type: AuthorityType;
  sourceId?: string;
  sourceLabel?: string;
  observedAt: string;
};

export function authorityRef(
  type: AuthorityType,
  observedAt: string,
  source?: Pick<AuthorityRef, "sourceId" | "sourceLabel">,
): AuthorityRef {
  return {
    type,
    observedAt,
    ...(source?.sourceId ? { sourceId: source.sourceId } : {}),
    ...(source?.sourceLabel ? { sourceLabel: source.sourceLabel } : {}),
  };
}
