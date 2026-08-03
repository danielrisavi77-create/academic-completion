export type UserTaskStatus = "OPEN" | "IN_PROGRESS" | "DONE";

export type MentorWorkflowInput =
  | { action: "SUBMITTED"; versionLabel: string | null }
  | { action: "RESPONDED" };

const TASK_MUTATION_KEYS = new Set(["status"]);
const MENTOR_MUTATION_KEYS = new Set(["action", "versionLabel"]);
const taskStatuses = new Set<UserTaskStatus>(["OPEN", "IN_PROGRESS", "DONE"]);

export class WorkflowMutationInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkflowMutationInputError";
  }
}

function requirePlainObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new WorkflowMutationInputError("Workflow mutation must be an object.");
  }
  return value as Record<string, unknown>;
}

function rejectUnknownKeys(record: Record<string, unknown>, allowed: Set<string>) {
  if (Object.keys(record).some((key) => !allowed.has(key))) {
    throw new WorkflowMutationInputError("Workflow mutation contains unsupported fields.");
  }
}

export function parseTaskStatusMutation(value: unknown): UserTaskStatus {
  const record = requirePlainObject(value);
  rejectUnknownKeys(record, TASK_MUTATION_KEYS);

  if (typeof record.status !== "string" || !taskStatuses.has(record.status as UserTaskStatus)) {
    throw new WorkflowMutationInputError("Unsupported task status.");
  }

  return record.status as UserTaskStatus;
}

export function parseMentorWorkflowMutation(value: unknown): MentorWorkflowInput {
  const record = requirePlainObject(value);
  rejectUnknownKeys(record, MENTOR_MUTATION_KEYS);

  if (record.action === "RESPONDED") {
    if (record.versionLabel !== undefined) {
      throw new WorkflowMutationInputError("Mentor response does not accept a version label.");
    }
    return { action: "RESPONDED" };
  }

  if (record.action !== "SUBMITTED") {
    throw new WorkflowMutationInputError("Unsupported mentor workflow action.");
  }

  if (record.versionLabel === undefined || record.versionLabel === null || record.versionLabel === "") {
    return { action: "SUBMITTED", versionLabel: null };
  }

  if (typeof record.versionLabel !== "string") {
    throw new WorkflowMutationInputError("Version label must be text.");
  }

  const versionLabel = record.versionLabel.trim();
  if (!versionLabel || versionLabel.length > 80 || /[\n\r\t]/.test(versionLabel)) {
    throw new WorkflowMutationInputError("Version label must contain 1 to 80 single-line characters.");
  }

  return { action: "SUBMITTED", versionLabel };
}
