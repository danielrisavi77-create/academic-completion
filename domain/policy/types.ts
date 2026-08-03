export const aiCapabilities = [
  "RESEARCH_DISCOVERY",
  "QUESTION_COACHING",
  "STRUCTURE_ASSIST",
  "LANGUAGE_REVIEW",
  "CONTENT_REVIEW",
  "PARAPHRASE",
  "GENERATE_SUBMISSION_TEXT",
  "DEFENSE_PREP",
  "DISCLOSURE_HELP",
  "TRANSCRIPTION",
  "TRANSLATION",
] as const;

export type AICapability = (typeof aiCapabilities)[number];

export const policyDecisions = [
  "ALLOW",
  "ALLOW_WITH_CONDITIONS",
  "DENY",
  "UNKNOWN",
] as const;

export type PolicyDecision = (typeof policyDecisions)[number];

export const policyConditionCodes = [
  "VERIFY_SOURCES",
  "STUDENT_MAINTAINS_INTELLECTUAL_CONTROL",
  "DISCLOSURE_REQUIRED",
  "MENTOR_CONSULTATION_REQUIRED",
  "PERSONAL_DATA_CAUTION",
  "VERIFY_TRANSLATION",
  "VERIFY_TRANSCRIPTION",
  "ACTIVE_STUDENT_PARTICIPATION_REQUIRED",
] as const;

export type PolicyConditionCode = (typeof policyConditionCodes)[number];

export type PolicyState = {
  rulesetId: string | null;
  rulesetVersion: string | null;
  verifiedAt: string | null;
  capabilityDecisions: Partial<Record<AICapability, PolicyDecision>>;
};

export function emptyPolicyState(): PolicyState {
  return {
    rulesetId: null,
    rulesetVersion: null,
    verifiedAt: null,
    capabilityDecisions: {},
  };
}
