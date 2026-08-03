import { describe, expect, it } from "vitest";
import { fpzgRuleset } from "@/data/rules/fpzg/ruleset";
import { buildFpzgDemoProject } from "@/data/demo/fpzg-project";
import { resolveCapability } from "@/domain/policy/resolver";
import type { AcademicProject } from "@/domain/project/types";

const now = new Date("2026-08-03T12:00:00Z");

function project(overrides: Partial<AcademicProject> = {}): AcademicProject {
  return {
    ...buildFpzgDemoProject(now),
    ...overrides,
  };
}

function withGovernance(
  current: AcademicProject,
  overrides: Partial<AcademicProject["aiGovernance"]>,
): AcademicProject {
  return {
    ...current,
    aiGovernance: {
      ...current.aiGovernance,
      ...overrides,
    },
  };
}

function finalThesisProject(): AcademicProject {
  const current = project();
  return {
    ...current,
    identity: {
      ...current.identity,
      workType: "FINAL_THESIS",
      profileId: "fpzg-politologija-zavrsni",
    },
  };
}

describe("FPZG runtime policy resolver", () => {
  it("denies submission-text generation for a master's thesis", () => {
    const result = resolveCapability({
      project: project(),
      capability: "GENERATE_SUBMISSION_TEXT",
    });

    expect(result.decision).toBe("DENY");
    expect(result.authorized).toBe(false);
    expect(result.reason).toBe("OFFICIAL_DENY");
    expect(result.sourceRuleIds).toContain("fpzg-ai-generate-submission-text");
  });

  it("does not let mentor permission override an official generation deny", () => {
    const current = withGovernance(project(), {
      mentorConsultation: "USER_REPORTED_PERMISSION_GIVEN",
    });

    const result = resolveCapability({
      project: current,
      capability: "GENERATE_SUBMISSION_TEXT",
    });

    expect(result.authorized).toBe(false);
    expect(result.reason).toBe("OFFICIAL_DENY");
  });

  it("also denies submission-text generation for a final thesis", () => {
    const result = resolveCapability({
      project: finalThesisProject(),
      capability: "GENERATE_SUBMISSION_TEXT",
    });

    expect(result.decision).toBe("DENY");
    expect(result.authorized).toBe(false);
    expect(result.reason).toBe("OFFICIAL_DENY");
  });

  it("blocks language review until mentor consultation is recorded", () => {
    const current = withGovernance(project(), {
      mentorConsultation: "NOT_ASKED",
    });

    const result = resolveCapability({
      project: current,
      capability: "LANGUAGE_REVIEW",
    });

    expect(result.decision).toBe("ALLOW_WITH_CONDITIONS");
    expect(result.authorized).toBe(false);
    expect(result.reason).toBe("MENTOR_CONSULTATION_REQUIRED");
    expect(result.unmetConditions).toContain("MENTOR_CONSULTATION_REQUIRED");
  });

  it("authorizes language review after consultation and keeps non-blocking obligations visible", () => {
    const current = withGovernance(project(), {
      mentorConsultation: "USER_REPORTED_CONSULTED",
    });

    const result = resolveCapability({
      project: current,
      capability: "LANGUAGE_REVIEW",
    });

    expect(result.authorized).toBe(true);
    expect(result.reason).toBe("AUTHORIZED");
    expect(result.obligations).toContain("STUDENT_MAINTAINS_INTELLECTUAL_CONTROL");
    expect(result.obligations).toContain("DISCLOSURE_REQUIRED");
    expect(result.unmetConditions).toEqual([]);
  });

  it("authorizes research discovery after consultation while preserving source-verification obligation", () => {
    const result = resolveCapability({
      project: withGovernance(project(), {
        mentorConsultation: "USER_REPORTED_CONSULTED",
      }),
      capability: "RESEARCH_DISCOVERY",
    });

    expect(result.authorized).toBe(true);
    expect(result.obligations).toContain("VERIFY_SOURCES");
    expect(result.obligations).toContain("DISCLOSURE_REQUIRED");
  });

  it("blocks transcription until the data-safety acknowledgement exists", () => {
    const unsafe = withGovernance(project(), {
      mentorConsultation: "USER_REPORTED_CONSULTED",
      dataSafetyAcknowledged: false,
    });

    const blocked = resolveCapability({
      project: unsafe,
      capability: "TRANSCRIPTION",
    });

    expect(blocked.authorized).toBe(false);
    expect(blocked.reason).toBe("DATA_SAFETY_ACKNOWLEDGEMENT_REQUIRED");
    expect(blocked.unmetConditions).toContain("PERSONAL_DATA_CAUTION");

    const acknowledged = withGovernance(unsafe, { dataSafetyAcknowledged: true });
    const allowed = resolveCapability({
      project: acknowledged,
      capability: "TRANSCRIPTION",
    });

    expect(allowed.authorized).toBe(true);
    expect(allowed.obligations).toContain("VERIFY_TRANSCRIPTION");
    expect(allowed.obligations).toContain("PERSONAL_DATA_CAUTION");
  });

  it("fails closed for an unsupported faculty/profile", () => {
    const current = project({
      identity: {
        ...project().identity,
        facultyId: "unknown-faculty",
        profileId: "unknown-profile",
      },
    });

    const result = resolveCapability({
      project: current,
      capability: "LANGUAGE_REVIEW",
    });

    expect(result.decision).toBe("UNKNOWN");
    expect(result.authorized).toBe(false);
    expect(result.reason).toBe("UNKNOWN_FACULTY_POLICY");
  });

  it("fails closed when the project ruleset version is stale", () => {
    const current = project({
      policy: {
        ...project().policy,
        rulesetVersion: "stale-version",
      },
    });

    const result = resolveCapability({
      project: current,
      capability: "LANGUAGE_REVIEW",
    });

    expect(result.authorized).toBe(false);
    expect(result.reason).toBe("RULESET_NOT_LOADED_OR_STALE");
    expect(result.rulesetVersion).toBe(fpzgRuleset.version);
  });

  it("fails closed when stored capability decision differs from the current source rule", () => {
    const current = project({
      policy: {
        ...project().policy,
        capabilityDecisions: {
          ...project().policy.capabilityDecisions,
          LANGUAGE_REVIEW: "ALLOW",
        },
      },
    });

    const result = resolveCapability({
      project: current,
      capability: "LANGUAGE_REVIEW",
    });

    expect(result.authorized).toBe(false);
    expect(result.reason).toBe("RULESET_NOT_LOADED_OR_STALE");
  });

  it("honors a mentor-reported restriction for a conditionally allowed capability", () => {
    const current = withGovernance(project(), {
      mentorConsultation: "USER_REPORTED_RESTRICTED",
    });

    const result = resolveCapability({
      project: current,
      capability: "LANGUAGE_REVIEW",
    });

    expect(result.authorized).toBe(false);
    expect(result.reason).toBe("MENTOR_RESTRICTED");
  });

  it("does not authorize structure assistance while the policy decision is unknown", () => {
    const result = resolveCapability({
      project: project(),
      capability: "STRUCTURE_ASSIST",
    });

    expect(result.decision).toBe("UNKNOWN");
    expect(result.authorized).toBe(false);
  });

  it("authorizes disclosure help without requiring mentor consultation", () => {
    const current = withGovernance(project(), {
      mentorConsultation: "NOT_ASKED",
    });

    const result = resolveCapability({
      project: current,
      capability: "DISCLOSURE_HELP",
    });

    expect(result.decision).toBe("ALLOW");
    expect(result.authorized).toBe(true);
    expect(result.reason).toBe("AUTHORIZED");
  });
});
