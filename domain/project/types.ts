import type { AuthorityRef } from "@/domain/authority/authority";
import type { ProjectBlocker } from "@/domain/blockers/types";
import type { LektaState } from "@/domain/lekta/types";
import type { NextBestAction } from "@/domain/next-action/types";
import type { AIGovernanceState, PolicyState } from "@/domain/policy/types";
import type { ProjectTask } from "@/domain/tasks/task";

export type WorkType = "FINAL_THESIS" | "MASTERS_THESIS";

export type ProjectIdentity = {
  workType: WorkType;
  institutionId: string;
  facultyId: string;
  programId?: string;
  profileId: string;
  topic?: string;
};

export type ProjectTimeline = {
  targetSubmissionDate: string | null;
  targetDefenseDate?: string | null;
  deadlineAuthority: AuthorityRef;
};

export const projectStages = [
  "TOPIC_ACTIVE",
  "PLANNING",
  "RESEARCH",
  "DRAFTING",
  "REVISION",
  "MENTOR_REVIEW",
  "FINAL_CHECK",
  "SUBMISSION",
  "DEFENSE",
  "COMPLETED",
] as const;

export type ProjectStage = (typeof projectStages)[number];

export type EvidenceState = {
  value: boolean | null;
  authority: AuthorityRef;
};

export type MentorState = {
  lastSentAt: string | null;
  lastSeenVersionLabel: string | null;
  waitingForMentor: boolean;
  topicApproved?: EvidenceState;
  structureApproved?: EvidenceState;
  methodologyApproved?: EvidenceState;
  defenseApproved?: EvidenceState;
};

export type ProjectOutcomes = {
  submittedAt: string | null;
  defendedAt: string | null;
};

export type AcademicProject = {
  id: string;
  ownerUserId: string;
  identity: ProjectIdentity;
  timeline: ProjectTimeline;
  stage: ProjectStage;
  policy: PolicyState;
  aiGovernance: AIGovernanceState;
  mentor: MentorState;
  lekta: LektaState;
  tasks: ProjectTask[];
  blockers: ProjectBlocker[];
  nextBestAction: NextBestAction | null;
  outcomes: ProjectOutcomes;
  createdAt: string;
  updatedAt: string;
};
