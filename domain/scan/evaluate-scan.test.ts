import { describe, expect, it } from "vitest";
import { evaluateCompletionScan, daysUntil } from "@/domain/scan/evaluate-scan";
import { profileForWorkType, type ScanInput } from "@/domain/scan/types";

const referenceDate = new Date("2026-08-03T12:00:00Z");

function baseInput(overrides: Partial<ScanInput> = {}): ScanInput {
  return {
    workType: "MASTERS_THESIS",
    profileId: "fpzg-politologija-diplomski",
    targetSubmissionDate: "2026-09-01",
    topicApproved: true,
    stage: "REVISION",
    draftStatus: "FULL",
    mentorVersionStatus: "CURRENT_VERSION",
    mentorFeedbackStatus: "NONE",
    lektaCheckStatus: "CHECKED_CLEAR",
    usedAI: false,
    mentorAIConsultation: "UNKNOWN",
    ...overrides,
  };
}

describe("Completion Scan", () => {
  it("returns at most three findings even when many risks are present", () => {
    const result = evaluateCompletionScan(
      baseInput({
        targetSubmissionDate: "2026-08-08",
        topicApproved: false,
        stage: "FINAL_CHECK",
        mentorVersionStatus: "NEVER",
        mentorFeedbackStatus: "MANY",
        lektaCheckStatus: "FINDINGS_OPEN",
        usedAI: true,
        mentorAIConsultation: "NO",
      }),
      referenceDate,
    );

    expect(result.findings).toHaveLength(3);
    expect(result.findings.every((finding, index, all) => index === 0 || all[index - 1]!.priority >= finding.priority)).toBe(true);
  });

  it("does not produce a synthetic readiness percentage", () => {
    const result = evaluateCompletionScan(baseInput(), referenceDate);
    expect(result).not.toHaveProperty("readinessPercent");
    expect(result).not.toHaveProperty("score");
  });

  it("surfaces unresolved FPZG mentor consultation when AI was used", () => {
    const result = evaluateCompletionScan(
      baseInput({ usedAI: true, mentorAIConsultation: "NO" }),
      referenceDate,
    );

    expect(result.findings.some((finding) => finding.type === "AI_POLICY_UNRESOLVED")).toBe(true);
    expect(result.nextAction.title).toMatch(/AI uporabu s mentorom/i);
  });

  it("prioritizes open Lekta findings in the final-check stage", () => {
    const result = evaluateCompletionScan(
      baseInput({
        stage: "FINAL_CHECK",
        lektaCheckStatus: "FINDINGS_OPEN",
        targetSubmissionDate: "2026-09-01",
      }),
      referenceDate,
    );

    expect(result.findings[0]?.type).toBe("LEKTA_FINDINGS_OPEN");
    expect(result.findings[0]?.severity).toBe("CRITICAL");
  });

  it("flags an outdated mentor version but not the current version", () => {
    const outdated = evaluateCompletionScan(
      baseInput({ mentorVersionStatus: "OLDER_VERSION" }),
      referenceDate,
    );
    const current = evaluateCompletionScan(
      baseInput({ mentorVersionStatus: "CURRENT_VERSION" }),
      referenceDate,
    );

    expect(outdated.findings.some((finding) => finding.type === "MENTOR_NOT_SEEN_CURRENT_VERSION")).toBe(true);
    expect(current.findings.some((finding) => finding.type === "MENTOR_NOT_SEEN_CURRENT_VERSION")).toBe(false);
  });

  it("computes calendar-day distance from the reference date", () => {
    expect(daysUntil("2026-09-01", referenceDate)).toBe(29);
    expect(daysUntil("2026-08-03", referenceDate)).toBe(0);
  });

  it("maps final and master's projects to the canonical FPZG profiles", () => {
    expect(profileForWorkType("FINAL_THESIS")).toBe("fpzg-politologija-zavrsni");
    expect(profileForWorkType("MASTERS_THESIS")).toBe("fpzg-politologija-diplomski");
  });

  it("shows the FPZG policy snapshot with submission-text generation denied", () => {
    const result = evaluateCompletionScan(baseInput(), referenceDate);
    const generation = result.policySnapshot.items.find(
      (item) => item.capability === "GENERATE_SUBMISSION_TEXT",
    );

    expect(generation?.decision).toBe("DENY");
    expect(result.policySnapshot.sourceUrl).toContain("fpzg.unizg.hr");
  });

  it("shows a waiting item when the current version is already with the mentor", () => {
    const result = evaluateCompletionScan(
      baseInput({ stage: "MENTOR_REVIEW", mentorVersionStatus: "CURRENT_VERSION" }),
      referenceDate,
    );

    expect(result.waitingItems).toEqual([
      { id: "waiting-mentor-current-version", label: "Čeka se odgovor mentora na aktualnu verziju" },
    ]);
  });
});
