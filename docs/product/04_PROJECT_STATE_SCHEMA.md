# Project State Schema v0.1

## Principle

Project snapshot odgovara:

> Što je trenutno istina o projektu, prema kojem autoritetu, i što još nije riješeno?

Raw chat history nije state.

## Canonical project

```ts
type AcademicProject = {
  id: string;
  ownerUserId: string;
  identity: ProjectIdentity;
  timeline: ProjectTimeline;
  stage: ProjectStage;
  policy: PolicyState;
  mentor: MentorState;
  lekta: LektaState;
  tasks: TaskSummary;
  blockers: BlockerSummary;
  nextBestAction: NextBestAction | null;
  createdAt: string;
  updatedAt: string;
};
```

## Identity

```ts
type ProjectIdentity = {
  workType: "FINAL_THESIS" | "MASTERS_THESIS";
  institutionId: string;
  facultyId: string;
  programId?: string;
  profileId: string;
  topic?: string;
};
```

## Timeline

```ts
type ProjectTimeline = {
  targetSubmissionDate: string | null;
  targetDefenseDate?: string | null;
  daysToSubmission?: number;
  deadlineAuthority: AuthorityRef;
};
```

## Stages

```ts
type ProjectStage =
  | "TOPIC_ACTIVE"
  | "PLANNING"
  | "RESEARCH"
  | "DRAFTING"
  | "REVISION"
  | "MENTOR_REVIEW"
  | "FINAL_CHECK"
  | "SUBMISSION"
  | "DEFENSE"
  | "COMPLETED";
```

Stage nije postotak.

## Authority

```ts
type AuthorityType =
  | "USER_REPORTED"
  | "OFFICIAL_RULE"
  | "MENTOR_REPORTED"
  | "SYSTEM_ASSESSED"
  | "KATEDRA_ASSESSED"
  | "LEKTA_VERIFIED";

type AuthorityRef = {
  type: AuthorityType;
  sourceId?: string;
  sourceLabel?: string;
  observedAt: string;
};
```

## Tasks

```ts
type TaskStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_EXTERNAL"
  | "READY_TO_SEND"
  | "DONE"
  | "CANCELLED";

type ProjectTask = {
  id: string;
  projectId: string;
  taskType: string;
  title: string;
  status: TaskStatus;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  stage: ProjectStage;
  authority: AuthorityRef;
  capability?: AICapability;
  relatedRuleIds?: string[];
  relatedLektaFindingIds?: string[];
  createdAt: string;
  updatedAt: string;
};
```

Persistent task title mora biti sanitized summary, ne cijeli mentor email.

## Mentor state

```ts
type MentorState = {
  lastSentAt?: string | null;
  lastSeenVersionLabel?: string | null;
  openTaskCount: number;
  waitingForMentor: boolean;
  topicApproved?: EvidenceState;
  structureApproved?: EvidenceState;
  methodologyApproved?: EvidenceState;
  defenseApproved?: EvidenceState;
};

type EvidenceState = {
  value: true | false | null;
  authority: AuthorityRef;
};
```

MTK nema direct mentor verification; većina je user-reported.

## Lekta state

```ts
type LektaFindingStatus =
  | "OPEN"
  | "USER_CHANGED"
  | "RECHECK_REQUIRED"
  | "VERIFIED_FIXED";

type LektaState = {
  lastAnalysisId?: string | null;
  lastCheckedAt?: string | null;
  rulesetId?: string | null;
  rulesetVersion?: string | null;
  openCriticalCount: number;
  openWarningCount: number;
  findings: Array<{
    findingId: string;
    ruleId?: string;
    severity: "CRITICAL" | "WARNING" | "INFO";
    status: LektaFindingStatus;
    label: string;
  }>;
};
```

Samo Lekta može emitirati `VERIFIED_FIXED`.

## Blockers

```ts
type BlockerType =
  | "DEADLINE_RISK"
  | "MENTOR_NOT_SEEN_CURRENT_VERSION"
  | "MENTOR_FEEDBACK_OPEN"
  | "METHODOLOGY_UNRESOLVED"
  | "SOURCE_GAP"
  | "AI_POLICY_UNRESOLVED"
  | "AI_DISCLOSURE_REQUIRED"
  | "LEKTA_CHECK_MISSING"
  | "LEKTA_CRITICAL_FINDING_OPEN"
  | "SUBMISSION_ADMIN_REQUIREMENT_OPEN"
  | "WAITING_ON_MENTOR";

type ProjectBlocker = {
  id: string;
  projectId: string;
  type: BlockerType;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  title: string;
  reason: string;
  authority: AuthorityRef;
  relatedTaskId?: string;
  relatedRuleIds?: string[];
};
```

Blocker se računa kad god je moguće, umjesto da se sprema kao arbitrary prose.

## Next Best Action

```ts
type NextBestAction = {
  actionId: string;
  projectId: string;
  taskId?: string;
  title: string;
  reason: string;
  capability?: AICapability;
  route:
    | "IN_APP_TASK"
    | "AI_ACTION"
    | "KATEDRA_HANDOFF"
    | "LEKTA_HANDOFF"
    | "WAIT_FOR_EXTERNAL"
    | "OFFICIAL_PROCESS";
  authority: AuthorityRef;
};
```

Home pokazuje jednu primarnu sljedeću akciju.

## Typed events

Primjeri:
- `PROJECT_CREATED`
- `DEADLINE_SET`
- `STAGE_CHANGED`
- `TASK_CREATED`
- `TASK_STATUS_CHANGED`
- `MENTOR_SUBMISSION_REPORTED`
- `MENTOR_APPROVAL_REPORTED`
- `POLICY_LOADED`
- `AI_ACTION_AUTHORIZED`
- `AI_ACTION_DENIED`
- `LEKTA_CHECK_IMPORTED`
- `LEKTA_FINDING_USER_CHANGED`
- `LEKTA_RECHECK_IMPORTED`
- `SUBMISSION_REPORTED`
- `DEFENSE_REPORTED`

Payloadovi moraju poštivati Data Boundary.

## User-reported final outcomes

"Submitted" i "Defended" nisu certifikati aplikacije.

UI primjer:
> Obranjeno — prema tvojoj evidenciji

Ne:
> Completion App verificirao obranu.

## Guest Scan migration

Guest Scan koristi privremeni structured `ScanSnapshot`.

Pri stvaranju projekta:
- kopiraj samo allowlisted fields
- ponovno izračunaj blockere server-side
- ne migriraj arbitrary free text
