import { describe, expect, it } from "vitest";
import { fpzgRuleset } from "@/data/rules/fpzg/ruleset";
import { mapDatabaseProjectToDomain } from "@/domain/persistence/project-mapper";
import type {
  AcademicProjectRow,
  CompletionProjectStateRow,
} from "@/domain/persistence/types";

const now = "2026-08-03T21:00:00.000Z";

const projectRow: AcademicProjectRow = {
  id: "project-version-semantics",
  user_id: "user-1",
  work_type: "graduate",
  profile_id: "fpzg-politologija-diplomski",
  title: null,
  topic: "",
  institution_id: "unizg",
  unit_id: "fpzg",
  program_id: null,
  deadline: "2026-09-01",
  stage: "mentor-review",
  ruleset_id: fpzgRuleset.id,
  ruleset_version: fpzgRuleset.version,
  created_at: now,
  updated_at: now,
};

const stateRow: CompletionProjectStateRow = {
  academic_project_id: projectRow.id,
  stage: "MENTOR_REVIEW",
  target_submission_date: "2026-09-01",
  target_defense_date: null,
  deadline_authority_type: "USER_REPORTED",
  deadline_source_id: null,
  deadline_source_label: null,
  mentor_last_sent_at: now,
  mentor_last_sent_version_label: "v5",
  mentor_last_seen_version_label: "v2",
  mentor_waiting_for_response: true,
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
  ai_mentor_consultation: "NOT_ASKED",
  ai_disclosure_state: "NOT_STARTED",
  ai_data_safety_acknowledged: false,
  submitted_at: null,
  defended_at: null,
  created_at: now,
  updated_at: now,
};

describe("mentor version authority semantics", () => {
  it("keeps the user-reported sent version separate from the mentor-seen version", () => {
    const project = mapDatabaseProjectToDomain({
      project: projectRow,
      state: stateRow,
      tasks: [],
    });

    expect(project.mentor.lastSentVersionLabel).toBe("v5");
    expect(project.mentor.lastSeenVersionLabel).toBe("v2");
    expect(project.mentor.waitingForMentor).toBe(true);
  });
});
