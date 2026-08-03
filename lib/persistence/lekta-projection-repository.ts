import type { AcademicProject } from "@/domain/project/types";
import {
  filterStaleLektaTasks,
  mapLektaProjection,
  type CompletionLektaFindingRow,
  type LektaCheckRow,
} from "@/domain/lekta/persistence";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { CompletionPersistenceError } from "@/lib/persistence/completion-repository";

const CHECK_SELECT = [
  "analysis_id",
  "project_id",
  "user_id",
  "ruleset_id",
  "ruleset_version",
  "score",
  "checked_at",
].join(",");

const FINDING_SELECT = [
  "academic_project_id",
  "issue_key",
  "check_id",
  "rule_id",
  "severity",
  "label",
  "lifecycle_status",
  "present_in_latest",
  "task_id",
  "last_seen_analysis_id",
  "verified_fixed_analysis_id",
].join(",");

export async function hydrateProjectWithLekta(project: AcademicProject): Promise<AcademicProject> {
  const admin = createAdminSupabaseClient();
  const [latestResult, findingsResult] = await Promise.all([
    admin
      .from("lekta_checks")
      .select(CHECK_SELECT)
      .eq("project_id", project.id)
      .eq("user_id", project.ownerUserId)
      .order("checked_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("completion_lekta_findings")
      .select(FINDING_SELECT)
      .eq("academic_project_id", project.id)
      .order("present_in_latest", { ascending: false })
      .order("updated_at", { ascending: false }),
  ]);

  if (latestResult.error) {
    throw new CompletionPersistenceError(`Could not load latest Lekta check: ${latestResult.error.message}`);
  }
  if (findingsResult.error) {
    throw new CompletionPersistenceError(`Could not load Lekta findings: ${findingsResult.error.message}`);
  }

  const lekta = mapLektaProjection({
    projectId: project.id,
    latestCheck: (latestResult.data ?? null) as unknown as LektaCheckRow | null,
    findingRows: (findingsResult.data ?? []) as unknown as CompletionLektaFindingRow[],
  });

  return {
    ...project,
    lekta,
    tasks: filterStaleLektaTasks(project.tasks, lekta),
  };
}
