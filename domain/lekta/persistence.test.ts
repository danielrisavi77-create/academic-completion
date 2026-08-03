import { describe, expect, it } from "vitest";
import {
  filterStaleLektaTasks,
  mapLektaProjection,
  type CompletionLektaFindingRow,
} from "@/domain/lekta/persistence";

const projectId = "00000000-0000-4000-8000-000000000913";
const latestCheck = {
  analysis_id: "analysis-2",
  project_id: projectId,
  user_id: "user-1",
  ruleset_id: "ruleset-2",
  ruleset_version: null,
  score: 91,
  checked_at: "2026-08-03T18:00:00Z",
};

function finding(overrides: Partial<CompletionLektaFindingRow>): CompletionLektaFindingRow {
  return {
    academic_project_id: projectId,
    issue_key: "check:page-numbers",
    check_id: "page-numbers",
    rule_id: null,
    severity: "CRITICAL",
    label: "Provjeri numeriranje stranica",
    lifecycle_status: "OPEN",
    present_in_latest: true,
    task_id: "task-current",
    last_seen_analysis_id: "analysis-2",
    verified_fixed_analysis_id: null,
    ...overrides,
  };
}

describe("Lekta persistence projection", () => {
  it("counts only findings that are still present in the latest check", () => {
    const lekta = mapLektaProjection({
      projectId,
      latestCheck,
      findingRows: [
        finding({}),
        finding({
          issue_key: "check:toc",
          severity: "WARNING",
          present_in_latest: false,
          task_id: "task-stale",
        }),
        finding({
          issue_key: "check:font",
          severity: "CRITICAL",
          lifecycle_status: "VERIFIED_FIXED",
          present_in_latest: false,
          task_id: "task-done",
          verified_fixed_analysis_id: "analysis-2",
        }),
      ],
    });

    expect(lekta.lastAnalysisId).toBe("analysis-2");
    expect(lekta.score).toBe(91);
    expect(lekta.openCriticalCount).toBe(1);
    expect(lekta.openWarningCount).toBe(0);
  });

  it("hides a stale open Lekta task without manufacturing VERIFIED_FIXED", () => {
    const lekta = mapLektaProjection({
      projectId,
      latestCheck,
      findingRows: [
        finding({ issue_key: "check:toc", present_in_latest: false, task_id: "task-stale" }),
      ],
    });
    const tasks = filterStaleLektaTasks(
      [
        { taskType: "LEKTA_FINDING", status: "OPEN", relatedLektaFindingIds: ["check:toc"], id: "task-stale" },
        { taskType: "MENTOR_FEEDBACK", status: "OPEN", relatedLektaFindingIds: [], id: "mentor" },
      ],
      lekta,
    );

    expect(lekta.findings[0]?.status).toBe("OPEN");
    expect(lekta.findings[0]?.presentInLatest).toBe(false);
    expect(tasks.map((task) => task.id)).toEqual(["mentor"]);
  });
});
