import { authorityRef } from "@/domain/authority/authority";
import { fpzgRuleset } from "@/data/rules/fpzg/ruleset";
import { emptyLektaState } from "@/domain/lekta/types";
import type { PolicyState } from "@/domain/policy/types";
import type { AcademicProject, EvidenceState } from "@/domain/project/types";
import {
  fromDatabaseWorkType,
  type AcademicProjectRow,
  type CompletionProjectStateRow,
  type CompletionTaskRow,
} from "@/domain/persistence/types";
import { profileForWorkType } from "@/domain/scan/types";
import { toSanitizedTaskTitle } from "@/domain/tasks/task";

function policyFromState(row: CompletionProjectStateRow): PolicyState {
  const isCurrentFpzgRuleset =
    row.ai_policy_ruleset_id === fpzgRuleset.id &&
    row.ai_policy_ruleset_version === fpzgRuleset.version;

  return {
    rulesetId: row.ai_policy_ruleset_id,
    rulesetVersion: row.ai_policy_ruleset_version,
    verifiedAt: row.ai_policy_verified_at,
    capabilityDecisions: isCurrentFpzgRuleset
      ? Object.fromEntries(
          fpzgRuleset.aiPolicyRules.map((rule) => [rule.capability, rule.decision]),
        )
      : {},
  };
}

function evidence(
  value: boolean | null,
  authorityType: CompletionProjectStateRow["topic_approval_authority_type"],
  observedAt: string,
): EvidenceState | undefined {
  if (value === null || authorityType === null) return undefined;
  return {
    value,
    authority: authorityRef(authorityType, observedAt),
  };
}

export function mapDatabaseProjectToDomain({
  project,
  state,
  tasks,
}: {
  project: AcademicProjectRow;
  state: CompletionProjectStateRow;
  tasks: CompletionTaskRow[];
}): AcademicProject {
  if (project.id !== state.academic_project_id) {
    throw new Error("Completion state belongs to a different academic project.");
  }

  for (const task of tasks) {
    if (task.academic_project_id !== project.id) {
      throw new Error("Completion task belongs to a different academic project.");
    }
  }

  const workType = fromDatabaseWorkType(project.work_type);
  const expectedProfile = profileForWorkType(workType);

  if (project.profile_id !== expectedProfile) {
    throw new Error("Academic project profile is not supported by this Completion App build.");
  }

  if (
    project.institution_id !== fpzgRuleset.institutionId ||
    project.unit_id !== fpzgRuleset.facultyId
  ) {
    throw new Error("Academic project institution/faculty does not match the active FPZG ruleset.");
  }

  const topic = project.topic.trim() || project.title?.trim() || undefined;

  return {
    id: project.id,
    ownerUserId: project.user_id,
    identity: {
      workType,
      institutionId: project.institution_id,
      facultyId: project.unit_id,
      ...(project.program_id ? { programId: project.program_id } : {}),
      profileId: project.profile_id,
      ...(topic ? { topic } : {}),
    },
    timeline: {
      targetSubmissionDate: state.target_submission_date,
      targetDefenseDate: state.target_defense_date,
      deadlineAuthority: authorityRef(
        state.deadline_authority_type,
        state.updated_at,
        {
          sourceId: state.deadline_source_id ?? undefined,
          sourceLabel: state.deadline_source_label ?? undefined,
        },
      ),
    },
    stage: state.stage,
    policy: policyFromState(state),
    aiGovernance: {
      mentorConsultation: state.ai_mentor_consultation,
      disclosureState: state.ai_disclosure_state,
      dataSafetyAcknowledged: state.ai_data_safety_acknowledged,
    },
    mentor: {
      lastSentAt: state.mentor_last_sent_at,
      lastSentVersionLabel: state.mentor_last_sent_version_label,
      lastSeenVersionLabel: state.mentor_last_seen_version_label,
      waitingForMentor: state.mentor_waiting_for_response,
      topicApproved: evidence(
        state.topic_approved,
        state.topic_approval_authority_type,
        state.updated_at,
      ),
      structureApproved: evidence(
        state.structure_approved,
        state.structure_approval_authority_type,
        state.updated_at,
      ),
      methodologyApproved: evidence(
        state.methodology_approved,
        state.methodology_approval_authority_type,
        state.updated_at,
      ),
      defenseApproved: evidence(
        state.defense_approved,
        state.defense_approval_authority_type,
        state.updated_at,
      ),
    },
    // Live Lekta check hydration remains Lekta integration scope. The shared
    // document-verification authority is intentionally not reconstructed from
    // Completion App tables.
    lekta: emptyLektaState(),
    tasks: tasks.map((task) => ({
      id: task.id,
      projectId: task.academic_project_id,
      taskType: task.task_type,
      title: toSanitizedTaskTitle(task.title),
      status: task.status,
      priority: task.priority,
      stage: task.stage,
      authority: authorityRef(task.authority_type, task.updated_at, {
        sourceId: task.authority_source_id ?? undefined,
        sourceLabel: task.authority_source_label ?? undefined,
      }),
      ...(task.capability ? { capability: task.capability } : {}),
      relatedRuleIds: task.related_rule_ids,
      relatedLektaFindingIds: task.related_lekta_finding_ids,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    })),
    blockers: [],
    nextBestAction: null,
    outcomes: {
      submittedAt: state.submitted_at,
      defendedAt: state.defended_at,
    },
    createdAt: project.created_at,
    updatedAt:
      new Date(project.updated_at).getTime() > new Date(state.updated_at).getTime()
        ? project.updated_at
        : state.updated_at,
  };
}
