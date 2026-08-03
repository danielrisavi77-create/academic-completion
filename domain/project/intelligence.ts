import { authorityRef, type AuthorityRef } from "@/domain/authority/authority";
import type { ProjectBlocker, BlockerType } from "@/domain/blockers/types";
import type { NextBestAction } from "@/domain/next-action/types";
import type { AcademicProject } from "@/domain/project/types";
import type { ProjectTask } from "@/domain/tasks/task";

const DAY_MS = 24 * 60 * 60 * 1000;
const CLOSED_TASKS = new Set(["DONE", "CANCELLED"]);

export type ProjectWaitingItem = {
  id: string;
  label: string;
  authority: AuthorityRef;
};

export type ProjectIntelligence = {
  blockers: ProjectBlocker[];
  waitingItems: ProjectWaitingItem[];
  nextBestAction: NextBestAction | null;
};

function daysUntil(date: string, referenceDate: Date): number {
  const target = new Date(`${date}T00:00:00Z`);
  const referenceUtc = Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate(),
  );
  return Math.ceil((target.getTime() - referenceUtc) / DAY_MS);
}

function isOpenTask(task: ProjectTask) {
  return !CLOSED_TASKS.has(task.status);
}

function taskPriorityValue(task: ProjectTask) {
  const priority = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 } as const;
  const status = {
    READY_TO_SEND: 5,
    IN_PROGRESS: 4,
    OPEN: 3,
    WAITING_EXTERNAL: 1,
    DONE: 0,
    CANCELLED: 0,
  } as const;
  return priority[task.priority] * 10 + status[task.status];
}

function topActionableTask(tasks: ProjectTask[]) {
  return tasks
    .filter((task) => isOpenTask(task) && task.status !== "WAITING_EXTERNAL")
    .sort((a, b) => taskPriorityValue(b) - taskPriorityValue(a))[0];
}

function blocker(
  project: AcademicProject,
  type: BlockerType,
  severity: ProjectBlocker["severity"],
  title: string,
  reason: string,
  authority: AuthorityRef,
  options: Pick<ProjectBlocker, "relatedTaskId" | "relatedRuleIds"> = {},
): ProjectBlocker {
  return {
    id: `project-${project.id}-${type.toLowerCase()}`,
    projectId: project.id,
    type,
    severity,
    title,
    reason,
    authority,
    ...(options.relatedTaskId ? { relatedTaskId: options.relatedTaskId } : {}),
    ...(options.relatedRuleIds?.length ? { relatedRuleIds: options.relatedRuleIds } : {}),
  };
}

function deriveDeadlineBlocker(project: AcademicProject, referenceDate: Date): ProjectBlocker | null {
  const target = project.timeline.targetSubmissionDate;
  if (!target) return null;

  const days = daysUntil(target, referenceDate);
  const authority = authorityRef("SYSTEM_ASSESSED", referenceDate.toISOString(), {
    sourceId: project.timeline.deadlineAuthority.sourceId,
    sourceLabel: "Izračun prema ciljanom datumu projekta",
  });

  if (days < 0) {
    return blocker(
      project,
      "DEADLINE_RISK",
      "CRITICAL",
      "Ciljani datum predaje je prošao",
      "Projekt treba novi realni cilj prije nego što ostali prioriteti imaju smisla.",
      authority,
    );
  }

  if (days <= 7) {
    return blocker(
      project,
      "DEADLINE_RISK",
      "CRITICAL",
      `Do ciljanog datuma je ${days} dana`,
      "Vrijeme je vrlo ograničeno; otvoreni substantive i verification taskovi sada nose veći execution rizik.",
      authority,
    );
  }

  if (days <= 21) {
    return blocker(
      project,
      "DEADLINE_RISK",
      "HIGH",
      `Do ciljanog datuma je ${days} dana`,
      "Rok je dovoljno blizu da se otvoreni mentorovi i verification taskovi moraju aktivno prioritizirati.",
      authority,
    );
  }

  return null;
}

function deriveLektaBlockers(project: AcademicProject, referenceDate: Date): ProjectBlocker[] {
  const blockers: ProjectBlocker[] = [];
  const lektaAuthority = authorityRef("LEKTA_VERIFIED", referenceDate.toISOString(), {
    sourceId: project.lekta.lastAnalysisId ?? undefined,
    sourceLabel: "Lekta provjera dokumenta",
  });

  if (project.lekta.openCriticalCount > 0) {
    blockers.push(
      blocker(
        project,
        "LEKTA_CRITICAL_FINDING_OPEN",
        "CRITICAL",
        `${project.lekta.openCriticalCount} kritičnih Lekta nalaza je otvoreno`,
        "Kritični nalaz na stvarnom dokumentu ostaje otvoren dok novi Lekta re-check ne potvrdi da je nestao.",
        lektaAuthority,
      ),
    );
  } else if (
    (project.stage === "FINAL_CHECK" || project.stage === "SUBMISSION") &&
    !project.lekta.lastCheckedAt
  ) {
    blockers.push(
      blocker(
        project,
        "LEKTA_CHECK_MISSING",
        "HIGH",
        "Finalna Lekta provjera još nije napravljena",
        "Projekt je u finalnoj fazi, ali stvarni dokument još nema aktualni verification signal.",
        authorityRef("SYSTEM_ASSESSED", referenceDate.toISOString()),
      ),
    );
  }

  return blockers;
}

function deriveTaskBlockers(project: AcademicProject): ProjectBlocker[] {
  const openTasks = project.tasks.filter(isOpenTask);
  const blockers: ProjectBlocker[] = [];

  const mentorTasks = openTasks.filter((task) => task.taskType === "MENTOR_FEEDBACK");
  if (mentorTasks.length > 0) {
    const top = topActionableTask(mentorTasks) ?? mentorTasks[0]!;
    blockers.push(
      blocker(
        project,
        "MENTOR_FEEDBACK_OPEN",
        mentorTasks.some((task) => task.priority === "CRITICAL") || mentorTasks.length >= 3
          ? "HIGH"
          : "MEDIUM",
        mentorTasks.length === 1
          ? "Otvoren je mentorov zahtjev"
          : `${mentorTasks.length} mentorova zahtjeva je otvoreno`,
        "Mentorov feedback treba pretvoriti u eksplicitan task prije sljedeće verzije rada.",
        top.authority,
        { relatedTaskId: top.id },
      ),
    );
  }

  const methodologyTask = openTasks.find((task) => task.taskType === "METHODOLOGY");
  if (methodologyTask) {
    blockers.push(
      blocker(
        project,
        "METHODOLOGY_UNRESOLVED",
        methodologyTask.priority === "CRITICAL" ? "CRITICAL" : "HIGH",
        "Metodologija još ima otvoren substantive task",
        methodologyTask.title,
        methodologyTask.authority,
        { relatedTaskId: methodologyTask.id },
      ),
    );
  }

  return blockers;
}

export function deriveProjectBlockers(
  project: AcademicProject,
  referenceDate = new Date(),
): ProjectBlocker[] {
  const candidates = [
    ...deriveLektaBlockers(project, referenceDate),
    ...deriveTaskBlockers(project),
  ];

  const deadline = deriveDeadlineBlocker(project, referenceDate);
  if (deadline) candidates.push(deadline);

  return candidates;
}

export function deriveWaitingItems(
  project: AcademicProject,
  referenceDate = new Date(),
): ProjectWaitingItem[] {
  if (!project.mentor.waitingForMentor) return [];

  return [
    {
      id: `project-${project.id}-waiting-mentor`,
      label: "Čeka se odgovor mentora",
      authority: authorityRef("USER_REPORTED", referenceDate.toISOString(), {
        sourceLabel: "Status projekta prema evidenciji korisnika",
      }),
    },
  ];
}

const blockerPriority: Record<BlockerType, number> = {
  LEKTA_CRITICAL_FINDING_OPEN: 100,
  AI_POLICY_UNRESOLVED: 96,
  SUBMISSION_ADMIN_REQUIREMENT_OPEN: 94,
  METHODOLOGY_UNRESOLVED: 90,
  MENTOR_FEEDBACK_OPEN: 86,
  MENTOR_NOT_SEEN_CURRENT_VERSION: 84,
  SOURCE_GAP: 82,
  LEKTA_CHECK_MISSING: 80,
  AI_DISCLOSURE_REQUIRED: 74,
  DEADLINE_RISK: 50,
  WAITING_ON_MENTOR: 20,
};

function actionFromTask(project: AcademicProject, task: ProjectTask): NextBestAction {
  return {
    actionId: `task-action-${task.id}`,
    projectId: project.id,
    taskId: task.id,
    title: task.title,
    reason: `Ovaj ${task.priority.toLowerCase()} prioritetni task je otvoren u fazi ${project.stage}.`,
    ...(task.capability ? { capability: task.capability } : {}),
    route: task.capability ? "AI_ACTION" : "IN_APP_TASK",
    authority: task.authority,
  };
}

function actionFromBlocker(project: AcademicProject, blockerItem: ProjectBlocker): NextBestAction {
  if (blockerItem.relatedTaskId) {
    const relatedTask = project.tasks.find((task) => task.id === blockerItem.relatedTaskId);
    if (relatedTask && relatedTask.status !== "WAITING_EXTERNAL") {
      return actionFromTask(project, relatedTask);
    }
  }

  const actionByType: Partial<Record<BlockerType, Pick<NextBestAction, "title" | "route">>> = {
    LEKTA_CRITICAL_FINDING_OPEN: {
      title: "Riješi najkritičniji Lekta nalaz i napravi re-check",
      route: "LEKTA_HANDOFF",
    },
    LEKTA_CHECK_MISSING: {
      title: "Pokreni finalni Lekta Check",
      route: "LEKTA_HANDOFF",
    },
    DEADLINE_RISK: {
      title: "Provjeri najbliži realni rok i zaključaj plan do njega",
      route: "OFFICIAL_PROCESS",
    },
  };

  const mapped = actionByType[blockerItem.type];
  return {
    actionId: `blocker-action-${blockerItem.id}`,
    projectId: project.id,
    title: mapped?.title ?? blockerItem.title,
    reason: blockerItem.reason,
    route: mapped?.route ?? "IN_APP_TASK",
    authority: blockerItem.authority,
  };
}

export function selectNextBestAction(
  project: AcademicProject,
  blockers: ProjectBlocker[],
  waitingItems: ProjectWaitingItem[],
): NextBestAction | null {
  const substantiveBlocker = blockers
    .filter((item) => item.type !== "DEADLINE_RISK")
    .sort((a, b) => blockerPriority[b.type] - blockerPriority[a.type])[0];

  if (substantiveBlocker) {
    return actionFromBlocker(project, substantiveBlocker);
  }

  const task = topActionableTask(project.tasks);
  if (task) {
    return actionFromTask(project, task);
  }

  const deadlineBlocker = blockers.find((item) => item.type === "DEADLINE_RISK");
  if (deadlineBlocker) {
    return actionFromBlocker(project, deadlineBlocker);
  }

  if (waitingItems[0]) {
    return {
      actionId: `waiting-action-${waitingItems[0].id}`,
      projectId: project.id,
      title: waitingItems[0].label,
      reason: "Trenutačno nema važnijeg akcijskog taska koji sustav može predložiti dok čekaš vanjsku odluku.",
      route: "WAIT_FOR_EXTERNAL",
      authority: waitingItems[0].authority,
    };
  }

  return null;
}

export function deriveProjectIntelligence(
  project: AcademicProject,
  referenceDate = new Date(),
): ProjectIntelligence {
  const blockers = deriveProjectBlockers(project, referenceDate);
  const waitingItems = deriveWaitingItems(project, referenceDate);
  const nextBestAction = selectNextBestAction(project, blockers, waitingItems);

  return { blockers, waitingItems, nextBestAction };
}
