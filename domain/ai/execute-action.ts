import { assertAIInputDataSafe } from "@/domain/ai/data-safety";
import { buildAIInstructions } from "@/domain/ai/instructions";
import type { AIProvider, AIProviderResponse } from "@/domain/ai/provider";
import type { AICapability } from "@/domain/policy/types";
import { resolveCapability, type PolicyResolution } from "@/domain/policy/resolver";
import type { AcademicProject } from "@/domain/project/types";
import type { ProjectTask } from "@/domain/tasks/task";

const MAX_USER_INPUT_CHARS = 12_000;
const AI_ACTIONABLE_TASK_STATUSES = new Set(["OPEN", "IN_PROGRESS"]);

export type AIActionAuditEvent = {
  eventType: "AI_ACTION_AUTHORIZED" | "AI_ACTION_DENIED";
  projectId: string;
  taskId: string;
  capability: AICapability;
  policyRuleIds: string[];
  providerId?: string;
  modelId?: string;
};

export type AIActionDeniedResult = {
  status: "DENIED";
  resolution: PolicyResolution;
  auditEvent: AIActionAuditEvent;
};

export type AIActionCompletedResult = {
  status: "COMPLETED";
  resolution: PolicyResolution;
  output: AIProviderResponse;
  auditEvent: AIActionAuditEvent;
};

export type AIActionResult = AIActionDeniedResult | AIActionCompletedResult;

export class AIActionContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIActionContractError";
  }
}

function findTask(project: AcademicProject, taskId: string): ProjectTask {
  const task = project.tasks.find((candidate) => candidate.id === taskId);
  if (!task) {
    throw new AIActionContractError("AI action requires an existing project task.");
  }
  return task;
}

function validateInput(userInput: string) {
  const normalized = userInput.trim();
  if (!normalized) {
    throw new AIActionContractError("AI action requires non-empty user input.");
  }
  if (normalized.length > MAX_USER_INPUT_CHARS) {
    throw new AIActionContractError("AI action input exceeds the MTK size limit.");
  }
  return normalized;
}

export async function executeContextualAIAction({
  project,
  taskId,
  capability,
  userInput,
  provider,
}: {
  project: AcademicProject;
  taskId: string;
  capability: AICapability;
  userInput: string;
  provider: AIProvider;
}): Promise<AIActionResult> {
  const task = findTask(project, taskId);

  if (task.projectId !== project.id) {
    throw new AIActionContractError("AI task belongs to a different project.");
  }

  if (!AI_ACTIONABLE_TASK_STATUSES.has(task.status)) {
    throw new AIActionContractError("AI action is not allowed for the current task status.");
  }

  if (!task.capability) {
    throw new AIActionContractError("Project task does not declare an AI capability.");
  }

  if (task.capability !== capability) {
    throw new AIActionContractError("Requested AI capability does not match the project task.");
  }

  const normalizedInput = validateInput(userInput);
  assertAIInputDataSafe(normalizedInput);

  const resolution = resolveCapability({ project, capability });

  if (!resolution.authorized) {
    return {
      status: "DENIED",
      resolution,
      auditEvent: {
        eventType: "AI_ACTION_DENIED",
        projectId: project.id,
        taskId: task.id,
        capability,
        policyRuleIds: resolution.sourceRuleIds,
      },
    };
  }

  const output = await provider.execute({
    capability,
    taskTitle: task.title,
    userInput: normalizedInput,
    obligations: resolution.obligations,
    systemInstructions: buildAIInstructions(capability, resolution.obligations),
  });

  return {
    status: "COMPLETED",
    resolution,
    output,
    auditEvent: {
      eventType: "AI_ACTION_AUTHORIZED",
      projectId: project.id,
      taskId: task.id,
      capability,
      policyRuleIds: resolution.sourceRuleIds,
      providerId: output.providerId,
      modelId: output.modelId,
    },
  };
}
