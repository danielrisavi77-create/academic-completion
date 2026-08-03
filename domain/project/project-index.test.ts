import { describe, expect, it } from "vitest";
import { buildProjectIndexItems } from "@/domain/project/project-index";

describe("persisted project index", () => {
  it("keeps only supported final/master projects with matching Completion state", () => {
    const items = buildProjectIndexItems(
      [
        {
          id: "masters",
          work_type: "graduate",
          profile_id: "fpzg-politologija-diplomski",
          deadline: "2026-09-01",
          updated_at: "2026-08-01T12:00:00.000Z",
        },
        {
          id: "seminar",
          work_type: "seminar",
          profile_id: null,
          deadline: null,
          updated_at: "2026-08-02T12:00:00.000Z",
        },
        {
          id: "bad-profile",
          work_type: "final",
          profile_id: "fpzg-politologija-diplomski",
          deadline: null,
          updated_at: "2026-08-03T12:00:00.000Z",
        },
      ],
      [
        {
          academic_project_id: "masters",
          stage: "REVISION",
          target_submission_date: "2026-09-01",
          mentor_waiting_for_response: true,
          updated_at: "2026-08-04T12:00:00.000Z",
        },
        {
          academic_project_id: "bad-profile",
          stage: "DRAFTING",
          target_submission_date: null,
          mentor_waiting_for_response: false,
          updated_at: "2026-08-05T12:00:00.000Z",
        },
      ],
    );

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "masters",
      workType: "MASTERS_THESIS",
      stage: "REVISION",
      waitingForMentor: true,
    });
  });

  it("orders projects by the newest project/state update", () => {
    const items = buildProjectIndexItems(
      [
        {
          id: "older",
          work_type: "final",
          profile_id: "fpzg-politologija-zavrsni",
          deadline: null,
          updated_at: "2026-08-01T12:00:00.000Z",
        },
        {
          id: "newer",
          work_type: "graduate",
          profile_id: "fpzg-politologija-diplomski",
          deadline: null,
          updated_at: "2026-08-02T12:00:00.000Z",
        },
      ],
      [
        {
          academic_project_id: "older",
          stage: "PLANNING",
          target_submission_date: null,
          mentor_waiting_for_response: false,
          updated_at: "2026-08-03T12:00:00.000Z",
        },
        {
          academic_project_id: "newer",
          stage: "REVISION",
          target_submission_date: null,
          mentor_waiting_for_response: false,
          updated_at: "2026-08-02T12:00:00.000Z",
        },
      ],
    );

    expect(items.map((item) => item.id)).toEqual(["older", "newer"]);
  });
});
