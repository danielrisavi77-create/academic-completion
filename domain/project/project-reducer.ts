import type { ProjectEvent } from "@/domain/events/project-events";
import { emptyLektaState, summarizeLektaFindings } from "@/domain/lekta/types";
import { emptyPolicyState } from "@/domain/policy/types";
import type { AcademicProject } from "@/domain/project/types";

function requireProject(project: AcademicProject | null, event: ProjectEvent): AcademicProject {
  if (!project) {
    throw new Error(`Event ${event.type} requires an existing project.`);
  }

  if (project.id !== event.projectId) {
    throw new Error(`Event ${event.type} targets a different project.`);
  }

  return project;
}

export function reduceProjectEvent(
  project: AcademicProject | null,
  event: ProjectEvent,
): AcademicProject {
  if (event.type === "PROJECT_CREATED") {
    if (project) {
      throw new Error("PROJECT_CREATED cannot be applied to an existing project.");
    }

    return {
      id: event.projectId,
      ownerUserId: event.payload.ownerUserId,
      identity: event.payload.identity,
      timeline: event.payload.timeline,
      stage: event.payload.stage,
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
      createdAt: event.occurredAt,
      updatedAt: event.occurredAt,
    };
  }

  const current = requireProject(project, event);
  const updatedAt = event.occurredAt;

  switch (event.type) {
    case "DEADLINE_SET":
      return {
        ...current,
        timeline: {
          ...current.timeline,
          targetSubmissionDate: event.payload.targetSubmissionDate,
          deadlineAuthority: event.payload.deadlineAuthority,
        },
        updatedAt,
      };

    case "STAGE_CHANGED":
      return { ...current, stage: event.payload.stage, updatedAt };

    case "TASK_CREATED":
      if (event.payload.task.projectId !== current.id) {
        throw new Error("Task belongs to a different project.");
      }
      return { ...current, tasks: [...current.tasks, event.payload.task], updatedAt };

    case "TASK_STATUS_CHANGED":
      return {
        ...current,
        tasks: current.tasks.map((task) =>
          task.id === event.payload.taskId
            ? { ...task, status: event.payload.status, updatedAt }
            : task,
        ),
        updatedAt,
      };

    case "MENTOR_SUBMISSION_REPORTED":
      return {
        ...current,
        mentor: {
          ...current.mentor,
          lastSentAt: event.payload.sentAt,
          lastSeenVersionLabel: event.payload.versionLabel ?? current.mentor.lastSeenVersionLabel,
        },
        updatedAt,
      };

    case "MENTOR_WAITING_CHANGED":
      return {
        ...current,
        mentor: { ...current.mentor, waitingForMentor: event.payload.waitingForMentor },
        updatedAt,
      };

    case "MENTOR_APPROVAL_REPORTED":
      return {
        ...current,
        mentor: { ...current.mentor, [event.payload.field]: event.payload.evidence },
        updatedAt,
      };

    case "POLICY_LOADED":
      return { ...current, policy: event.payload.policy, updatedAt };

    case "LEKTA_CHECK_IMPORTED": {
      const summary = summarizeLektaFindings(event.payload.findings);
      return {
        ...current,
        lekta: {
          lastAnalysisId: event.payload.analysisId,
          lastCheckedAt: event.payload.checkedAt,
          rulesetId: event.payload.rulesetId,
          rulesetVersion: event.payload.rulesetVersion,
          findings: event.payload.findings,
          ...summary,
        },
        updatedAt,
      };
    }

    case "LEKTA_FINDING_USER_CHANGED":
      return {
        ...current,
        lekta: {
          ...current.lekta,
          findings: current.lekta.findings.map((finding) =>
            finding.findingId === event.payload.findingId && finding.status !== "VERIFIED_FIXED"
              ? { ...finding, status: "USER_CHANGED" }
              : finding,
          ),
        },
        updatedAt,
      };

    case "LEKTA_FINDING_RECHECK_REQUIRED":
      return {
        ...current,
        lekta: {
          ...current.lekta,
          findings: current.lekta.findings.map((finding) =>
            finding.findingId === event.payload.findingId && finding.status !== "VERIFIED_FIXED"
              ? { ...finding, status: "RECHECK_REQUIRED" }
              : finding,
          ),
        },
        updatedAt,
      };

    case "SUBMISSION_REPORTED":
      return {
        ...current,
        stage: "SUBMISSION",
        outcomes: { ...current.outcomes, submittedAt: event.payload.submittedAt },
        updatedAt,
      };

    case "DEFENSE_REPORTED":
      return {
        ...current,
        stage: "COMPLETED",
        outcomes: { ...current.outcomes, defendedAt: event.payload.defendedAt },
        updatedAt,
      };

    case "AI_ACTION_AUTHORIZED":
    case "AI_ACTION_DENIED":
      // AI events are audit metadata only; they never mutate academic project truth.
      return { ...current, updatedAt };
  }
}
