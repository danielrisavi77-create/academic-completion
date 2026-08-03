import { fpzgRuleset } from "@/data/rules/fpzg/ruleset";
import type {
  ScanFinding,
  ScanFindingSeverity,
  ScanInput,
  ScanNextAction,
  ScanPolicySnapshotItem,
  ScanResult,
  ScanStage,
} from "@/domain/scan/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const LATE_STAGES = new Set<ScanStage>(["REVISION", "MENTOR_REVIEW", "FINAL_CHECK"]);

function parseDateOnly(value: string): Date {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("targetSubmissionDate must be a valid ISO date (YYYY-MM-DD). ");
  }
  return date;
}

export function daysUntil(targetSubmissionDate: string, referenceDate = new Date()): number {
  const target = parseDateOnly(targetSubmissionDate);
  const referenceUtc = Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate(),
  );
  return Math.ceil((target.getTime() - referenceUtc) / DAY_MS);
}

function finding(
  type: ScanFinding["type"],
  severity: ScanFindingSeverity,
  priority: number,
  title: string,
  explanation: string,
  relatedRuleIds?: string[],
): ScanFinding {
  return {
    id: `scan-${type.toLowerCase()}`,
    type,
    severity,
    priority,
    title,
    explanation,
    ...(relatedRuleIds?.length ? { relatedRuleIds } : {}),
  };
}

function getPolicyDecision(capability: ScanPolicySnapshotItem["capability"]) {
  const rule = fpzgRuleset.aiPolicyRules.find((candidate) => candidate.capability === capability);
  if (!rule) {
    throw new Error(`FPZG ruleset is missing ${capability}.`);
  }
  return rule;
}

function buildPolicySnapshot(): ScanResult["policySnapshot"] {
  const source = fpzgRuleset.sources.find(
    (candidate) => candidate.id === "fpzg-ai-guidelines-2026-05-21",
  );
  if (!source) {
    throw new Error("FPZG AI policy source is missing.");
  }

  const items: ScanPolicySnapshotItem[] = [
    {
      capability: "GENERATE_SUBMISSION_TEXT",
      label: "Generiranje dijelova rada za predaju",
      decision: getPolicyDecision("GENERATE_SUBMISSION_TEXT").decision,
    },
    {
      capability: "LANGUAGE_REVIEW",
      label: "Jezična provjera vlastitog teksta",
      decision: getPolicyDecision("LANGUAGE_REVIEW").decision,
    },
    {
      capability: "RESEARCH_DISCOVERY",
      label: "Pomoć pri pronalaženju literature uz provjeru",
      decision: getPolicyDecision("RESEARCH_DISCOVERY").decision,
    },
  ];

  return {
    sourceTitle: source.title,
    sourceUrl: source.url,
    verifiedAt: fpzgRuleset.verifiedAt,
    items,
  };
}

function buildFindings(input: ScanInput, daysToTarget: number): ScanFinding[] {
  const findings: ScanFinding[] = [];

  if (!input.topicApproved) {
    findings.push(
      finding(
        "TOPIC_NOT_APPROVED",
        "CRITICAL",
        100,
        "Tema još nije potvrđena",
        "Bez potvrđene teme nema sigurnog temelja za daljnji completion plan.",
      ),
    );
  }

  if (input.lektaCheckStatus === "FINDINGS_OPEN") {
    findings.push(
      finding(
        "LEKTA_FINDINGS_OPEN",
        input.stage === "FINAL_CHECK" ? "CRITICAL" : "HIGH",
        input.stage === "FINAL_CHECK" ? 96 : 76,
        "Lekta još ima otvorene nalaze",
        "Dokument ima nalaze koji zahtijevaju izmjenu i novu provjeru prije nego što ih smatramo riješenima.",
      ),
    );
  } else if (input.lektaCheckStatus === "NEVER_CHECKED" && input.stage === "FINAL_CHECK") {
    findings.push(
      finding(
        "LEKTA_CHECK_MISSING",
        "HIGH",
        88,
        "Finalna provjera dokumenta još nije napravljena",
        "U finalnoj fazi ima smisla provjeriti stvarni dokument prije predaje.",
      ),
    );
  }

  if (input.usedAI && input.mentorAIConsultation !== "YES") {
    findings.push(
      finding(
        "AI_POLICY_UNRESOLVED",
        "CRITICAL",
        94,
        "AI uporaba još nije usklađena s mentorom",
        "FPZG smjernice za završne i diplomske upućuju studente da se prije uporabe GenAI-ja konzultiraju s mentorom.",
        ["fpzg-ai-language-review", "fpzg-ai-research-discovery"],
      ),
    );
  }

  if (input.usedAI) {
    findings.push(
      finding(
        "AI_DISCLOSURE_REQUIRED",
        "MEDIUM",
        54,
        "Treba evidentirati korištenje AI-ja",
        "FPZG traži transparentno dokumentiranje korištenja generativne umjetne inteligencije u studentskom radu.",
        ["fpzg-ai-disclosure-help"],
      ),
    );
  }

  if (LATE_STAGES.has(input.stage) && input.mentorVersionStatus !== "CURRENT_VERSION") {
    const neverSeen = input.mentorVersionStatus === "NEVER";
    findings.push(
      finding(
        "MENTOR_NOT_SEEN_CURRENT_VERSION",
        "HIGH",
        neverSeen ? 91 : 86,
        neverSeen ? "Mentor još nije vidio tvoj aktualni rad" : "Mentor je vidio stariju verziju rada",
        neverSeen
          ? "U kasnoj fazi projekta to stvara rizik da veće korekcije dođu prekasno."
          : "Važne promjene nakon zadnje mentorove verzije još nisu prošle njegov pregled.",
      ),
    );
  }

  if (input.mentorFeedbackStatus !== "NONE") {
    findings.push(
      finding(
        "MENTOR_FEEDBACK_OPEN",
        input.mentorFeedbackStatus === "MANY" ? "HIGH" : "MEDIUM",
        input.mentorFeedbackStatus === "MANY" ? 80 : 60,
        input.mentorFeedbackStatus === "MANY"
          ? "Imaš više neriješenih mentorovih zahtjeva"
          : "Mentorovi zahtjevi još nisu svi riješeni",
        "Otvoreni mentorovi zahtjevi trebaju imati vlastiti task status prije sljedećeg slanja.",
      ),
    );
  }

  if (daysToTarget < 0) {
    findings.push(
      finding(
        "DEADLINE_RISK",
        "CRITICAL",
        99,
        "Tvoj ciljani datum je već prošao",
        "Potrebno je odmah postaviti novi realni cilj i provjeriti službene rokove koji su još dostupni.",
      ),
    );
  } else if (daysToTarget <= 7) {
    findings.push(
      finding(
        "DEADLINE_RISK",
        "CRITICAL",
        92,
        `Do cilja je još ${daysToTarget} dana`,
        "Vrijeme je vrlo ograničeno; prioritet moraju imati blockeri koji sprečavaju mentorovu ili formalnu predaju.",
      ),
    );
  } else if (daysToTarget <= 21) {
    findings.push(
      finding(
        "DEADLINE_RISK",
        "HIGH",
        73,
        `Do cilja je još ${daysToTarget} dana`,
        "Rok je dovoljno blizu da neriješeni mentorovi, policy ili dokumentni problemi mogu pomaknuti predaju.",
      ),
    );
  }

  return findings.sort((a, b) => b.priority - a.priority).slice(0, 3);
}

function buildWaitingItems(input: ScanInput) {
  if (input.stage === "MENTOR_REVIEW" && input.mentorVersionStatus === "CURRENT_VERSION") {
    return [{ id: "waiting-mentor-current-version", label: "Čeka se odgovor mentora na aktualnu verziju" }];
  }
  return [];
}

function nextActionFor(findings: ScanFinding[], input: ScanInput): ScanNextAction {
  const top = findings[0];
  if (!top) {
    return {
      title: input.stage === "FINAL_CHECK" ? "Napravi finalni pregled otvorenih stavki" : "Nastavi s trenutačnom fazom rada",
      reason: "Scan trenutačno nije pronašao critical ili high-priority blocker među podacima koje prati.",
    };
  }

  const actions: Record<ScanFinding["type"], string> = {
    TOPIC_NOT_APPROVED: "Potvrdi temu prije daljnjeg širenja rada",
    DEADLINE_RISK: "Odredi što mora biti riješeno prije najbližeg mogućeg roka",
    MENTOR_NOT_SEEN_CURRENT_VERSION: "Pripremi aktualnu verziju za mentora",
    MENTOR_FEEDBACK_OPEN: "Riješi najvažniji otvoreni mentorov zahtjev",
    AI_POLICY_UNRESOLVED: "Razjasni AI uporabu s mentorom prije daljnjih AI radnji",
    AI_DISCLOSURE_REQUIRED: "Evidentiraj dosadašnju AI uporabu",
    LEKTA_CHECK_MISSING: "Pokreni finalni Lekta Check",
    LEKTA_FINDINGS_OPEN: "Riješi najkritičniji Lekta nalaz i napravi re-check",
  };

  return {
    title: actions[top.type],
    reason: top.explanation,
    sourceFindingId: top.id,
  };
}

export function evaluateCompletionScan(
  input: ScanInput,
  referenceDate = new Date(),
): ScanResult {
  const daysToTarget = daysUntil(input.targetSubmissionDate, referenceDate);
  const findings = buildFindings(input, daysToTarget);

  return {
    workType: input.workType,
    profileId: input.profileId,
    stage: input.stage,
    daysToTarget,
    findings,
    waitingItems: buildWaitingItems(input),
    policySnapshot: buildPolicySnapshot(),
    nextAction: nextActionFor(findings, input),
  };
}
