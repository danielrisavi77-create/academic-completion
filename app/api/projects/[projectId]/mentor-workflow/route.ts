import { NextResponse } from "next/server";
import {
  WorkflowMutationInputError,
  parseMentorWorkflowMutation,
} from "@/domain/workflow/parse-mutations";
import { isTrustedMutationRequest } from "@/lib/http/mutation-request";
import {
  ProjectWorkflowMutationError,
  reportOwnedMentorResponse,
  reportOwnedMentorSubmission,
} from "@/lib/workflow/mutations";
import { requireAuthenticatedUser } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  if (!isTrustedMutationRequest(request)) {
    return json(403, { error: "Nedopušten izvor zahtjeva." });
  }

  const user = await requireAuthenticatedUser();
  if (!user) {
    return json(401, { error: "Prijavi se za promjenu projekta." });
  }

  const { projectId } = await context.params;
  if (!UUID_PATTERN.test(projectId)) {
    return json(400, { error: "Neispravan projekt." });
  }

  let mutation;
  try {
    mutation = parseMentorWorkflowMutation(await request.json());
  } catch (error) {
    if (error instanceof WorkflowMutationInputError) {
      return json(400, { error: "Neispravna mentor workflow radnja." });
    }
    return json(400, { error: "Neispravan JSON zahtjev." });
  }

  try {
    if (mutation.action === "SUBMITTED") {
      await reportOwnedMentorSubmission({
        userId: user.id,
        projectId,
        versionLabel: mutation.versionLabel,
      });
      return json(200, { waitingForMentor: true });
    }

    await reportOwnedMentorResponse({ userId: user.id, projectId });
    return json(200, { waitingForMentor: false });
  } catch (error) {
    if (error instanceof ProjectWorkflowMutationError) {
      return json(409, { error: "Mentor workflow stanje nije moguće promijeniti." });
    }
    console.error("completion_mentor_workflow_unexpected_failure", {
      projectId,
      userId: user.id,
      action: mutation.action,
      error: error instanceof Error ? error.name : "unknown",
    });
    return json(500, { error: "Mentor workflow trenutačno nije dostupan." });
  }
}
