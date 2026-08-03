export const lektaFindingStatuses = [
  "OPEN",
  "USER_CHANGED",
  "RECHECK_REQUIRED",
  "VERIFIED_FIXED",
] as const;

export type LektaFindingStatus = (typeof lektaFindingStatuses)[number];

export type LektaFinding = {
  findingId: string;
  ruleId?: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  status: LektaFindingStatus;
  label: string;
};

export type LektaState = {
  lastAnalysisId: string | null;
  lastCheckedAt: string | null;
  rulesetId: string | null;
  rulesetVersion: string | null;
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
    openCriticalCount: 0,
    openWarningCount: 0,
    findings: [],
  };
}

export function summarizeLektaFindings(findings: LektaFinding[]) {
  return {
    openCriticalCount: findings.filter(
      (finding) => finding.severity === "CRITICAL" && finding.status !== "VERIFIED_FIXED",
    ).length,
    openWarningCount: findings.filter(
      (finding) => finding.severity === "WARNING" && finding.status !== "VERIFIED_FIXED",
    ).length,
  };
}
