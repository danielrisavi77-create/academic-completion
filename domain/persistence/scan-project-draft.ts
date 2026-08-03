import { fpzgRuleset } from "@/data/rules/fpzg/ruleset";
import type { AuthorityType } from "@/domain/authority/authority";
import type {
  AICapability,
  AIDisclosureState,
  MentorAIConsultationState,
} from "@/domain/policy/types";
import type { ProjectStage, WorkType } from "@/domain/project/types";
import { toDatabaseWorkType, type DatabaseWorkType } from "@/domain/persistence/types";
import { profileForWorkType, type ScanInput } from "@/domain/scan/types";
import { toSanitizedTaskTitle, type SanitizedTaskTitle, type TaskPriority } from "@/domain/tasks/task";

export type InitialProjectTaskDraft = {
  taskType:
    | "OFFICIAL_PROCESS"
    | "MENTOR_REVIEW"
    | "MENTOR_FEEDBACK"
    | "AI_POLICY"
    | "AI_DISCLOSURE"
    | "LEKTA_FOLLOWUP";
  title: SanitizedTaskTitle;
  priority: TaskPriority;
  authorityType: AuthorityType;
  capability?: AICapability;
  relatedRuleIds: string[];
};

export type CreateProjectFromScanCommand = {
  workType: WorkType;
  databaseWorkType: DatabaseWorkType;
  profileId: "fpzg-politologija-zavrsni" | "fpzg-politologija-diplomski";
  stage: ProjectStage;
  targetSubmissionDate: string;
  topicApproved: boolean;
  mentorWaitingForResponse: boolean;
  initialTasks: InitialProjectTaskDraft[];
  aiPolicyRulesetId: string;
  aiPolicyRulesetVersion: string;
  aiPolicyVerifiedAt: string;
  aiMentorConsultation: MentorAIConsultationState;
  aiDisclosureState: AIDisclosureState;
  aiDataSafetyAcknowledged: false;
};

const allowedStages = new Set<ProjectStage>([
  "PLANNING",
  "RESEARCH",
  "DRAFTING",
  "REVISION",
  "MENTOR_REVIEW",
  "FINAL_CHECK",
]);

const lateStages = new Set<ProjectStage>(["REVISION", "MENTOR_REVIEW", "FINAL_CHECK"]);

function validateIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Target submission date must use YYYY-MM-DD format.");
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error("Target submission date is invalid.");
  }
}

function task(
  taskType: InitialProjectTaskDraft["taskType"],
  title: string,
  priority: TaskPriority,
  authorityType: AuthorityType,
  options: Pick<InitialProjectTaskDraft, "capability" | "relatedRuleIds"> = {
    relatedRuleIds: [],
  },
): InitialProjectTaskDraft {
  return {
    taskType,
    title: toSanitizedTaskTitle(title),
    priority,
    authorityType,
    relatedRuleIds: options.relatedRuleIds ?? [],
    ...(options.capability ? { capability: options.capability } : {}),
  };
}

function initialTasksFromScan(input: ScanInput): InitialProjectTaskDraft[] {
  const tasks: InitialProjectTaskDraft[] = [];

  if (!input.topicApproved) {
    tasks.push(
      task(
        "OFFICIAL_PROCESS",
        "Potvrdi temu prije daljnjeg širenja rada",
        "CRITICAL",
        "USER_REPORTED",
      ),
    );
  }

  if (lateStages.has(input.stage) && input.mentorVersionStatus !== "CURRENT_VERSION") {
    tasks.push(
      task(
        "MENTOR_REVIEW",
        input.mentorVersionStatus === "NEVER"
          ? "Pripremi aktualnu verziju za prvi pregled mentora"
          : "Pošalji mentoru aktualnu verziju rada",
        "HIGH",
        "USER_REPORTED",
      ),
    );
  }

  if (input.mentorFeedbackStatus !== "NONE") {
    tasks.push(
      task(
        "MENTOR_FEEDBACK",
        input.mentorFeedbackStatus === "MANY"
          ? "Razdvoji i riješi otvorene mentorove zahtjeve"
          : "Riješi otvorene mentorove zahtjeve prije sljedeće verzije",
        input.mentorFeedbackStatus === "MANY" ? "HIGH" : "MEDIUM",
        "USER_REPORTED",
      ),
    );
  }

  if (input.usedAI && input.mentorAIConsultation !== "YES") {
    tasks.push(
      task(
        "AI_POLICY",
        "Razjasni AI uporabu s mentorom prije daljnjih AI radnji",
        "HIGH",
        "SYSTEM_ASSESSED",
        {
          relatedRuleIds: ["fpzg-ai-language-review", "fpzg-ai-research-discovery"],
        },
      ),
    );
  }

  if (input.usedAI) {
    tasks.push(
      task(
        "AI_DISCLOSURE",
        "Evidentiraj dosadašnju AI uporabu",
        "MEDIUM",
        "SYSTEM_ASSESSED",
        {
          capability: "DISCLOSURE_HELP",
          relatedRuleIds: ["fpzg-ai-disclosure-help"],
        },
      ),
    );
  }

  if (input.lektaCheckStatus === "FINDINGS_OPEN") {
    tasks.push(
      task(
        "LEKTA_FOLLOWUP",
        "Riješi prijavljene Lekta nalaze i napravi re-check",
        input.stage === "FINAL_CHECK" ? "CRITICAL" : "HIGH",
        "USER_REPORTED",
      ),
    );
  }

  return tasks;
}

export function createProjectCommandFromScan(input: ScanInput): CreateProjectFromScanCommand {
  const canonicalProfile = profileForWorkType(input.workType);
  if (input.profileId !== canonicalProfile) {
    throw new Error("Scan profile does not match the selected work type.");
  }

  if (!allowedStages.has(input.stage)) {
    throw new Error("Scan stage is not supported for project creation.");
  }

  validateIsoDate(input.targetSubmissionDate);

  const aiMentorConsultation: MentorAIConsultationState = input.usedAI
    ? input.mentorAIConsultation === "YES"
      ? "USER_REPORTED_CONSULTED"
      : input.mentorAIConsultation === "NO"
        ? "NOT_ASKED"
        : "UNKNOWN"
    : "NOT_ASKED";

  const aiDisclosureState: AIDisclosureState = input.usedAI
    ? "USAGE_EVENTS_EXIST"
    : "NOT_STARTED";

  const mentorWaitingForResponse =
    input.stage === "MENTOR_REVIEW" && input.mentorVersionStatus === "CURRENT_VERSION";

  return {
    workType: input.workType,
    databaseWorkType: toDatabaseWorkType(input.workType),
    profileId: canonicalProfile,
    stage: input.stage,
    targetSubmissionDate: input.targetSubmissionDate,
    topicApproved: input.topicApproved,
    mentorWaitingForResponse,
    initialTasks: initialTasksFromScan(input),
    aiPolicyRulesetId: fpzgRuleset.id,
    aiPolicyRulesetVersion: fpzgRuleset.version,
    aiPolicyVerifiedAt: fpzgRuleset.verifiedAt,
    aiMentorConsultation,
    aiDisclosureState,
    aiDataSafetyAcknowledged: false,
  };
}
