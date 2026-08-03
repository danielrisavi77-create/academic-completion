import { describe, expect, it } from "vitest";
import {
  LiveAIActionInputError,
  parseLiveAIActionInput,
} from "@/domain/ai/parse-live-action";

const taskId = "4fd6d5fa-b91f-4f38-90d1-63a268ee6f60";

describe("live AI action parser", () => {
  it("accepts only taskId and trimmed user input", () => {
    expect(parseLiveAIActionInput({ taskId, userInput: "  stvarna AI uporaba  " })).toEqual({
      taskId,
      userInput: "stvarna AI uporaba",
    });
  });

  it("rejects browser-supplied capability or model overrides", () => {
    expect(() =>
      parseLiveAIActionInput({
        taskId,
        userInput: "kontekst",
        capability: "GENERATE_SUBMISSION_TEXT",
      }),
    ).toThrow(LiveAIActionInputError);

    expect(() =>
      parseLiveAIActionInput({ taskId, userInput: "kontekst", model: "other-model" }),
    ).toThrow(LiveAIActionInputError);
  });

  it("rejects invalid task ids and oversized text", () => {
    expect(() => parseLiveAIActionInput({ taskId: "not-a-uuid", userInput: "x" })).toThrow(
      /taskId/,
    );
    expect(() => parseLiveAIActionInput({ taskId, userInput: "x".repeat(12_001) })).toThrow(
      /12000/,
    );
  });
});
