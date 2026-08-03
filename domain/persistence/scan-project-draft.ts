import { fpzgRuleset } from "@/data/rules/fpzg/ruleset";
import { profileForWorkType, type ScanInput } from "@/domain/scan/types";
import type { AIDisclosureState, MentorAIConsultationState } from "@/domain/policy/types";
import type { ProjectStage, WorkType } from "@/domain/project/types";
import { toDatabaseWorkType, type DatabaseWorkType } from "@/domain/persistence/types";

export type CreateProjectFromScanCommand = {
  workType: WorkType;
  databaseWorkType: DatabaseWorkType;
  profileId: "fpzg-politologija-zavrsni" | "fpzg-politologija-diplomski";
  stage: ProjectStage;
  targetSubmissionDate: string;
  topicApproved: boolean;
  aiPolicyRulesetId: string;
  aiPolicyRulesetVersion: string;
  aiPolicyVerifiedAt: string;
  aiMentorConsultation: MentorAIConsultationState;
  aiDisclosureState: AIDisclosureState;
  aiDataSafetyAcknowledged: false;
};

const allowedStages = new Set<ProjectStage>([
  "PLANNING",
  "RESEARCH",
  "DRAFTING",
  "REVISION",
  "MENTOR_REVIEW",
  "FINAL_CHECK",
]);

function validateIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Target submission date must use YYYY-MM-DD format.");
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error("Target submission date is invalid.");
  }
}

export function createProjectCommandFromScan(input: ScanInput): CreateProjectFromScanCommand {
  const canonicalProfile = profileForWorkType(input.workType);
  if (input.profileId !== canonicalProfile) {
    throw new Error("Scan profile does not match the selected work type.");
  }

  if (!allowedStages.has(input.stage)) {
    throw new Error("Scan stage is not supported for project creation.");
  }

  validateIsoDate(input.targetSubmissionDate);

  const aiMentorConsultation: MentorAIConsultationState = input.usedAI
    ? input.mentorAIConsultation === "YES"
      ? "USER_REPORTED_CONSULTED"
      : input.mentorAIConsultation === "NO"
        ? "NOT_ASKED"
        : "UNKNOWN"
    : "NOT_ASKED";

  const aiDisclosureState: AIDisclosureState = input.usedAI
    ? "USAGE_EVENTS_EXIST"
    : "NOT_STARTED";

  return {
    workType: input.workType,
    databaseWorkType: toDatabaseWorkType(input.workType),
    profileId: canonicalProfile,
    stage: input.stage,
    targetSubmissionDate: input.targetSubmissionDate,
    topicApproved: input.topicApproved,
    aiPolicyRulesetId: fpzgRuleset.id,
    aiPolicyRulesetVersion: fpzgRuleset.version,
    aiPolicyVerifiedAt: fpzgRuleset.verifiedAt,
    aiMentorConsultation,
    aiDisclosureState,
    aiDataSafetyAcknowledged: false,
  };
}
