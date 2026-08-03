import { describe, expect, it } from "vitest";
import { createProjectCommandFromScan } from "@/domain/persistence/scan-project-draft";
import type { ScanInput } from "@/domain/scan/types";

function scan(overrides: Partial<ScanInput> = {}): ScanInput {
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

describe("Scan -> persistent project command", () => {
  it("turns structured risks into typed initial tasks without storing academic content", () => {
    const command = createProjectCommandFromScan(
      scan({
        topicApproved: false,
        mentorVersionStatus: "OLDER_VERSION",
        mentorFeedbackStatus: "MANY",
        lektaCheckStatus: "FINDINGS_OPEN",
        usedAI: true,
        mentorAIConsultation: "NO",
      }),
    );

    expect(command.initialTasks.map((task) => task.taskType)).toEqual([
      "OFFICIAL_PROCESS",
      "MENTOR_REVIEW",
      "MENTOR_FEEDBACK",
      "AI_POLICY",
      "AI_DISCLOSURE",
      "LEKTA_FOLLOWUP",
    ]);
    expect(command.initialTasks.some((task) => task.authorityType === "LEKTA_VERIFIED")).toBe(false);
    expect(command.initialTasks.every((task) => task.title.length <= 160)).toBe(true);
  });

  it("marks mentor waiting only when the current version is already with the mentor", () => {
    const waiting = createProjectCommandFromScan(
      scan({ stage: "MENTOR_REVIEW", mentorVersionStatus: "CURRENT_VERSION" }),
    );
    const notWaiting = createProjectCommandFromScan(
      scan({ stage: "MENTOR_REVIEW", mentorVersionStatus: "OLDER_VERSION" }),
    );

    expect(waiting.mentorWaitingForResponse).toBe(true);
    expect(notWaiting.mentorWaitingForResponse).toBe(false);
    expect(notWaiting.initialTasks.some((task) => task.taskType === "MENTOR_REVIEW")).toBe(true);
  });

  it("keeps AI policy/disclosure authority distinct from user-reported mentor truth", () => {
    const command = createProjectCommandFromScan(
      scan({ usedAI: true, mentorAIConsultation: "UNKNOWN" }),
    );

    const policyTask = command.initialTasks.find((task) => task.taskType === "AI_POLICY");
    const disclosureTask = command.initialTasks.find((task) => task.taskType === "AI_DISCLOSURE");

    expect(policyTask?.authorityType).toBe("SYSTEM_ASSESSED");
    expect(policyTask?.relatedRuleIds.length).toBeGreaterThan(0);
    expect(disclosureTask?.capability).toBe("DISCLOSURE_HELP");
    expect(command.aiMentorConsultation).toBe("UNKNOWN");
  });

  it("rejects a profile that does not match the selected work type", () => {
    expect(() =>
      createProjectCommandFromScan(
        scan({ workType: "FINAL_THESIS", profileId: "fpzg-politologija-diplomski" }),
      ),
    ).toThrow(/profile does not match/);
  });
});
