import type { AuthorityRef } from "@/domain/authority/authority";
import type { AICapability } from "@/domain/policy/types";
import type { ProjectStage } from "@/domain/project/types";

export const taskStatuses = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_EXTERNAL",
  "READY_TO_SEND",
  "DONE",
  "CANCELLED",
] as const;

export type TaskStatus = (typeof taskStatuses)[number];
export type TaskPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type SanitizedTaskTitle = string & { readonly __brand: "SanitizedTaskTitle" };

const TASK_TITLE_MAX_LENGTH = 160;

export function toSanitizedTaskTitle(input: string): SanitizedTaskTitle {
  const normalized = input
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, TASK_TITLE_MAX_LENGTH);

  if (!normalized) {
    throw new Error("Task title must contain visible text.");
  }

  return normalized as SanitizedTaskTitle;
}

export type ProjectTask = {
  id: string;
  projectId: string;
  taskType: string;
  title: SanitizedTaskTitle;
  status: TaskStatus;
  priority: TaskPriority;
  stage: ProjectStage;
  authority: AuthorityRef;
  capability?: AICapability;
  relatedRuleIds?: string[];
  relatedLektaFindingIds?: string[];
  createdAt: string;
  updatedAt: string;
};
