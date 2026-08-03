import type { UserTaskStatus } from "@/domain/workflow/parse-mutations";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export class ProjectWorkflowMutationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProjectWorkflowMutationError";
  }
}

export async function setOwnedTaskStatus({
  userId,
  projectId,
  taskId,
  status,
}: {
  userId: string;
  projectId: string;
  taskId: string;
  status: UserTaskStatus;
}) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.rpc("completion_set_task_status", {
    p_user: userId,
    p_project: projectId,
    p_task: taskId,
    p_status: status,
  });

  if (error) {
    throw new ProjectWorkflowMutationError("Task status mutation failed.");
  }

  return data === true;
}

export async function reportOwnedMentorSubmission({
  userId,
  projectId,
  versionLabel,
}: {
  userId: string;
  projectId: string;
  versionLabel: string | null;
}) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.rpc("completion_report_mentor_submission", {
    p_user: userId,
    p_project: projectId,
    p_version_label: versionLabel,
  });

  if (error || data !== true) {
    throw new ProjectWorkflowMutationError("Mentor submission mutation failed.");
  }
}

export async function reportOwnedMentorResponse({
  userId,
  projectId,
}: {
  userId: string;
  projectId: string;
}) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.rpc("completion_report_mentor_response", {
    p_user: userId,
    p_project: projectId,
  });

  if (error || data !== true) {
    throw new ProjectWorkflowMutationError("Mentor response mutation failed.");
  }
}
