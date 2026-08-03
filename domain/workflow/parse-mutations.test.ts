import { describe, expect, it } from "vitest";
import {
  WorkflowMutationInputError,
  parseMentorWorkflowMutation,
  parseTaskStatusMutation,
} from "@/domain/workflow/parse-mutations";

describe("task workflow parser", () => {
  it("accepts only user-controlled task states", () => {
    expect(parseTaskStatusMutation({ status: "OPEN" })).toBe("OPEN");
    expect(parseTaskStatusMutation({ status: "IN_PROGRESS" })).toBe("IN_PROGRESS");
    expect(parseTaskStatusMutation({ status: "DONE" })).toBe("DONE");
  });

  it("rejects authority/event injection and unsupported states", () => {
    expect(() =>
      parseTaskStatusMutation({ status: "DONE", authority: "LEKTA_VERIFIED" }),
    ).toThrow(WorkflowMutationInputError);
    expect(() => parseTaskStatusMutation({ status: "CANCELLED" })).toThrow(
      WorkflowMutationInputError,
    );
  });
});

describe("mentor workflow parser", () => {
  it("accepts a sanitized short version label", () => {
    expect(parseMentorWorkflowMutation({ action: "SUBMITTED", versionLabel: "  v4  " })).toEqual({
      action: "SUBMITTED",
      versionLabel: "v4",
    });
  });

  it("allows submission without a version label", () => {
    expect(parseMentorWorkflowMutation({ action: "SUBMITTED" })).toEqual({
      action: "SUBMITTED",
      versionLabel: null,
    });
  });

  it("keeps mentor response content-free", () => {
    expect(parseMentorWorkflowMutation({ action: "RESPONDED" })).toEqual({ action: "RESPONDED" });
    expect(() =>
      parseMentorWorkflowMutation({ action: "RESPONDED", versionLabel: "mentorov tekst" }),
    ).toThrow(WorkflowMutationInputError);
  });

  it("rejects multiline or oversized labels", () => {
    expect(() =>
      parseMentorWorkflowMutation({ action: "SUBMITTED", versionLabel: "v4\nkomentar" }),
    ).toThrow(WorkflowMutationInputError);
    expect(() =>
      parseMentorWorkflowMutation({ action: "SUBMITTED", versionLabel: "x".repeat(81) }),
    ).toThrow(WorkflowMutationInputError);
  });
});
