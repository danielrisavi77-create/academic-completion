import type {
  AIProvider,
  AIProviderRequest,
  AIProviderResponse,
} from "@/domain/ai/provider";
import type { AICapability } from "@/domain/policy/types";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const TEN_MINUTE_REQUEST_LIMIT = 4;
const ROLLING_DAY_REQUEST_LIMIT = 12;

export type CompletionAIRateLimitKind = "TEN_MINUTES" | "ROLLING_DAY";

export class CompletionAIRateLimitError extends Error {
  readonly kind: CompletionAIRateLimitKind;

  constructor(kind: CompletionAIRateLimitKind) {
    super(
      kind === "TEN_MINUTES"
        ? "Previše AI zahtjeva u kratkom razdoblju."
        : "Dosegnut je dnevni pilot limit za AI radnje.",
    );
    this.name = "CompletionAIRateLimitError";
    this.kind = kind;
  }
}

export class CompletionAIUsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CompletionAIUsageError";
  }
}

function classifyReservationError(message: string) {
  if (message.includes("COMPLETION_AI_RATE_LIMIT_10M")) {
    return new CompletionAIRateLimitError("TEN_MINUTES");
  }
  if (message.includes("COMPLETION_AI_RATE_LIMIT_24H")) {
    return new CompletionAIRateLimitError("ROLLING_DAY");
  }
  return new CompletionAIUsageError("AI usage reservation failed.");
}

export class UsageTrackedAIProvider implements AIProvider {
  constructor(
    private readonly inner: AIProvider,
    private readonly context: {
      userId: string;
      projectId: string;
      taskId: string;
      capability: AICapability;
      providerId: string;
      modelId: string;
    },
  ) {}

  async execute(request: AIProviderRequest): Promise<AIProviderResponse> {
    if (request.capability !== this.context.capability) {
      throw new CompletionAIUsageError("Provider usage context capability mismatch.");
    }

    const admin = createAdminSupabaseClient();
    const { data: usageId, error: reservationError } = await admin.rpc(
      "completion_ai_reserve",
      {
        p_user: this.context.userId,
        p_project: this.context.projectId,
        p_task: this.context.taskId,
        p_capability: this.context.capability,
        p_provider: this.context.providerId,
        p_model: this.context.modelId,
        p_ten_minute_limit: TEN_MINUTE_REQUEST_LIMIT,
        p_daily_limit: ROLLING_DAY_REQUEST_LIMIT,
      },
    );

    if (reservationError || typeof usageId !== "string") {
      throw classifyReservationError(reservationError?.message ?? "missing reservation id");
    }

    const output = await this.inner.execute(request);

    if (
      output.providerId !== this.context.providerId ||
      output.modelId !== this.context.modelId
    ) {
      throw new CompletionAIUsageError("Provider response identity does not match reserved usage.");
    }

    const { data: finalized, error: finalizeError } = await admin.rpc(
      "completion_ai_finalize",
      {
        p_usage_id: usageId,
        p_user: this.context.userId,
        p_input_tokens: output.usage.inputTokens,
        p_output_tokens: output.usage.outputTokens,
      },
    );

    if (finalizeError || finalized !== true) {
      throw new CompletionAIUsageError("AI usage finalization failed.");
    }

    return output;
  }
}
