import { authorityRef } from "@/domain/authority/authority";
import { emptyLektaState } from "@/domain/lekta/types";
import { fpzgRuleset } from "@/data/rules/fpzg/ruleset";
import type { PolicyState } from "@/domain/policy/types";
import type { AcademicProject } from "@/domain/project/types";
import { toSanitizedTaskTitle } from "@/domain/tasks/task";

function addDays(referenceDate: Date, days: number) {
  const target = new Date(referenceDate);
  target.setUTCDate(target.getUTCDate() + days);
  return target.toISOString().slice(0, 10);
}

function fpzgPolicyState(): PolicyState {
  return {
    rulesetId: fpzgRuleset.id,
    rulesetVersion: fpzgRuleset.version,
    verifiedAt: fpzgRuleset.verifiedAt,
    capabilityDecisions: Object.fromEntries(
      fpzgRuleset.aiPolicyRules.map((rule) => [rule.capability, rule.decision]),
    ),
  };
}

export function buildFpzgDemoProject(referenceDate = new Date()): AcademicProject {
  const observedAt = referenceDate.toISOString();
  const userAuthority = authorityRef("USER_REPORTED", observedAt);
  const mentorAuthority = authorityRef("MENTOR_REPORTED", observedAt, {
    sourceLabel: "Demo sažetak mentorova zahtjeva",
  });
  const projectId = "demo-fpzg-masters";

  return {
    id: projectId,
    ownerUserId: "demo-user",
    identity: {
      workType: "MASTERS_THESIS",
      institutionId: "unizg",
      facultyId: "fpzg",
      profileId: "fpzg-politologija-diplomski",
      topic: "Politička participacija mladih u Hrvatskoj",
    },
    timeline: {
      targetSubmissionDate: addDays(referenceDate, 37),
      deadlineAuthority: userAuthority,
    },
    stage: "REVISION",
    policy: fpzgPolicyState(),
    aiGovernance: {
      mentorConsultation: "USER_REPORTED_CONSULTED",
      disclosureState: "USAGE_EVENTS_EXIST",
      dataSafetyAcknowledged: true,
    },
    mentor: {
      lastSentAt: addDays(referenceDate, -5),
      lastSeenVersionLabel: "v2",
      waitingForMentor: false,
    },
    lekta: emptyLektaState(),
    tasks: [
      {
        id: "demo-methodology-task",
        projectId,
        taskType: "METHODOLOGY",
        title: toSanitizedTaskTitle("Jasnije obrazloži odabir uzorka"),
        status: "IN_PROGRESS",
        priority: "HIGH",
        stage: "REVISION",
        authority: mentorAuthority,
        capability: "QUESTION_COACHING",
        createdAt: observedAt,
        updatedAt: observedAt,
      },
      {
        id: "demo-mentor-task",
        projectId,
        taskType: "MENTOR_FEEDBACK",
        title: toSanitizedTaskTitle("Poveži nalaze s istraživačkim pitanjem"),
        status: "OPEN",
        priority: "HIGH",
        stage: "REVISION",
        authority: mentorAuthority,
        capability: "CONTENT_REVIEW",
        createdAt: observedAt,
        updatedAt: observedAt,
      },
      {
        id: "demo-literature-task",
        projectId,
        taskType: "LITERATURE",
        title: toSanitizedTaskTitle("Provjeri dvije reference u raspravi"),
        status: "OPEN",
        priority: "MEDIUM",
        stage: "REVISION",
        authority: userAuthority,
        capability: "RESEARCH_DISCOVERY",
        createdAt: observedAt,
        updatedAt: observedAt,
      },
    ],
    blockers: [],
    nextBestAction: null,
    outcomes: {
      submittedAt: null,
      defendedAt: null,
    },
    createdAt: observedAt,
    updatedAt: observedAt,
  };
}
