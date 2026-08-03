import { describe, expect, it } from "vitest";
import { fpzgRuleset } from "@/data/rules/fpzg/ruleset";
import { mapDatabaseProjectToDomain } from "@/domain/persistence/project-mapper";
import type {
  AcademicProjectRow,
  CompletionProjectStateRow,
  CompletionTaskRow,
} from "@/domain/persistence/types";

const now = "2026-08-03T12:00:00.000Z";

const academicProject: AcademicProjectRow = {
  id: "project-1",
  user_id: "user-1",
  work_type: "graduate",
  profile_id: "fpzg-politologija-diplomski",
  title: null,
  topic: "",
  institution_id: "unizg",
  unit_id: "fpzg",
  program_id: null,
  deadline: "2026-09-01",
  stage: "revision",
  ruleset_id: fpzgRuleset.id,
  ruleset_version: fpzgRuleset.version,
  created_at: now,
  updated_at: now,
};

const completionState: CompletionProjectStateRow = {
  academic_project_id: "project-1",
  stage: "REVISION",
  target_submission_date: "2026-09-01",
  target_defense_date: null,
  deadline_authority_type: "USER_REPORTED",
  deadline_source_id: null,
  deadline_source_label: null,
  mentor_last_sent_at: null,
  mentor_last_sent_version_label: null,
  mentor_last_seen_version_label: null,
  mentor_waiting_for_response: false,
  topic_approved: true,
  topic_approval_authority_type: "USER_REPORTED",
  structure_approved: null,
  structure_approval_authority_type: null,
  methodology_approved: null,
  methodology_approval_authority_type: null,
  defense_approved: null,
  defense_approval_authority_type: null,
  ai_policy_ruleset_id: fpzgRuleset.id,
  ai_policy_ruleset_version: fpzgRuleset.version,
  ai_policy_verified_at: fpzgRuleset.verifiedAt,
  ai_mentor_consultation: "USER_REPORTED_CONSULTED",
  ai_disclosure_state: "USAGE_EVENTS_EXIST",
  ai_data_safety_acknowledged: false,
  submitted_at: null,
  defended_at: null,
  created_at: now,
  updated_at: now,
};

const task: CompletionTaskRow = {
  id: "task-1",
  academic_project_id: "project-1",
  task_type: "MENTOR_FEEDBACK",
  title: "Jasnije obrazloži uzorak",
  status: "OPEN",
  priority: "HIGH",
  stage: "REVISION",
  authority_type: "MENTOR_REPORTED",
  authority_source_id: null,
  authority_source_label: "Sažetak zahtjeva",
  capability: "QUESTION_COACHING",
  related_rule_ids: [],
  related_lekta_finding_ids: [],
  created_at: now,
  updated_at: now,
};

describe("database project mapper", () => {
  it("maps canonical shared DB work types and reconstructs current FPZG capability decisions", () => {
    const project = mapDatabaseProjectToDomain({
      project: academicProject,
      state: completionState,
      tasks: [task],
    });

    expect(project.ownerUserId).toBe("user-1");
    expect(project.identity.workType).toBe("MASTERS_THESIS");
    expect(project.identity.facultyId).toBe("fpzg");
    expect(project.policy.capabilityDecisions.GENERATE_SUBMISSION_TEXT).toBe("DENY");
    expect(project.policy.capabilityDecisions.LANGUAGE_REVIEW).toBe("ALLOW_WITH_CONDITIONS");
    expect(project.aiGovernance.mentorConsultation).toBe("USER_REPORTED_CONSULTED");
  });

  it("fails closed when the persisted ruleset version is stale", () => {
    const project = mapDatabaseProjectToDomain({
      project: academicProject,
      state: { ...completionState, ai_policy_ruleset_version: "stale" },
      tasks: [],
    });

    expect(project.policy.capabilityDecisions).toEqual({});
  });

  it("preserves task authority without promoting it to external verification", () => {
    const project = mapDatabaseProjectToDomain({
      project: academicProject,
      state: completionState,
      tasks: [task],
    });

    expect(project.tasks[0]?.authority.type).toBe("MENTOR_REPORTED");
    expect(project.tasks[0]?.title).toBe("Jasnije obrazloži uzorak");
  });

  it("rejects a task from another academic project", () => {
    expect(() =>
      mapDatabaseProjectToDomain({
        project: academicProject,
        state: completionState,
        tasks: [{ ...task, academic_project_id: "project-2" }],
      }),
    ).toThrow(/different academic project/);
  });

  it("rejects unsupported shared-core work types instead of guessing", () => {
    expect(() =>
      mapDatabaseProjectToDomain({
        project: { ...academicProject, work_type: "seminar" },
        state: completionState,
        tasks: [],
      }),
    ).toThrow(/Unsupported Academic Completion work type/);
  });

  it("rejects a profile that does not match the canonical work type", () => {
    expect(() =>
      mapDatabaseProjectToDomain({
        project: { ...academicProject, profile_id: "fpzg-politologija-zavrsni" },
        state: completionState,
        tasks: [],
      }),
    ).toThrow(/profile is not supported/);
  });
});
