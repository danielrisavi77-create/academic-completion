import { describe, expect, it } from "vitest";
import { authorityRef } from "@/domain/authority/authority";
import type { ProjectEvent } from "@/domain/events/project-events";
import { reduceProjectEvent } from "@/domain/project/project-reducer";
import { InMemoryProjectRepository } from "@/domain/project/repository";
import { toSanitizedTaskTitle } from "@/domain/tasks/task";

const projectId = "project-1";
const userId = "user-1";
const t0 = "2026-08-03T18:00:00.000Z";
const userAuthority = authorityRef("USER_REPORTED", t0);

function createEvent(): ProjectEvent {
  return {
    eventId: "event-create",
    projectId,
    type: "PROJECT_CREATED",
    occurredAt: t0,
    authority: userAuthority,
    payload: {
      ownerUserId: userId,
      identity: {
        workType: "MASTERS_THESIS",
        institutionId: "unizg",
        facultyId: "fpzg",
        profileId: "fpzg-politologija-diplomski",
      },
      timeline: {
        targetSubmissionDate: "2026-09-14",
        deadlineAuthority: userAuthority,
      },
      stage: "REVISION",
    },
  };
}

describe("project reducer", () => {
  it("creates a typed academic project without synthetic readiness state", () => {
    const project = reduceProjectEvent(null, createEvent());

    expect(project.stage).toBe("REVISION");
    expect(project.tasks).toEqual([]);
    expect(project.blockers).toEqual([]);
    expect(project.nextBestAction).toBeNull();
    expect(project).not.toHaveProperty("readinessPercent");
  });

  it("starts AI governance in a fail-closed state", () => {
    const project = reduceProjectEvent(null, createEvent());

    expect(project.aiGovernance).toEqual({
      mentorConsultation: "NOT_ASKED",
      disclosureState: "NOT_STARTED",
      dataSafetyAcknowledged: false,
    });
  });

  it("updates AI governance through typed events without changing academic stage", () => {
    let project = reduceProjectEvent(null, createEvent());

    project = reduceProjectEvent(project, {
      eventId: "event-ai-consultation",
      projectId,
      type: "AI_MENTOR_CONSULTATION_REPORTED",
      occurredAt: "2026-08-03T18:05:00.000Z",
      authority: userAuthority,
      payload: { state: "USER_REPORTED_CONSULTED" },
    });

    project = reduceProjectEvent(project, {
      eventId: "event-ai-disclosure",
      projectId,
      type: "AI_DISCLOSURE_STATE_CHANGED",
      occurredAt: "2026-08-03T18:06:00.000Z",
      authority: userAuthority,
      payload: { state: "USAGE_EVENTS_EXIST" },
    });

    project = reduceProjectEvent(project, {
      eventId: "event-ai-safety",
      projectId,
      type: "AI_DATA_SAFETY_ACKNOWLEDGED",
      occurredAt: "2026-08-03T18:07:00.000Z",
      authority: userAuthority,
      payload: { acknowledged: true },
    });

    expect(project.aiGovernance).toEqual({
      mentorConsultation: "USER_REPORTED_CONSULTED",
      disclosureState: "USAGE_EVENTS_EXIST",
      dataSafetyAcknowledged: true,
    });
    expect(project.stage).toBe("REVISION");
  });

  it("stores mentor approval as user-reported evidence, not external verification", () => {
    const project = reduceProjectEvent(null, createEvent());
    const event: ProjectEvent = {
      eventId: "event-mentor",
      projectId,
      type: "MENTOR_APPROVAL_REPORTED",
      occurredAt: "2026-08-03T18:10:00.000Z",
      authority: userAuthority,
      payload: {
        field: "methodologyApproved",
        evidence: { value: true, authority: userAuthority },
      },
    };

    const next = reduceProjectEvent(project, event);
    expect(next.mentor.methodologyApproved?.authority.type).toBe("USER_REPORTED");
  });

  it("does not let a user-change event mark a Lekta finding verified", () => {
    let project = reduceProjectEvent(null, createEvent());
    const lektaAuthority = authorityRef("LEKTA_VERIFIED", "2026-08-03T18:12:00.000Z", {
      sourceId: "analysis-1",
    });

    project = reduceProjectEvent(project, {
      eventId: "event-lekta",
      projectId,
      type: "LEKTA_CHECK_IMPORTED",
      occurredAt: lektaAuthority.observedAt,
      authority: lektaAuthority,
      payload: {
        analysisId: "analysis-1",
        checkedAt: lektaAuthority.observedAt,
        rulesetId: "fpzg-docx",
        rulesetVersion: "1",
        findings: [
          {
            findingId: "finding-1",
            severity: "CRITICAL",
            status: "OPEN",
            label: "Formalni nalaz",
          },
        ],
      },
    });

    project = reduceProjectEvent(project, {
      eventId: "event-user-change",
      projectId,
      type: "LEKTA_FINDING_USER_CHANGED",
      occurredAt: "2026-08-03T18:15:00.000Z",
      authority: userAuthority,
      payload: { findingId: "finding-1" },
    });

    expect(project.lekta.findings[0]?.status).toBe("USER_CHANGED");
    expect(project.lekta.findings[0]?.status).not.toBe("VERIFIED_FIXED");
  });

  it("adds only a sanitized one-line task title", () => {
    const project = reduceProjectEvent(null, createEvent());
    const title = toSanitizedTaskTitle("  Jasnije\nobrazložiti   uzorak  ");

    const next = reduceProjectEvent(project, {
      eventId: "event-task",
      projectId,
      type: "TASK_CREATED",
      occurredAt: "2026-08-03T18:20:00.000Z",
      authority: userAuthority,
      payload: {
        task: {
          id: "task-1",
          projectId,
          taskType: "MENTOR_FEEDBACK",
          title,
          status: "OPEN",
          priority: "HIGH",
          stage: "REVISION",
          authority: userAuthority,
          createdAt: "2026-08-03T18:20:00.000Z",
          updatedAt: "2026-08-03T18:20:00.000Z",
        },
      },
    });

    expect(next.tasks[0]?.title).toBe("Jasnije obrazložiti uzorak");
  });
});

describe("project repository boundary", () => {
  it("returns cloned project state instead of mutable repository references", async () => {
    const repository = new InMemoryProjectRepository();
    const project = reduceProjectEvent(null, createEvent());
    await repository.save(project);

    const loaded = await repository.getById(projectId);
    if (!loaded) throw new Error("Project should exist.");

    loaded.stage = "COMPLETED";
    const loadedAgain = await repository.getById(projectId);

    expect(loadedAgain?.stage).toBe("REVISION");
  });
});
