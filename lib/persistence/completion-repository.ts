import { randomUUID } from "node:crypto";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createAuthenticatedSupabaseDataClient } from "@/lib/supabase/server";
import { fpzgRuleset } from "@/data/rules/fpzg/ruleset";
import { mapDatabaseProjectToDomain } from "@/domain/persistence/project-mapper";
import type { CreateProjectFromScanCommand } from "@/domain/persistence/scan-project-draft";
import {
  toSharedAcademicProjectStage,
  type AcademicProjectRow,
  type CompletionProjectStateRow,
  type CompletionTaskRow,
} from "@/domain/persistence/types";
import type { AcademicProject } from "@/domain/project/types";

const PROJECT_SELECT = [
  "id",
  "user_id",
  "work_type",
  "profile_id",
  "title",
  "topic",
  "institution_id",
  "unit_id",
  "program_id",
  "deadline",
  "stage",
  "ruleset_id",
  "ruleset_version",
  "created_at",
  "updated_at",
].join(",");

const STATE_SELECT = [
  "academic_project_id",
  "stage",
  "target_submission_date",
  "target_defense_date",
  "deadline_authority_type",
  "deadline_source_id",
  "deadline_source_label",
  "mentor_last_sent_at",
  "mentor_last_sent_version_label",
  "mentor_last_seen_version_label",
  "mentor_waiting_for_response",
  "topic_approved",
  "topic_approval_authority_type",
  "structure_approved",
  "structure_approval_authority_type",
  "methodology_approved",
  "methodology_approval_authority_type",
  "defense_approved",
  "defense_approval_authority_type",
  "ai_policy_ruleset_id",
  "ai_policy_ruleset_version",
  "ai_policy_verified_at",
  "ai_mentor_consultation",
  "ai_disclosure_state",
  "ai_data_safety_acknowledged",
  "submitted_at",
  "defended_at",
  "created_at",
  "updated_at",
].join(",");

const TASK_SELECT = [
  "id",
  "academic_project_id",
  "task_type",
  "title",
  "status",
  "priority",
  "stage",
  "authority_type",
  "authority_source_id",
  "authority_source_label",
  "capability",
  "related_rule_ids",
  "related_lekta_finding_ids",
  "created_at",
  "updated_at",
].join(",");

export class CompletionPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CompletionPersistenceError";
  }
}

async function removePartialProject(projectId: string) {
  const admin = createAdminSupabaseClient();
  await admin.from("academic_projects").delete().eq("id", projectId);
}

export async function createOwnedProjectFromScan({
  ownerUserId,
  command,
}: {
  ownerUserId: string;
  command: CreateProjectFromScanCommand;
}): Promise<string> {
  const admin = createAdminSupabaseClient();
  const projectId = randomUUID();

  const { error: projectError } = await admin.from("academic_projects").insert({
    id: projectId,
    user_id: ownerUserId,
    work_type: command.databaseWorkType,
    institution_id: fpzgRuleset.institutionId,
    unit_id: fpzgRuleset.facultyId,
    profile_id: command.profileId,
    academic_year: fpzgRuleset.academicYear,
    deadline: command.targetSubmissionDate,
    stage: toSharedAcademicProjectStage(command.stage),
    ruleset_id: command.aiPolicyRulesetId,
    ruleset_version: command.aiPolicyRulesetVersion,
  });

  if (projectError) {
    throw new CompletionPersistenceError(`Could not create academic project: ${projectError.message}`);
  }

  const { error: stateError } = await admin.from("completion_project_state").insert({
    academic_project_id: projectId,
    stage: command.stage,
    target_submission_date: command.targetSubmissionDate,
    deadline_authority_type: "USER_REPORTED",
    mentor_waiting_for_response: command.mentorWaitingForResponse,
    topic_approved: command.topicApproved,
    topic_approval_authority_type: "USER_REPORTED",
    ai_policy_ruleset_id: command.aiPolicyRulesetId,
    ai_policy_ruleset_version: command.aiPolicyRulesetVersion,
    ai_policy_verified_at: command.aiPolicyVerifiedAt,
    ai_mentor_consultation: command.aiMentorConsultation,
    ai_disclosure_state: command.aiDisclosureState,
    ai_data_safety_acknowledged: command.aiDataSafetyAcknowledged,
  });

  if (stateError) {
    await removePartialProject(projectId);
    throw new CompletionPersistenceError(`Could not create completion state: ${stateError.message}`);
  }

  const initialTaskRows = command.initialTasks.map((draft) => {
    const systemAssessed = draft.authorityType === "SYSTEM_ASSESSED";
    return {
      id: randomUUID(),
      academic_project_id: projectId,
      task_type: draft.taskType,
      title: draft.title,
      status: "OPEN",
      priority: draft.priority,
      stage: command.stage,
      authority_type: draft.authorityType,
      authority_source_label: systemAssessed
        ? "Completion Scan + aktualni FPZG ruleset"
        : "Strukturirani odgovor u Completion Scanu",
      capability: draft.capability ?? null,
      related_rule_ids: draft.relatedRuleIds,
      related_lekta_finding_ids: [],
    };
  });

  if (initialTaskRows.length > 0) {
    const { error: taskError } = await admin.from("completion_tasks").insert(initialTaskRows);
    if (taskError) {
      await removePartialProject(projectId);
      throw new CompletionPersistenceError(`Could not create initial completion tasks: ${taskError.message}`);
    }
  }

  const eventRows = [
    {
      academic_project_id: projectId,
      task_id: null,
      event_type: "PROJECT_CREATED",
      capability: null,
      policy_rule_ids: [],
      authority_type: "USER_REPORTED",
      authority_source_label: "Structured Completion Scan",
    },
    ...initialTaskRows.map((taskRow) => ({
      academic_project_id: projectId,
      task_id: taskRow.id,
      event_type: "TASK_CREATED",
      capability: taskRow.capability,
      policy_rule_ids: taskRow.related_rule_ids,
      authority_type: taskRow.authority_type,
      authority_source_label: taskRow.authority_source_label,
    })),
  ];

  const { error: eventError } = await admin.from("completion_events").insert(eventRows);

  if (eventError) {
    await removePartialProject(projectId);
    throw new CompletionPersistenceError(`Could not create project audit events: ${eventError.message}`);
  }

  return projectId;
}

export async function getOwnedProject({
  ownerUserId,
  projectId,
}: {
  ownerUserId: string;
  projectId: string;
}): Promise<AcademicProject | null> {
  const supabase = await createAuthenticatedSupabaseDataClient(ownerUserId);

  const { data: projectData, error: projectError } = await supabase
    .from("academic_projects")
    .select(PROJECT_SELECT)
    .eq("id", projectId)
    .eq("user_id", ownerUserId)
    .maybeSingle();

  if (projectError) {
    throw new CompletionPersistenceError(`Could not load academic project: ${projectError.message}`);
  }

  if (!projectData) return null;

  const [{ data: stateData, error: stateError }, { data: taskData, error: taskError }] =
    await Promise.all([
      supabase
        .from("completion_project_state")
        .select(STATE_SELECT)
        .eq("academic_project_id", projectId)
        .maybeSingle(),
      supabase
        .from("completion_tasks")
        .select(TASK_SELECT)
        .eq("academic_project_id", projectId)
        .order("created_at", { ascending: true }),
    ]);

  if (stateError) {
    throw new CompletionPersistenceError(`Could not load completion state: ${stateError.message}`);
  }
  if (taskError) {
    throw new CompletionPersistenceError(`Could not load completion tasks: ${taskError.message}`);
  }
  if (!stateData) {
    throw new CompletionPersistenceError("Academic project exists without Completion App state.");
  }

  return mapDatabaseProjectToDomain({
    project: projectData as unknown as AcademicProjectRow,
    state: stateData as unknown as CompletionProjectStateRow,
    tasks: (taskData ?? []) as unknown as CompletionTaskRow[],
  });
}

export async function assertOwnedProject({
  ownerUserId,
  projectId,
}: {
  ownerUserId: string;
  projectId: string;
}) {
  const supabase = await createAuthenticatedSupabaseDataClient(ownerUserId);
  const { data, error } = await supabase
    .from("academic_projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", ownerUserId)
    .maybeSingle();

  if (error) {
    throw new CompletionPersistenceError(`Could not verify project ownership: ${error.message}`);
  }

  return Boolean(data);
}

export function currentFpzgPolicyReference() {
  return {
    rulesetId: fpzgRuleset.id,
    rulesetVersion: fpzgRuleset.version,
    verifiedAt: fpzgRuleset.verifiedAt,
  };
}
