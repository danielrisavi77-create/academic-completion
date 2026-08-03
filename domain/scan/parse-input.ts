import {
  profileForWorkType,
  type DraftStatus,
  type LektaCheckStatus,
  type MentorAIConsultationStatus,
  type MentorFeedbackStatus,
  type MentorVersionStatus,
  type ScanInput,
  type ScanStage,
} from "@/domain/scan/types";
import type { WorkType } from "@/domain/project/types";

const allowedKeys = new Set([
  "workType",
  "profileId",
  "targetSubmissionDate",
  "topicApproved",
  "stage",
  "draftStatus",
  "mentorVersionStatus",
  "mentorFeedbackStatus",
  "lektaCheckStatus",
  "usedAI",
  "mentorAIConsultation",
]);

const workTypes = new Set<WorkType>(["FINAL_THESIS", "MASTERS_THESIS"]);
const stages = new Set<ScanStage>([
  "PLANNING",
  "RESEARCH",
  "DRAFTING",
  "REVISION",
  "MENTOR_REVIEW",
  "FINAL_CHECK",
]);
const draftStatuses = new Set<DraftStatus>(["NONE", "PARTIAL", "FULL"]);
const mentorVersionStatuses = new Set<MentorVersionStatus>([
  "NEVER",
  "OLDER_VERSION",
  "CURRENT_VERSION",
]);
const mentorFeedbackStatuses = new Set<MentorFeedbackStatus>(["NONE", "SOME", "MANY"]);
const lektaStatuses = new Set<LektaCheckStatus>([
  "NEVER_CHECKED",
  "CHECKED_CLEAR",
  "FINDINGS_OPEN",
]);
const consultationStatuses = new Set<MentorAIConsultationStatus>(["YES", "NO", "UNKNOWN"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(value: unknown, field: string) {
  if (typeof value !== "string") throw new Error(`${field} must be a string.`);
  return value;
}

function requireBoolean(value: unknown, field: string) {
  if (typeof value !== "boolean") throw new Error(`${field} must be a boolean.`);
  return value;
}

export function parseScanInputPayload(value: unknown): ScanInput {
  if (!isRecord(value)) throw new Error("Scan payload must be an object.");

  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) {
      throw new Error(`Unexpected Scan field: ${key}`);
    }
  }

  const workType = requireString(value.workType, "workType") as WorkType;
  if (!workTypes.has(workType)) throw new Error("Unsupported workType.");

  const profileId = requireString(value.profileId, "profileId");
  if (profileId !== profileForWorkType(workType)) {
    throw new Error("profileId does not match the selected workType.");
  }

  const stage = requireString(value.stage, "stage") as ScanStage;
  if (!stages.has(stage)) throw new Error("Unsupported Scan stage.");

  const draftStatus = requireString(value.draftStatus, "draftStatus") as DraftStatus;
  if (!draftStatuses.has(draftStatus)) throw new Error("Unsupported draftStatus.");

  const mentorVersionStatus = requireString(
    value.mentorVersionStatus,
    "mentorVersionStatus",
  ) as MentorVersionStatus;
  if (!mentorVersionStatuses.has(mentorVersionStatus)) {
    throw new Error("Unsupported mentorVersionStatus.");
  }

  const mentorFeedbackStatus = requireString(
    value.mentorFeedbackStatus,
    "mentorFeedbackStatus",
  ) as MentorFeedbackStatus;
  if (!mentorFeedbackStatuses.has(mentorFeedbackStatus)) {
    throw new Error("Unsupported mentorFeedbackStatus.");
  }

  const lektaCheckStatus = requireString(value.lektaCheckStatus, "lektaCheckStatus") as LektaCheckStatus;
  if (!lektaStatuses.has(lektaCheckStatus)) throw new Error("Unsupported lektaCheckStatus.");

  const mentorAIConsultation = requireString(
    value.mentorAIConsultation,
    "mentorAIConsultation",
  ) as MentorAIConsultationStatus;
  if (!consultationStatuses.has(mentorAIConsultation)) {
    throw new Error("Unsupported mentorAIConsultation.");
  }

  return {
    workType,
    profileId,
    targetSubmissionDate: requireString(value.targetSubmissionDate, "targetSubmissionDate"),
    topicApproved: requireBoolean(value.topicApproved, "topicApproved"),
    stage,
    draftStatus,
    mentorVersionStatus,
    mentorFeedbackStatus,
    lektaCheckStatus,
    usedAI: requireBoolean(value.usedAI, "usedAI"),
    mentorAIConsultation,
  };
}
