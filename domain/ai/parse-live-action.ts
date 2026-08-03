export type LiveAIActionInput = {
  taskId: string;
  userInput: string;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_KEYS = new Set(["taskId", "userInput"]);

export class LiveAIActionInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LiveAIActionInputError";
  }
}

export function parseLiveAIActionInput(value: unknown): LiveAIActionInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new LiveAIActionInputError("AI action request must be an object.");
  }

  const record = value as Record<string, unknown>;
  const unknownKeys = Object.keys(record).filter((key) => !ALLOWED_KEYS.has(key));
  if (unknownKeys.length > 0) {
    throw new LiveAIActionInputError("AI action request contains unsupported fields.");
  }

  if (typeof record.taskId !== "string" || !UUID_PATTERN.test(record.taskId)) {
    throw new LiveAIActionInputError("AI action requires a valid taskId.");
  }

  if (typeof record.userInput !== "string") {
    throw new LiveAIActionInputError("AI action requires text input.");
  }

  const userInput = record.userInput.trim();
  if (!userInput || userInput.length > 12_000) {
    throw new LiveAIActionInputError("AI action text must contain 1 to 12000 characters.");
  }

  return {
    taskId: record.taskId,
    userInput,
  };
}
