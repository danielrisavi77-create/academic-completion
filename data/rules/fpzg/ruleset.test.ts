import { describe, expect, it } from "vitest";
import { aiCapabilities } from "@/domain/policy/types";
import { fpzgRuleset } from "@/data/rules/fpzg/ruleset";

describe("FPZG ruleset provenance", () => {
  it("pins every referenced rule source to a known source record", () => {
    const sourceIds = new Set(fpzgRuleset.sources.map((source) => source.id));
    const references = [
      ...fpzgRuleset.processRules.flatMap((rule) => rule.sourceIds),
      ...fpzgRuleset.scheduleRules.flatMap((rule) => rule.sourceIds),
      ...fpzgRuleset.aiPolicyRules.flatMap((rule) => rule.sourceIds),
    ];

    for (const sourceId of references) {
      expect(sourceIds.has(sourceId), `Unknown source: ${sourceId}`).toBe(true);
    }
  });

  it("pins Lekta document authority to the audited source commit", () => {
    expect(fpzgRuleset.documentRulesReference.commit).toBe(
      "39c4db7a52bac7f1d67ed68a60173a1c8be50dac",
    );
    expect(fpzgRuleset.documentRulesReference.profiles.MASTERS_THESIS).toBe(
      "fpzg-politologija-diplomski",
    );
    expect(fpzgRuleset.documentRulesReference.profiles.FINAL_THESIS).toBe(
      "fpzg-politologija-zavrsni",
    );
  });
});

describe("FPZG AI policy", () => {
  it("explicitly denies submission-text generation for final and master's work", () => {
    const rule = fpzgRuleset.aiPolicyRules.find(
      (candidate) => candidate.capability === "GENERATE_SUBMISSION_TEXT",
    );

    expect(rule?.decision).toBe("DENY");
    expect(rule?.basis).toBe("DIRECT");
    expect(rule?.workTypes).toEqual(["FINAL_THESIS", "MASTERS_THESIS"]);
  });

  it("does not silently authorize uncertain structure or paraphrase capabilities", () => {
    for (const capability of ["STRUCTURE_ASSIST", "PARAPHRASE"] as const) {
      const rule = fpzgRuleset.aiPolicyRules.find(
        (candidate) => candidate.capability === capability,
      );
      expect(rule?.decision).toBe("UNKNOWN");
    }
  });

  it("has one explicit decision record for every canonical capability", () => {
    const covered = new Set(fpzgRuleset.aiPolicyRules.map((rule) => rule.capability));
    for (const capability of aiCapabilities) {
      expect(covered.has(capability), `Missing FPZG decision for ${capability}`).toBe(true);
    }
  });

  it("requires mentor consultation and disclosure on the core allowed thesis AI actions", () => {
    for (const capability of [
      "LANGUAGE_REVIEW",
      "RESEARCH_DISCOVERY",
      "QUESTION_COACHING",
      "CONTENT_REVIEW",
    ] as const) {
      const rule = fpzgRuleset.aiPolicyRules.find(
        (candidate) => candidate.capability === capability,
      );
      expect(rule?.conditions).toContain("MENTOR_CONSULTATION_REQUIRED");
      expect(rule?.conditions).toContain("DISCLOSURE_REQUIRED");
    }
  });
});

describe("FPZG 2025/2026 completion calendar", () => {
  it("contains the September master's cutoff and defense window", () => {
    const cutoff = fpzgRuleset.scheduleRules.find(
      (rule) => rule.id === "fpzg-masters-september-cutoff-2026",
    );
    const defense = fpzgRuleset.scheduleRules.find(
      (rule) => rule.id === "fpzg-masters-september-defense-window-2026",
    );

    expect(cutoff?.at).toBe("2026-09-01T13:00:00+02:00");
    expect(defense?.start).toBe("2026-09-07");
    expect(defense?.end).toBe("2026-09-18");
  });

  it("contains both remaining 2026 final-thesis defense windows", () => {
    const windows = fpzgRuleset.scheduleRules.filter(
      (rule) => rule.workType === "FINAL_THESIS" && rule.kind === "DEFENSE_WINDOW",
    );

    expect(windows.map((window) => [window.start, window.end])).toEqual([
      ["2026-08-24", "2026-09-04"],
      ["2026-09-07", "2026-09-17"],
    ]);
  });
});
