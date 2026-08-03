import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AnthropicProviderError,
  AnthropicSonnetProvider,
  COMPLETION_AI_MODEL,
} from "@/lib/ai/anthropic-provider";

const request = {
  capability: "DISCLOSURE_HELP" as const,
  taskTitle: "Evidentiraj dosadašnju AI uporabu",
  userInput: "AI sam koristio za prijedlog ključnih riječi.",
  obligations: [],
  systemInstructions: ["Only organize actual AI-usage facts."],
};

describe("Anthropic Sonnet provider", () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
  });

  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    vi.unstubAllGlobals();
  });

  it("calls the current Messages API with the fixed Sonnet 5 model and returns usage", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          content: [{ type: "text", text: "Strukturirana evidencija." }],
          usage: { input_tokens: 120, output_tokens: 45 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await new AnthropicSonnetProvider().execute(request);

    expect(result).toEqual({
      text: "Strukturirana evidencija.",
      providerId: "anthropic",
      modelId: COMPLETION_AI_MODEL,
      usage: { inputTokens: 120, outputTokens: 45 },
    });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    expect(init?.headers).toMatchObject({
      "x-api-key": "test-anthropic-key",
      "anthropic-version": "2023-06-01",
    });

    const body = JSON.parse(String(init?.body));
    expect(body.model).toBe("claude-sonnet-5");
    expect(body.stream).not.toBe(true);
    expect(body.messages).toHaveLength(1);
    expect(body.messages[0].content).toContain(request.userInput);
  });

  it("fails closed when the API key is missing", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    vi.stubGlobal("fetch", vi.fn());

    await expect(new AnthropicSonnetProvider().execute(request)).rejects.toBeInstanceOf(
      AnthropicProviderError,
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects a malformed provider response without token usage", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ content: [{ type: "text", text: "Odgovor" }] }), {
          status: 200,
        }),
      ),
    );

    await expect(new AnthropicSonnetProvider().execute(request)).rejects.toThrow(/token usage/i);
  });
});
