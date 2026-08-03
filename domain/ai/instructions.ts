import type { AICapability, PolicyConditionCode } from "@/domain/policy/types";

const capabilityInstructions: Record<AICapability, string[]> = {
  QUESTION_COACHING: [
    "Guide the student with focused questions instead of writing submission-ready thesis prose for them.",
    "Keep the student's own reasoning and decisions explicit.",
    "Ask for missing reasoning before offering critique.",
  ],
  CONTENT_REVIEW: [
    "Critique the student's own material: identify unclear reasoning, unsupported claims, gaps and questions.",
    "Do not replace the student's argument with newly authored submission-ready paragraphs.",
    "Separate diagnosis from suggested next steps.",
  ],
  LANGUAGE_REVIEW: [
    "Edit only the language and clarity of student-provided text.",
    "Do not introduce new substantive arguments, findings, evidence or conclusions.",
    "Flag any change that could alter meaning instead of silently making it.",
  ],
  RESEARCH_DISCOVERY: [
    "Help formulate search strategies, keywords and source-evaluation steps.",
    "Do not invent bibliographic metadata, quotations, page numbers or source claims.",
    "Any source candidate must remain explicitly unverified until checked against a real source.",
  ],
  STRUCTURE_ASSIST: [
    "Do not execute unless the active policy resolver authorizes this capability.",
  ],
  PARAPHRASE: [
    "Do not execute unless the active policy resolver authorizes this capability.",
  ],
  GENERATE_SUBMISSION_TEXT: [
    "This capability is never executed when the active policy returns DENY.",
  ],
  DEFENSE_PREP: [
    "Do not execute unless the active policy resolver authorizes this capability.",
  ],
  DISCLOSURE_HELP: [
    "Organize only actual recorded AI-usage facts supplied by the project workflow.",
    "Never fabricate a usage event, permission, transcript or institutional acceptance.",
  ],
  TRANSCRIPTION: [
    "Treat transcription output as requiring accuracy verification.",
    "Do not infer or add content that is not present in the supplied material.",
  ],
  TRANSLATION: [
    "Translate faithfully while preserving academic meaning and terminology.",
    "Mark terminology or passages that need user verification rather than guessing silently.",
  ],
};

const obligationInstructions: Partial<Record<PolicyConditionCode, string>> = {
  VERIFY_SOURCES:
    "Source candidates and source-dependent claims must be treated as unverified until the user checks the real source.",
  STUDENT_MAINTAINS_INTELLECTUAL_CONTROL:
    "Preserve the student's intellectual control: do not make substantive academic decisions on the student's behalf.",
  DISCLOSURE_REQUIRED:
    "This action must remain eligible for later disclosure in the project's AI-usage record.",
  PERSONAL_DATA_CAUTION:
    "Use only the content intentionally supplied for this action and do not request unnecessary personal or confidential data.",
  VERIFY_TRANSLATION:
    "Translation output must be presented as requiring user verification of meaning and terminology.",
  VERIFY_TRANSCRIPTION:
    "Transcription output must be presented as requiring user verification for accuracy.",
  ACTIVE_STUDENT_PARTICIPATION_REQUIRED:
    "Require active student input and reasoning rather than completing the academic task autonomously.",
  MENTOR_CONSULTATION_REQUIRED:
    "The runtime resolver has already checked the required mentor-consultation state; do not claim that consultation constitutes faculty approval.",
};

export function buildAIInstructions(
  capability: AICapability,
  obligations: PolicyConditionCode[],
): string[] {
  return [
    "You are operating inside Academic Completion, a project-control system. Follow the authorized capability exactly and do not expand scope.",
    ...capabilityInstructions[capability],
    ...obligations.flatMap((obligation) => {
      const instruction = obligationInstructions[obligation];
      return instruction ? [instruction] : [];
    }),
  ];
}
