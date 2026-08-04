import {
  buildProjectIndexItems,
  type ProjectIndexItem,
  type ProjectIndexProjectRow,
  type ProjectIndexStateRow,
} from "@/domain/project/project-index";
import { createAuthenticatedSupabaseDataClient } from "@/lib/supabase/server";

const SUPPORTED_PROFILES = [
  "fpzg-politologija-zavrsni",
  "fpzg-politologija-diplomski",
] as const;

export class ProjectIndexPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProjectIndexPersistenceError";
  }
}

export async function listOwnedCompletionProjects(
  ownerUserId: string,
): Promise<ProjectIndexItem[]> {
  const supabase = await createAuthenticatedSupabaseDataClient(ownerUserId);

  const { data: projectData, error: projectError } = await supabase
    .from("academic_projects")
    .select("id,work_type,profile_id,deadline,updated_at")
    .eq("user_id", ownerUserId)
    .in("work_type", ["final", "graduate"])
    .in("profile_id", [...SUPPORTED_PROFILES])
    .order("updated_at", { ascending: false });

  if (projectError) {
    throw new ProjectIndexPersistenceError("Could not load owned Academic Suite projects.");
  }

  const projects = (projectData ?? []) as unknown as ProjectIndexProjectRow[];
  if (projects.length === 0) return [];

  const projectIds = projects.map((project) => project.id);
  const { data: stateData, error: stateError } = await supabase
    .from("completion_project_state")
    .select("academic_project_id,stage,target_submission_date,mentor_waiting_for_response,updated_at")
    .in("academic_project_id", projectIds);

  if (stateError) {
    throw new ProjectIndexPersistenceError("Could not load Completion project summaries.");
  }

  return buildProjectIndexItems(
    projects,
    (stateData ?? []) as unknown as ProjectIndexStateRow[],
  );
}
