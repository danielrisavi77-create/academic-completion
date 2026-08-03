import { describe, expect, it } from "vitest";
import { authorityRef } from "@/domain/authority/authority";
import { emptyLektaState } from "@/domain/lekta/types";
import { emptyPolicyState } from "@/domain/policy/types";
import {
  deriveProjectBlockers,
  deriveProjectIntelligence,
  deriveWaitingItems,
  selectNextBestAction,
} from "@/domain/project/intelligence";
import type { AcademicProject } from "@/domain/project/types";
import { toSanitizedTaskTitle, type ProjectTask } from "@/domain/tasks/task";

const now = new Date("2026-08-03T12:00:00Z");
const observedAt = "2026-08-03T12:00:00.000Z";
const userAuthority = authorityRef("USER_REPORTED", observedAt);
const mentorAuthority = authorityRef("MENTOR_REPORTED", observedAt);

function task(overrides: Partial<ProjectTask> = {}): ProjectTask {
  return {
    id: "task-1",
    projectId: "project-1",
    taskType: "GENERAL",
    title: toSanitizedTaskTitle("Dovrši sljedeći otvoreni korak"),
    status: "OPEN",
    priority: "MEDIUM",
    stage: "REVISION",
    authority: userAuthority,
    createdAt: observedAt,
    updatedAt: observedAt,
    ...overrides,
  };
}

function project(overrides: Partial<AcademicProject> = {}): AcademicProject {
  return {
    id: "project-1",
    ownerUserId: "user-1",
    identity: {
      workType: "MASTERS_THESIS",
      institutionId: "unizg",
      facultyId: "fpzg",
      profileId: "fpzg-politologija-diplomski",
    },
    timeline: {
      targetSubmissionDate: "2026-08-10",
      deadlineAuthority: userAuthority,
    },
    stage: "REVISION",
    policy: emptyPolicyState(),
    mentor: {
      lastSentAt: null,
      lastSeenVersionLabel: null,
      waitingForMentor: false,
    },
    lekta: emptyLektaState(),
    tasks: [],
    blockers: [],
    nextBestAction: null,
    outcomes: {
      submittedAt: null,
      defendedAt: null,
    },
    createdAt: observedAt,
    updatedAt: observedAt,
    ...overrides,
  };
}

describe("project blocker engine", () => {
  it("treats a critical Lekta finding as a concrete blocker", () => {
    const current = project({
      stage: "FINAL_CHECK",
      lekta: {
        ...emptyLektaState(),
        lastAnalysisId: "analysis-1",
        lastCheckedAt: observedAt,
        openCriticalCount: 1,
      },
    });

    const blockers = deriveProjectBlockers(current, now);
    expect(blockers.some((item) => item.type === "LEKTA_CRITICAL_FINDING_OPEN")).toBe(true);
  });

  it("derives mentor feedback from typed tasks", () => {
    const mentorTask = task({
      id: "mentor-task",
      taskType: "MENTOR_FEEDBACK",
      title: toSanitizedTaskTitle("Jasnije obrazloži uzorak"),
      priority: "HIGH",
      authority: mentorAuthority,
    });

    const blockers = deriveProjectBlockers(project({ tasks: [mentorTask] }), now);
    const blocker = blockers.find((item) => item.type === "MENTOR_FEEDBACK_OPEN");

    expect(blocker?.relatedTaskId).toBe("mentor-task");
    expect(blocker?.authority.type).toBe("MENTOR_REPORTED");
  });

  it("keeps waiting-on-mentor separate from blockers", () => {
    const current = project({
      mentor: {
        lastSentAt: "2026-08-01T10:00:00.000Z",
        lastSeenVersionLabel: "v3",
        waitingForMentor: true,
      },
    });

    expect(deriveProjectBlockers(current, now).some((item) => item.type === "WAITING_ON_MENTOR")).toBe(false);
    expect(deriveWaitingItems(current, now)).toHaveLength(1);
  });
});

describe("Next Best Action engine", () => {
  it("chooses a critical Lekta resolution before generic deadline pressure", () => {
    const current = project({
      stage: "FINAL_CHECK",
      timeline: {
        targetSubmissionDate: "2026-08-06",
        deadlineAuthority: userAuthority,
      },
      lekta: {
        ...emptyLektaState(),
        lastAnalysisId: "analysis-1",
        lastCheckedAt: observedAt,
        openCriticalCount: 2,
      },
    });

    const intelligence = deriveProjectIntelligence(current, now);
    expect(intelligence.nextBestAction?.route).toBe("LEKTA_HANDOFF");
    expect(intelligence.nextBestAction?.title).toMatch(/Lekta nalaz/i);
  });

  it("chooses the concrete mentor task behind a mentor-feedback blocker", () => {
    const mentorTask = task({
      id: "mentor-task",
      taskType: "MENTOR_FEEDBACK",
      title: toSanitizedTaskTitle("Jasnije obrazloži odabir uzorka"),
      priority: "HIGH",
      authority: mentorAuthority,
    });

    const intelligence = deriveProjectIntelligence(project({ tasks: [mentorTask] }), now);
    expect(intelligence.nextBestAction?.taskId).toBe("mentor-task");
    expect(intelligence.nextBestAction?.title).toBe("Jasnije obrazloži odabir uzorka");
  });

  it("does not let waiting-on-mentor override an actionable task", () => {
    const actionable = task({
      id: "task-actionable",
      title: toSanitizedTaskTitle("Provjeri popis literature"),
      priority: "HIGH",
    });
    const current = project({
      mentor: {
        lastSentAt: observedAt,
        lastSeenVersionLabel: "v3",
        waitingForMentor: true,
      },
      tasks: [actionable],
      timeline: {
        targetSubmissionDate: "2026-09-20",
        deadlineAuthority: userAuthority,
      },
    });

    const intelligence = deriveProjectIntelligence(current, now);
    expect(intelligence.nextBestAction?.taskId).toBe("task-actionable");
    expect(intelligence.nextBestAction?.route).toBe("IN_APP_TASK");
  });

  it("returns a wait state only when there is no more actionable work", () => {
    const current = project({
      mentor: {
        lastSentAt: observedAt,
        lastSeenVersionLabel: "v3",
        waitingForMentor: true,
      },
      timeline: {
        targetSubmissionDate: "2026-10-01",
        deadlineAuthority: userAuthority,
      },
    });
    const blockers = deriveProjectBlockers(current, now);
    const waiting = deriveWaitingItems(current, now);
    const action = selectNextBestAction(current, blockers, waiting);

    expect(action?.route).toBe("WAIT_FOR_EXTERNAL");
    expect(action?.title).toMatch(/odgovor mentora/i);
  });

  it("never generates a readiness percentage as intelligence output", () => {
    const intelligence = deriveProjectIntelligence(project(), now);
    expect(intelligence).not.toHaveProperty("readinessPercent");
    expect(intelligence).not.toHaveProperty("score");
  });
});
