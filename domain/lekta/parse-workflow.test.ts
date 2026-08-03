import { describe, expect, it } from "vitest";
import {
  parseLektaFindingMutation,
  parseLektaHandoffRequest,
} from "@/domain/lekta/parse-workflow";

describe("Lekta workflow request parsing", () => {
  it("accepts only CHECK or RECHECK with no unknown fields", () => {
    expect(parseLektaHandoffRequest({ mode: "CHECK" })).toBe("CHECK");
    expect(parseLektaHandoffRequest({ mode: "RECHECK" })).toBe("RECHECK");
    expect(() => parseLektaHandoffRequest({ mode: "CHECK", projectId: "spoof" })).toThrow(/unknown/i);
  });

  it("accepts only stable finding identities for MARK_CHANGED", () => {
    expect(parseLektaFindingMutation({ action: "MARK_CHANGED", issueKey: "check:page-numbers" }))
      .toEqual({ action: "MARK_CHANGED", issueKey: "check:page-numbers" });
    expect(() => parseLektaFindingMutation({ action: "MARK_CHANGED", issueKey: "free text" })).toThrow(/identity/i);
    expect(() => parseLektaFindingMutation({ action: "VERIFY_FIXED", issueKey: "check:toc" })).toThrow(/action/i);
  });
});
