import { NextResponse } from "next/server";
import { AIDataSafetyError } from "@/domain/ai/data-safety";
import {
  AIActionContractError,
  executeContextualAIAction,
} from "@/domain/ai/execute-action";
import {
  LiveAIActionInputError,
  parseLiveAIActionInput,
} from "@/domain/ai/parse-live-action";
import type { AICapability } from "@/domain/policy/types";
import {
  AnthropicProviderError,
  AnthropicSonnetProvider,
  COMPLETION_AI_MODEL,
  COMPLETION_AI_PROVIDER,
} from "@/lib/ai/anthropic-provider";
import {
  AIAuditPersistenceError,
  recordAIActionAuditEvent,
} from "@/lib/ai/audit-repository";
import {
  CompletionAIRateLimitError,
  CompletionAIUsageError,
  UsageTrackedAIProvider,
} from "@/lib/ai/usage-tracked-provider";
import { getOwnedProject } from "@/lib/persistence/completion-repository";
import { requireAuthenticatedUser } from "@/lib/supabase/server";

const PROJECT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LIVE_CAPABILITIES = new Set<AICapability>(["DISCLOSURE_HELP"]);

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
    },
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const user = await requireAuthenticatedUser();
  if (!user) {
    return json(401, { error: "Prijavi se za korištenje AI pomoći." });
  }

  const { projectId } = await context.params;
  if (!PROJECT_ID_PATTERN.test(projectId)) {
    return json(400, { error: "Neispravan projekt." });
  }

  let input;
  try {
    input = parseLiveAIActionInput(await request.json());
  } catch (error) {
    if (error instanceof LiveAIActionInputError) {
      return json(400, { error: "Neispravan AI zahtjev." });
    }
    return json(400, { error: "Neispravan JSON zahtjev." });
  }

  let project;
  try {
    project = await getOwnedProject({ ownerUserId: user.id, projectId });
  } catch (error) {
    console.error("completion_ai_project_load_failed", {
      projectId,
      userId: user.id,
      error: error instanceof Error ? error.name : "unknown",
    });
    return json(500, { error: "Projekt trenutačno nije moguće učitati." });
  }

  if (!project) {
    return json(404, { error: "Projekt nije pronađen." });
  }

  const task = project.tasks.find((candidate) => candidate.id === input.taskId);
  if (!task) {
    return json(404, { error: "Zadatak nije pronađen u ovom projektu." });
  }

  if (!task.capability) {
    return json(409, { error: "Ovaj zadatak nema odobrenu AI radnju." });
  }

  const capability = task.capability;
  if (!LIVE_CAPABILITIES.has(capability)) {
    return json(409, {
      error: "Ova AI radnja još nije uključena u live pilot.",
      reason: "CAPABILITY_NOT_LIVE",
    });
  }

  const provider = new UsageTrackedAIProvider(new AnthropicSonnetProvider(), {
    userId: user.id,
    projectId: project.id,
    taskId: task.id,
    capability,
    providerId: COMPLETION_AI_PROVIDER,
    modelId: COMPLETION_AI_MODEL,
  });

  try {
    const result = await executeContextualAIAction({
      project,
      taskId: task.id,
      capability,
      userInput: input.userInput,
      provider,
    });

    await recordAIActionAuditEvent(result.auditEvent);

    if (result.status === "DENIED") {
      return json(403, {
        status: "DENIED",
        reason: result.resolution.reason,
        decision: result.resolution.decision,
        obligations: result.resolution.obligations,
        notice: "AI radnja nije izvršena jer aktivna akademska pravila projekta to ne dopuštaju.",
      });
    }

    return json(200, {
      status: "COMPLETED",
      generatedByAI: true,
      aiLabel: "Katedra AI",
      text: result.output.text,
      provider: result.output.providerId,
      model: result.output.modelId,
      obligations: result.resolution.obligations,
      notice:
        "Ovo je generativna AI pomoć, ne odluka mentora, Fakulteta ili Lekte. Provjeri sadržaj prije uporabe.",
    });
  } catch (error) {
    if (error instanceof AIDataSafetyError) {
      return json(422, {
        error: "Prije slanja ukloni osobne podatke ili tajne iz unosa.",
        reason: "DATA_SAFETY_BLOCK",
        findings: error.findings.map((finding) => finding.label),
      });
    }

    if (error instanceof CompletionAIRateLimitError) {
      return json(429, {
        error: error.message,
        reason: error.kind === "TEN_MINUTES" ? "RATE_LIMIT_10M" : "RATE_LIMIT_24H",
      });
    }

    if (error instanceof AIActionContractError) {
      return json(409, { error: "AI radnja nije dostupna za trenutačno stanje zadatka." });
    }

    if (
      error instanceof AnthropicProviderError ||
      error instanceof CompletionAIUsageError ||
      error instanceof AIAuditPersistenceError
    ) {
      console.error("completion_ai_execution_failed", {
        projectId,
        taskId: task.id,
        capability,
        error: error.name,
      });
      return json(502, { error: "AI pomoć trenutačno nije dostupna." });
    }

    console.error("completion_ai_unexpected_failure", {
      projectId,
      taskId: task.id,
      capability,
      error: error instanceof Error ? error.name : "unknown",
    });
    return json(500, { error: "AI radnju trenutačno nije moguće izvršiti." });
  }
}
