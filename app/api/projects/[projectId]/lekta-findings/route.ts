import { NextResponse } from "next/server";
import {
  LektaWorkflowInputError,
  parseLektaFindingMutation,
} from "@/domain/lekta/parse-workflow";
import { isTrustedMutationRequest } from "@/lib/http/mutation-request";
import { assertOwnedProject } from "@/lib/persistence/completion-repository";
import {
  LektaWorkflowError,
  markOwnedLektaFindingChanged,
} from "@/lib/lekta/workflow";
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
  context: { params: Promise<{ projectId: string }> },
) {
  if (!isTrustedMutationRequest(request)) {
    return json(403, { error: "Nedopušten izvor zahtjeva." });
  }

  const user = await requireAuthenticatedUser();
  if (!user) return json(401, { error: "Prijavi se za promjenu Lekta nalaza." });

  const { projectId } = await context.params;
  if (!UUID_PATTERN.test(projectId)) {
    return json(400, { error: "Neispravan projekt." });
  }

  let mutation: ReturnType<typeof parseLektaFindingMutation>;
  try {
    mutation = parseLektaFindingMutation(await request.json());
  } catch (error) {
    if (error instanceof LektaWorkflowInputError) {
      return json(400, { error: "Neispravna promjena Lekta nalaza." });
    }
    return json(400, { error: "Neispravan JSON zahtjev." });
  }

  if (!(await assertOwnedProject({ ownerUserId: user.id, projectId }))) {
    return json(404, { error: "Projekt nije pronađen." });
  }

  try {
    const changed = await markOwnedLektaFindingChanged({
      userId: user.id,
      projectId,
      issueKey: mutation.issueKey,
    });
    return json(200, { status: "USER_CHANGED", changed });
  } catch (error) {
    if (error instanceof LektaWorkflowError) {
      return json(409, { error: "Ovaj Lekta nalaz nije moguće označiti promijenjenim." });
    }
    console.error("completion_lekta_finding_unexpected_failure", {
      projectId,
      userId: user.id,
      error: error instanceof Error ? error.name : "unknown",
    });
    return json(500, { error: "Promjena Lekta nalaza trenutačno nije dostupna." });
  }
}
