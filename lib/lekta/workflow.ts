import type { AcademicProject } from "@/domain/project/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  buildLektaHandoffUrl,
  mintLektaHandoffCapability,
} from "@/lib/lekta/handoff";

export class LektaWorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LektaWorkflowError";
  }
}

async function authenticatedWorkflowClient(expectedUserId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user || data.user.is_anonymous || data.user.id !== expectedUserId) {
    throw new LektaWorkflowError("Authenticated Lekta workflow user mismatch.");
  }

  return supabase;
}

export async function prepareOwnedLektaHandoff({
  userId,
  project,
  recheck,
}: {
  userId: string;
  project: AcademicProject;
  recheck: boolean;
}) {
  if (project.ownerUserId !== userId) {
    throw new LektaWorkflowError("Lekta handoff project ownership mismatch.");
  }

  const capability = mintLektaHandoffCapability();
  const supabase = await authenticatedWorkflowClient(userId);
  const { data, error } = await supabase.rpc("completion_prepare_lekta_handoff_user", {
    p_project: project.id,
    p_token_hash: capability.tokenHash,
    p_expires_at: capability.expiresAt,
    p_mark_recheck: recheck,
  });

  if (error) {
    throw new LektaWorkflowError("Lekta handoff preparation failed.");
  }

  return {
    url: buildLektaHandoffUrl(project, capability.rawToken),
    expiresAt: capability.expiresAt,
    recheckCandidatesMarked: typeof data === "number" ? data : Number(data ?? 0),
  };
}

export async function markOwnedLektaFindingChanged({
  userId,
  projectId,
  issueKey,
}: {
  userId: string;
  projectId: string;
  issueKey: string;
}) {
  const supabase = await authenticatedWorkflowClient(userId);
  const { data, error } = await supabase.rpc("completion_mark_lekta_finding_changed_user", {
    p_project: projectId,
    p_issue_key: issueKey,
  });

  if (error) {
    throw new LektaWorkflowError("Lekta finding mutation failed.");
  }

  return data === true;
}
