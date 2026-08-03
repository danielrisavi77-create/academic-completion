export const lektaFindingStatuses = [
  "OPEN",
  "USER_CHANGED",
  "RECHECK_REQUIRED",
  "VERIFIED_FIXED",
] as const;

export type LektaFindingStatus = (typeof lektaFindingStatuses)[number];

export type LektaFinding = {
  findingId: string;
  checkId?: string;
  ruleId?: string;
  taskId?: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  status: LektaFindingStatus;
  label: string;
  /** False means it was absent from the latest check but was not eligible for VERIFIED_FIXED. */
  presentInLatest?: boolean;
  lastSeenAnalysisId?: string;
  verifiedFixedAnalysisId?: string;
};

export type LektaState = {
  lastAnalysisId: string | null;
  lastCheckedAt: string | null;
  rulesetId: string | null;
  rulesetVersion: string | null;
  score?: number | null;
  openCriticalCount: number;
  openWarningCount: number;
  findings: LektaFinding[];
};

export function emptyLektaState(): LektaState {
  return {
    lastAnalysisId: null,
    lastCheckedAt: null,
    rulesetId: null,
    rulesetVersion: null,
    score: null,
    openCriticalCount: 0,
    openWarningCount: 0,
    findings: [],
  };
}

function isCurrentOpenFinding(finding: LektaFinding) {
  return finding.presentInLatest !== false && finding.status !== "VERIFIED_FIXED";
}

export function summarizeLektaFindings(findings: LektaFinding[]) {
  return {
    openCriticalCount: findings.filter(
      (finding) => finding.severity === "CRITICAL" && isCurrentOpenFinding(finding),
    ).length,
    openWarningCount: findings.filter(
      (finding) => finding.severity === "WARNING" && isCurrentOpenFinding(finding),
    ).length,
  };
}
