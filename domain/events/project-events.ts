import type { AuthorityRef } from "@/domain/authority/authority";
import type { LektaFinding } from "@/domain/lekta/types";
import type { AICapability, PolicyState } from "@/domain/policy/types";
import type {
  EvidenceState,
  ProjectIdentity,
  ProjectStage,
  ProjectTimeline,
} from "@/domain/project/types";
import type { ProjectTask, TaskStatus } from "@/domain/tasks/task";

export type MentorApprovalField =
  | "topicApproved"
  | "structureApproved"
  | "methodologyApproved"
  | "defenseApproved";

export type BaseProjectEvent<TType extends string, TPayload> = {
  eventId: string;
  projectId: string;
  type: TType;
  occurredAt: string;
  authority: AuthorityRef;
  payload: TPayload;
};

export type ProjectEvent =
  | BaseProjectEvent<"PROJECT_CREATED", {
      ownerUserId: string;
      identity: ProjectIdentity;
      timeline: ProjectTimeline;
      stage: ProjectStage;
    }>
  | BaseProjectEvent<"DEADLINE_SET", {
      targetSubmissionDate: string | null;
      deadlineAuthority: AuthorityRef;
    }>
  | BaseProjectEvent<"STAGE_CHANGED", { stage: ProjectStage }>
  | BaseProjectEvent<"TASK_CREATED", { task: ProjectTask }>
  | BaseProjectEvent<"TASK_STATUS_CHANGED", { taskId: string; status: TaskStatus }>
  | BaseProjectEvent<"MENTOR_SUBMISSION_REPORTED", {
      sentAt: string;
      versionLabel?: string;
    }>
  | BaseProjectEvent<"MENTOR_WAITING_CHANGED", { waitingForMentor: boolean }>
  | BaseProjectEvent<"MENTOR_APPROVAL_REPORTED", {
      field: MentorApprovalField;
      evidence: EvidenceState;
    }>
  | BaseProjectEvent<"POLICY_LOADED", { policy: PolicyState }>
  | BaseProjectEvent<"LEKTA_CHECK_IMPORTED", {
      analysisId: string;
      checkedAt: string;
      rulesetId: string;
      rulesetVersion: string;
      findings: LektaFinding[];
    }>
  | BaseProjectEvent<"LEKTA_FINDING_USER_CHANGED", { findingId: string }>
  | BaseProjectEvent<"LEKTA_FINDING_RECHECK_REQUIRED", { findingId: string }>
  | BaseProjectEvent<"SUBMISSION_REPORTED", { submittedAt: string }>
  | BaseProjectEvent<"DEFENSE_REPORTED", { defendedAt: string }>
  | BaseProjectEvent<"AI_ACTION_AUTHORIZED", {
      taskId?: string;
      capability: AICapability;
      policyRuleIds: string[];
      providerId?: string;
      modelId?: string;
    }>
  | BaseProjectEvent<"AI_ACTION_DENIED", {
      taskId?: string;
      capability: AICapability;
      policyRuleIds: string[];
    }>;
