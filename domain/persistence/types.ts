import type { AuthorityType } from "@/domain/authority/authority";
import type { AICapability, AIDisclosureState, MentorAIConsultationState } from "@/domain/policy/types";
import type { ProjectStage, WorkType } from "@/domain/project/types";
import type { TaskPriority, TaskStatus } from "@/domain/tasks/task";

export type DatabaseWorkType = "final" | "graduate";

export type SharedAcademicProjectStage =
  | "topic"
  | "research"
  | "plan"
  | "writing"
  | "mentor-review"
  | "katedra-review"
  | "lekta-preflight"
  | "revision"
  | "submission"
  | "defense"
  | "completed";

export function toDatabaseWorkType(workType: WorkType): DatabaseWorkType {
  return workType === "FINAL_THESIS" ? "final" : "graduate";
}

export function fromDatabaseWorkType(workType: string): WorkType {
  if (workType === "final") return "FINAL_THESIS";
  if (workType === "graduate") return "MASTERS_THESIS";
  throw new Error(`Unsupported Academic Completion work type: ${workType}`);
}

export function toSharedAcademicProjectStage(stage: ProjectStage): SharedAcademicProjectStage {
  switch (stage) {
    case "TOPIC_ACTIVE":
      return "topic";
    case "PLANNING":
      return "plan";
    case "RESEARCH":
      return "research";
    case "DRAFTING":
      return "writing";
    case "REVISION":
      return "revision";
    case "MENTOR_REVIEW":
      return "mentor-review";
    case "FINAL_CHECK":
      return "lekta-preflight";
    case "SUBMISSION":
      return "submission";
    case "DEFENSE":
      return "defense";
    case "COMPLETED":
      return "completed";
  }
}

export type AcademicProjectRow = {
  id: string;
  user_id: string;
  work_type: string;
  profile_id: string | null;
  title: string | null;
  topic: string;
  institution_id: string | null;
  unit_id: string;
  program_id: string | null;
  deadline: string | null;
  stage: SharedAcademicProjectStage;
  ruleset_id: string | null;
  ruleset_version: string | null;
  created_at: string;
  updated_at: string;
};

export type CompletionProjectStateRow = {
  academic_project_id: string;
  stage: ProjectStage;
  target_submission_date: string | null;
  target_defense_date: string | null;
  deadline_authority_type: AuthorityType;
  deadline_source_id: string | null;
  deadline_source_label: string | null;
  mentor_last_sent_at: string | null;
  mentor_last_seen_version_label: string | null;
  mentor_waiting_for_response: boolean;
  topic_approved: boolean | null;
  topic_approval_authority_type: AuthorityType | null;
  structure_approved: boolean | null;
  structure_approval_authority_type: AuthorityType | null;
  methodology_approved: boolean | null;
  methodology_approval_authority_type: AuthorityType | null;
  defense_approved: boolean | null;
  defense_approval_authority_type: AuthorityType | null;
  ai_policy_ruleset_id: string | null;
  ai_policy_ruleset_version: string | null;
  ai_policy_verified_at: string | null;
  ai_mentor_consultation: MentorAIConsultationState;
  ai_disclosure_state: AIDisclosureState;
  ai_data_safety_acknowledged: boolean;
  submitted_at: string | null;
  defended_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CompletionTaskRow = {
  id: string;
  academic_project_id: string;
  task_type: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  stage: ProjectStage;
  authority_type: AuthorityType;
  authority_source_id: string | null;
  authority_source_label: string | null;
  capability: AICapability | null;
  related_rule_ids: string[];
  related_lekta_finding_ids: string[];
  created_at: string;
  updated_at: string;
};
