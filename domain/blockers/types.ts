import type { AuthorityRef } from "@/domain/authority/authority";

export const blockerTypes = [
  "DEADLINE_RISK",
  "MENTOR_NOT_SEEN_CURRENT_VERSION",
  "MENTOR_FEEDBACK_OPEN",
  "METHODOLOGY_UNRESOLVED",
  "SOURCE_GAP",
  "AI_POLICY_UNRESOLVED",
  "AI_DISCLOSURE_REQUIRED",
  "LEKTA_CHECK_MISSING",
  "LEKTA_CRITICAL_FINDING_OPEN",
  "SUBMISSION_ADMIN_REQUIREMENT_OPEN",
  "WAITING_ON_MENTOR",
] as const;

export type BlockerType = (typeof blockerTypes)[number];

export type ProjectBlocker = {
  id: string;
  projectId: string;
  type: BlockerType;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  title: string;
  reason: string;
  authority: AuthorityRef;
  relatedTaskId?: string;
  relatedRuleIds?: string[];
};
