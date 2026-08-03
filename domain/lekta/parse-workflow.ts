const ISSUE_KEY_PATTERN = /^(rule:|check:)[A-Za-z0-9:_-]{1,313}$/;

export class LektaWorkflowInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LektaWorkflowInputError";
  }
}

function strictObject(value: unknown, allowed: string[]) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new LektaWorkflowInputError("Expected an object.");
  }
  const row = value as Record<string, unknown>;
  if (Object.keys(row).some((key) => !allowed.includes(key))) {
    throw new LektaWorkflowInputError("Unknown field.");
  }
  return row;
}

export function parseLektaHandoffRequest(value: unknown): "CHECK" | "RECHECK" {
  const row = strictObject(value, ["mode"]);
  if (row.mode !== "CHECK" && row.mode !== "RECHECK") {
    throw new LektaWorkflowInputError("Invalid handoff mode.");
  }
  return row.mode;
}

export function parseLektaFindingMutation(value: unknown) {
  const row = strictObject(value, ["action", "issueKey"]);
  if (row.action !== "MARK_CHANGED") {
    throw new LektaWorkflowInputError("Invalid finding action.");
  }
  if (typeof row.issueKey !== "string" || !ISSUE_KEY_PATTERN.test(row.issueKey)) {
    throw new LektaWorkflowInputError("Invalid finding identity.");
  }
  return { action: "MARK_CHANGED" as const, issueKey: row.issueKey };
}
