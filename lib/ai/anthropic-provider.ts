import type {
  AIProvider,
  AIProviderRequest,
  AIProviderResponse,
} from "@/domain/ai/provider";

const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_VERSION = "2023-06-01";
export const COMPLETION_AI_MODEL = "claude-sonnet-5";
export const COMPLETION_AI_PROVIDER = "anthropic";
const MAX_OUTPUT_TOKENS = 1200;
const REQUEST_TIMEOUT_MS = 45_000;

type AnthropicTextBlock = {
  type: "text";
  text: string;
};

type AnthropicMessageResponse = {
  content?: Array<AnthropicTextBlock | { type: string }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
};

export class AnthropicProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnthropicProviderError";
  }
}

function getAnthropicApiKey() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new AnthropicProviderError("ANTHROPIC_API_KEY is not configured.");
  }
  return key;
}

function extractText(response: AnthropicMessageResponse) {
  const text = (response.content ?? [])
    .filter((block): block is AnthropicTextBlock => block.type === "text" && "text" in block)
    .map((block) => block.text)
    .join("\n")
    .trim();

  if (!text) {
    throw new AnthropicProviderError("Anthropic returned no text content.");
  }

  return text;
}

export class AnthropicSonnetProvider implements AIProvider {
  async execute(request: AIProviderRequest): Promise<AIProviderResponse> {
    const response = await fetch(ANTHROPIC_MESSAGES_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": getAnthropicApiKey(),
        "anthropic-version": ANTHROPIC_API_VERSION,
      },
      body: JSON.stringify({
        model: COMPLETION_AI_MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
        system: [
          ...request.systemInstructions,
          "Respond in Croatian unless the user's supplied material clearly requires another language.",
          "Do not claim that your output is a mentor, faculty, or Lekta decision.",
        ].join("\n\n"),
        messages: [
          {
            role: "user",
            content: `Projektni zadatak: ${request.taskTitle}\n\nKorisnikov kontekst za ovaj zadatak:\n${request.userInput}`,
          },
        ],
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new AnthropicProviderError(`Anthropic request failed with HTTP ${response.status}.`);
    }

    const payload = (await response.json()) as AnthropicMessageResponse;
    const inputTokens = payload.usage?.input_tokens;
    const outputTokens = payload.usage?.output_tokens;

    if (!Number.isInteger(inputTokens) || !Number.isInteger(outputTokens)) {
      throw new AnthropicProviderError("Anthropic response did not include valid token usage.");
    }

    return {
      text: extractText(payload),
      providerId: COMPLETION_AI_PROVIDER,
      modelId: COMPLETION_AI_MODEL,
      usage: {
        inputTokens: inputTokens ?? 0,
        outputTokens: outputTokens ?? 0,
      },
    };
  }
}
