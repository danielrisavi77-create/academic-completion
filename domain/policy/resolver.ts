import { fpzgRuleset } from "@/data/rules/fpzg/ruleset";
import type {
  AICapability,
  PolicyConditionCode,
  PolicyDecision,
} from "@/domain/policy/types";
import type { AcademicProject } from "@/domain/project/types";
import type { AIPolicyRuleRecord, FacultyCompletionRuleset } from "@/domain/rules/types";

export type PolicyResolutionReason =
  | "AUTHORIZED"
  | "OFFICIAL_DENY"
  | "UNKNOWN_FACULTY_POLICY"
  | "RULESET_NOT_LOADED_OR_STALE"
  | "CAPABILITY_NOT_COVERED"
  | "MENTOR_CONSULTATION_REQUIRED"
  | "MENTOR_RESTRICTED"
  | "DATA_SAFETY_ACKNOWLEDGEMENT_REQUIRED";

export type PolicyResolution = {
  capability: AICapability;
  decision: PolicyDecision;
  authorized: boolean;
  reason: PolicyResolutionReason;
  conditions: PolicyConditionCode[];
  unmetConditions: PolicyConditionCode[];
  obligations: PolicyConditionCode[];
  sourceRuleIds: string[];
  basis: AIPolicyRuleRecord["basis"] | null;
  rulesetId: string | null;
  rulesetVersion: string | null;
};

function rulesetForProject(project: AcademicProject): FacultyCompletionRuleset | null {
  const supportedProfiles = new Set([
    "fpzg-politologija-zavrsni",
    "fpzg-politologija-diplomski",
  ]);

  if (
    project.identity.institutionId === "unizg" &&
    project.identity.facultyId === "fpzg" &&
    supportedProfiles.has(project.identity.profileId)
  ) {
    return fpzgRuleset;
  }

  return null;
}

function unknownResolution(
  capability: AICapability,
  reason: PolicyResolutionReason,
  ruleset: FacultyCompletionRuleset | null,
): PolicyResolution {
  return {
    capability,
    decision: "UNKNOWN",
    authorized: false,
    reason,
    conditions: [],
    unmetConditions: [],
    obligations: [],
    sourceRuleIds: [],
    basis: null,
    rulesetId: ruleset?.id ?? null,
    rulesetVersion: ruleset?.version ?? null,
  };
}

function isMentorConsultationSatisfied(project: AcademicProject) {
  return (
    project.aiGovernance.mentorConsultation === "USER_REPORTED_CONSULTED" ||
    project.aiGovernance.mentorConsultation === "USER_REPORTED_PERMISSION_GIVEN"
  );
}

function evaluateBlockingConditions(
  project: AcademicProject,
  conditions: PolicyConditionCode[],
): {
  unmetConditions: PolicyConditionCode[];
  reason: PolicyResolutionReason | null;
} {
  if (
    conditions.includes("MENTOR_CONSULTATION_REQUIRED") &&
    project.aiGovernance.mentorConsultation === "USER_REPORTED_RESTRICTED"
  ) {
    return {
      unmetConditions: ["MENTOR_CONSULTATION_REQUIRED"],
      reason: "MENTOR_RESTRICTED",
    };
  }

  const unmetConditions: PolicyConditionCode[] = [];

  if (
    conditions.includes("MENTOR_CONSULTATION_REQUIRED") &&
    !isMentorConsultationSatisfied(project)
  ) {
    unmetConditions.push("MENTOR_CONSULTATION_REQUIRED");
  }

  if (
    conditions.includes("PERSONAL_DATA_CAUTION") &&
    !project.aiGovernance.dataSafetyAcknowledged
  ) {
    unmetConditions.push("PERSONAL_DATA_CAUTION");
  }

  if (unmetConditions.includes("MENTOR_CONSULTATION_REQUIRED")) {
    return { unmetConditions, reason: "MENTOR_CONSULTATION_REQUIRED" };
  }

  if (unmetConditions.includes("PERSONAL_DATA_CAUTION")) {
    return { unmetConditions, reason: "DATA_SAFETY_ACKNOWLEDGEMENT_REQUIRED" };
  }

  return { unmetConditions, reason: null };
}

export function resolveCapability({
  project,
  capability,
}: {
  project: AcademicProject;
  capability: AICapability;
}): PolicyResolution {
  const ruleset = rulesetForProject(project);
  if (!ruleset) {
    return unknownResolution(capability, "UNKNOWN_FACULTY_POLICY", null);
  }

  if (
    project.policy.rulesetId !== ruleset.id ||
    project.policy.rulesetVersion !== ruleset.version
  ) {
    return unknownResolution(capability, "RULESET_NOT_LOADED_OR_STALE", ruleset);
  }

  const rule = ruleset.aiPolicyRules.find(
    (candidate) =>
      candidate.capability === capability &&
      candidate.workTypes.includes(project.identity.workType),
  );

  if (!rule) {
    return unknownResolution(capability, "CAPABILITY_NOT_COVERED", ruleset);
  }

  const stateDecision = project.policy.capabilityDecisions[capability];
  if (stateDecision !== rule.decision) {
    return unknownResolution(capability, "RULESET_NOT_LOADED_OR_STALE", ruleset);
  }

  if (rule.decision === "DENY") {
    return {
      capability,
      decision: rule.decision,
      authorized: false,
      reason: "OFFICIAL_DENY",
      conditions: rule.conditions,
      unmetConditions: [],
      obligations: [],
      sourceRuleIds: [rule.id],
      basis: rule.basis,
      rulesetId: ruleset.id,
      rulesetVersion: ruleset.version,
    };
  }

  if (rule.decision === "UNKNOWN") {
    return {
      capability,
      decision: rule.decision,
      authorized: false,
      reason: "CAPABILITY_NOT_COVERED",
      conditions: rule.conditions,
      unmetConditions: [],
      obligations: [],
      sourceRuleIds: [rule.id],
      basis: rule.basis,
      rulesetId: ruleset.id,
      rulesetVersion: ruleset.version,
    };
  }

  const blocking = evaluateBlockingConditions(project, rule.conditions);
  if (blocking.reason) {
    return {
      capability,
      decision: rule.decision,
      authorized: false,
      reason: blocking.reason,
      conditions: rule.conditions,
      unmetConditions: blocking.unmetConditions,
      obligations: rule.conditions.filter(
        (condition) => !blocking.unmetConditions.includes(condition),
      ),
      sourceRuleIds: [rule.id],
      basis: rule.basis,
      rulesetId: ruleset.id,
      rulesetVersion: ruleset.version,
    };
  }

  return {
    capability,
    decision: rule.decision,
    authorized: true,
    reason: "AUTHORIZED",
    conditions: rule.conditions,
    unmetConditions: [],
    obligations: rule.conditions,
    sourceRuleIds: [rule.id],
    basis: rule.basis,
    rulesetId: ruleset.id,
    rulesetVersion: ruleset.version,
  };
}
