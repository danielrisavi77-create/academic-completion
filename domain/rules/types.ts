import type {
  AICapability,
  PolicyConditionCode,
  PolicyDecision,
} from "@/domain/policy/types";
import type { WorkType } from "@/domain/project/types";

export type RuleSourceKind =
  | "OFFICIAL_WEB"
  | "OFFICIAL_PDF"
  | "LEKTA_VERIFIED_EXPORT";

export type RuleSource = {
  id: string;
  kind: RuleSourceKind;
  title: string;
  url: string;
  sourceDate?: string;
  verifiedAt: string;
  repositoryCommit?: string;
};

export type ProcessRuleCategory =
  | "ELIGIBILITY"
  | "MENTOR"
  | "SUBMISSION"
  | "DEFENSE"
  | "WORK_SHAPE";

export type ProcessRule = {
  id: string;
  workTypes: WorkType[];
  category: ProcessRuleCategory;
  statement: string;
  sourceIds: string[];
  locator?: string;
};

export type ScheduleRuleKind =
  | "TOPIC_DEADLINE"
  | "MENTOR_DRAFT_DEADLINE"
  | "SUBMISSION_CUTOFF"
  | "DEFENSE_WINDOW";

export type ScheduleRule = {
  id: string;
  workType: WorkType;
  kind: ScheduleRuleKind;
  label: string;
  at?: string;
  start?: string;
  end?: string;
  sourceIds: string[];
  appliesTo?: string[];
};

export type PolicyBasis = "DIRECT" | "CONSERVATIVE_INTERPRETATION";

export type AIPolicyRuleRecord = {
  id: string;
  workTypes: WorkType[];
  capability: AICapability;
  decision: PolicyDecision;
  conditions: PolicyConditionCode[];
  basis: PolicyBasis;
  rationale: string;
  sourceIds: string[];
};

export type DocumentRulesReference = {
  sourceProduct: "LEKTA";
  repository: string;
  commit: string;
  profiles: Partial<Record<WorkType, string>>;
  note: string;
};

export type FacultyCompletionRuleset = {
  id: string;
  version: string;
  academicYear: string;
  institutionId: string;
  facultyId: string;
  verifiedAt: string;
  sources: RuleSource[];
  processRules: ProcessRule[];
  scheduleRules: ScheduleRule[];
  aiPolicyRules: AIPolicyRuleRecord[];
  documentRulesReference: DocumentRulesReference;
};
