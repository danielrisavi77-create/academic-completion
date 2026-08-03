import { NextResponse } from "next/server";
import {
  WorkflowMutationInputError,
  parseTaskStatusMutation,
} from "@/domain/workflow/parse-mutations";
import { isTrustedMutationRequest } from "@/lib/http/mutation-request";
import {
  ProjectWorkflowMutationError,
  setOwnedTaskStatus,
} from "@/lib/workflow/mutations";
import { requireAuthenticatedUser } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ projectId: string; taskId: string }> },
) {
  if (!isTrustedMutationRequest(request)) {
    return json(403, { error: "Nedopušten izvor zahtjeva." });
  }

  const user = await requireAuthenticatedUser();
  if (!user) {
    return json(401, { error: "Prijavi se za promjenu projekta." });
  }

  const { projectId, taskId } = await context.params;
  if (!UUID_PATTERN.test(projectId) || !UUID_PATTERN.test(taskId)) {
    return json(400, { error: "Neispravan projekt ili zadatak." });
  }

  let status;
  try {
    status = parseTaskStatusMutation(await request.json());
  } catch (error) {
    if (error instanceof WorkflowMutationInputError) {
      return json(400, { error: "Neispravna promjena statusa zadatka." });
    }
    return json(400, { error: "Neispravan JSON zahtjev." });
  }

  try {
    const changed = await setOwnedTaskStatus({
      userId: user.id,
      projectId,
      taskId,
      status,
    });

    return json(200, { status, changed });
  } catch (error) {
    if (error instanceof ProjectWorkflowMutationError) {
      return json(409, { error: "Status zadatka nije moguće promijeniti." });
    }
    console.error("completion_task_status_unexpected_failure", {
      projectId,
      taskId,
      userId: user.id,
      error: error instanceof Error ? error.name : "unknown",
    });
    return json(500, { error: "Promjena zadatka trenutačno nije dostupna." });
  }
}
