import { describe, expect, it } from "vitest";
import { parseScanInputPayload } from "@/domain/scan/parse-input";
import { createProjectCommandFromScan } from "@/domain/persistence/scan-project-draft";

const validPayload = {
  workType: "MASTERS_THESIS",
  profileId: "fpzg-politologija-diplomski",
  targetSubmissionDate: "2026-09-01",
  topicApproved: true,
  stage: "REVISION",
  draftStatus: "FULL",
  mentorVersionStatus: "OLDER_VERSION",
  mentorFeedbackStatus: "SOME",
  lektaCheckStatus: "NEVER_CHECKED",
  usedAI: true,
  mentorAIConsultation: "YES",
};

describe("Scan persistence boundary", () => {
  it("accepts only the canonical structured Scan payload", () => {
    const parsed = parseScanInputPayload(validPayload);
    expect(parsed.profileId).toBe("fpzg-politologija-diplomski");
    expect(parsed.stage).toBe("REVISION");
  });

  it("rejects unknown fields so free academic content cannot hitchhike into persistence", () => {
    expect(() =>
      parseScanInputPayload({
        ...validPayload,
        thesisText: "raw academic content that must not be persisted",
      }),
    ).toThrow(/Unexpected Scan field: thesisText/);

    expect(() =>
      parseScanInputPayload({
        ...validPayload,
        mentorComment: "full mentor email",
      }),
    ).toThrow(/Unexpected Scan field: mentorComment/);
  });

  it("rejects a profile/work-type mismatch", () => {
    expect(() =>
      parseScanInputPayload({
        ...validPayload,
        workType: "FINAL_THESIS",
      }),
    ).toThrow(/profileId does not match/);
  });

  it("maps a valid master's Scan to the shared academic_projects work_type", () => {
    const command = createProjectCommandFromScan(parseScanInputPayload(validPayload));
    expect(command.databaseWorkType).toBe("graduate");
    expect(command.aiMentorConsultation).toBe("USER_REPORTED_CONSULTED");
    expect(command.aiDisclosureState).toBe("USAGE_EVENTS_EXIST");
  });

  it("maps final thesis projects to the shared `final` work type", () => {
    const command = createProjectCommandFromScan(
      parseScanInputPayload({
        ...validPayload,
        workType: "FINAL_THESIS",
        profileId: "fpzg-politologija-zavrsni",
        usedAI: false,
        mentorAIConsultation: "UNKNOWN",
      }),
    );

    expect(command.databaseWorkType).toBe("final");
    expect(command.aiMentorConsultation).toBe("NOT_ASKED");
    expect(command.aiDisclosureState).toBe("NOT_STARTED");
  });
});
