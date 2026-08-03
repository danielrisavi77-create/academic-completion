import type { ProjectStage, WorkType } from "@/domain/project/types";
import { fromDatabaseWorkType } from "@/domain/persistence/types";
import { profileForWorkType } from "@/domain/scan/types";

export type ProjectIndexProjectRow = {
  id: string;
  work_type: string;
  profile_id: string | null;
  deadline: string | null;
  updated_at: string;
};

export type ProjectIndexStateRow = {
  academic_project_id: string;
  stage: ProjectStage;
  target_submission_date: string | null;
  mentor_waiting_for_response: boolean;
  updated_at: string;
};

export type ProjectIndexItem = {
  id: string;
  workType: WorkType;
  profileId: string;
  stage: ProjectStage;
  targetSubmissionDate: string | null;
  waitingForMentor: boolean;
  updatedAt: string;
};

export function buildProjectIndexItems(
  projects: ProjectIndexProjectRow[],
  states: ProjectIndexStateRow[],
): ProjectIndexItem[] {
  const stateByProject = new Map(states.map((state) => [state.academic_project_id, state]));
  const items: ProjectIndexItem[] = [];

  for (const project of projects) {
    let workType: WorkType;
    try {
      workType = fromDatabaseWorkType(project.work_type);
    } catch {
      continue;
    }

    const expectedProfile = profileForWorkType(workType);
    if (project.profile_id !== expectedProfile) continue;

    const state = stateByProject.get(project.id);
    if (!state) continue;

    items.push({
      id: project.id,
      workType,
      profileId: expectedProfile,
      stage: state.stage,
      targetSubmissionDate: state.target_submission_date ?? project.deadline,
      waitingForMentor: state.mentor_waiting_for_response,
      updatedAt:
        new Date(state.updated_at).getTime() > new Date(project.updated_at).getTime()
          ? state.updated_at
          : project.updated_at,
    });
  }

  return items.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}
