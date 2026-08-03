import type { ProjectStage, WorkType } from "@/domain/project/types";

export type ScanStage = Extract<
  ProjectStage,
  | "PLANNING"
  | "RESEARCH"
  | "DRAFTING"
  | "REVISION"
  | "MENTOR_REVIEW"
  | "FINAL_CHECK"
>;

export type DraftStatus = "NONE" | "PARTIAL" | "FULL";
export type MentorVersionStatus = "NEVER" | "OLDER_VERSION" | "CURRENT_VERSION";
export type MentorFeedbackStatus = "NONE" | "SOME" | "MANY";
export type LektaCheckStatus = "NEVER_CHECKED" | "CHECKED_CLEAR" | "FINDINGS_OPEN";
export type MentorAIConsultationStatus = "YES" | "NO" | "UNKNOWN";

export type ScanInput = {
  workType: WorkType;
  profileId: "fpzg-politologija-zavrsni" | "fpzg-politologija-diplomski";
  targetSubmissionDate: string;
  topicApproved: boolean;
  stage: ScanStage;
  draftStatus: DraftStatus;
  mentorVersionStatus: MentorVersionStatus;
  mentorFeedbackStatus: MentorFeedbackStatus;
  lektaCheckStatus: LektaCheckStatus;
  usedAI: boolean;
  mentorAIConsultation: MentorAIConsultationStatus;
};

export type ScanFindingSeverity = "CRITICAL" | "HIGH" | "MEDIUM";

export type ScanFindingType =
  | "TOPIC_NOT_APPROVED"
  | "DEADLINE_RISK"
  | "MENTOR_NOT_SEEN_CURRENT_VERSION"
  | "MENTOR_FEEDBACK_OPEN"
  | "AI_POLICY_UNRESOLVED"
  | "AI_DISCLOSURE_REQUIRED"
  | "LEKTA_CHECK_MISSING"
  | "LEKTA_FINDINGS_OPEN";

export type ScanFinding = {
  id: string;
  type: ScanFindingType;
  severity: ScanFindingSeverity;
  title: string;
  explanation: string;
  priority: number;
  relatedRuleIds?: string[];
};

export type ScanWaitingItem = {
  id: string;
  label: string;
};

export type ScanPolicySnapshotItem = {
  capability:
    | "GENERATE_SUBMISSION_TEXT"
    | "LANGUAGE_REVIEW"
    | "RESEARCH_DISCOVERY";
  label: string;
  decision: "ALLOW" | "ALLOW_WITH_CONDITIONS" | "DENY" | "UNKNOWN";
};

export type ScanNextAction = {
  title: string;
  reason: string;
  sourceFindingId?: string;
};

export type ScanResult = {
  workType: WorkType;
  profileId: ScanInput["profileId"];
  stage: ScanStage;
  daysToTarget: number;
  findings: ScanFinding[];
  waitingItems: ScanWaitingItem[];
  policySnapshot: {
    sourceTitle: string;
    sourceUrl: string;
    verifiedAt: string;
    items: ScanPolicySnapshotItem[];
  };
  nextAction: ScanNextAction;
};

export function profileForWorkType(workType: WorkType): ScanInput["profileId"] {
  return workType === "FINAL_THESIS"
    ? "fpzg-politologija-zavrsni"
    : "fpzg-politologija-diplomski";
}
