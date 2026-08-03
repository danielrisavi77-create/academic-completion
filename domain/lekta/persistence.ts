import {
  emptyLektaState,
  summarizeLektaFindings,
  type LektaFinding,
  type LektaFindingStatus,
  type LektaState,
} from "@/domain/lekta/types";

export type LektaCheckRow = {
  analysis_id: string;
  project_id: string;
  user_id: string;
  ruleset_id: string;
  ruleset_version: string | null;
  score: number;
  checked_at: string;
};

export type CompletionLektaFindingRow = {
  academic_project_id: string;
  issue_key: string;
  check_id: string | null;
  rule_id: string | null;
  severity: "CRITICAL" | "WARNING" | "INFO";
  label: string;
  lifecycle_status: LektaFindingStatus;
  present_in_latest: boolean;
  task_id: string | null;
  last_seen_analysis_id: string | null;
  verified_fixed_analysis_id: string | null;
};

function mapFinding(row: CompletionLektaFindingRow): LektaFinding {
  return {
    findingId: row.issue_key,
    ...(row.check_id ? { checkId: row.check_id } : {}),
    ...(row.rule_id ? { ruleId: row.rule_id } : {}),
    ...(row.task_id ? { taskId: row.task_id } : {}),
    severity: row.severity,
    status: row.lifecycle_status,
    label: row.label,
    presentInLatest: row.present_in_latest,
    ...(row.last_seen_analysis_id ? { lastSeenAnalysisId: row.last_seen_analysis_id } : {}),
    ...(row.verified_fixed_analysis_id
      ? { verifiedFixedAnalysisId: row.verified_fixed_analysis_id }
      : {}),
  };
}

export function mapLektaProjection({
  projectId,
  latestCheck,
  findingRows,
}: {
  projectId: string;
  latestCheck: LektaCheckRow | null;
  findingRows: CompletionLektaFindingRow[];
}): LektaState {
  if (!latestCheck) return emptyLektaState();
  if (latestCheck.project_id !== projectId) {
    throw new Error("Latest Lekta check belongs to a different academic project.");
  }

  for (const row of findingRows) {
    if (row.academic_project_id !== projectId) {
      throw new Error("Lekta finding belongs to a different academic project.");
    }
  }

  const findings = findingRows.map(mapFinding);
  const counts = summarizeLektaFindings(findings);

  return {
    lastAnalysisId: latestCheck.analysis_id,
    lastCheckedAt: latestCheck.checked_at,
    rulesetId: latestCheck.ruleset_id,
    rulesetVersion: latestCheck.ruleset_version,
    score: latestCheck.score,
    ...counts,
    findings,
  };
}

export function filterStaleLektaTasks<T extends {
  taskType: string;
  status: string;
  relatedLektaFindingIds: string[];
}>(tasks: T[], lekta: LektaState): T[] {
  const currentFindingIds = new Set(
    lekta.findings
      .filter((finding) => finding.presentInLatest !== false && finding.status !== "VERIFIED_FIXED")
      .map((finding) => finding.findingId),
  );

  return tasks.filter((task) => {
    if (task.taskType !== "LEKTA_FINDING" || task.status === "DONE") return true;
    return task.relatedLektaFindingIds.some((findingId) => currentFindingIds.has(findingId));
  });
}
