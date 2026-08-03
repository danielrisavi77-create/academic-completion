import { NextResponse } from "next/server";
import {
  LektaWorkflowInputError,
  parseLektaHandoffRequest,
} from "@/domain/lekta/parse-workflow";
import { isTrustedMutationRequest } from "@/lib/http/mutation-request";
import { getOwnedProject } from "@/lib/persistence/completion-repository";
import {
  LektaWorkflowError,
  prepareOwnedLektaHandoff,
} from "@/lib/lekta/workflow";
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
  if (!user) return json(401, { error: "Prijavi se za otvaranje Lekte." });

  const { projectId } = await context.params;
  if (!UUID_PATTERN.test(projectId)) {
    return json(400, { error: "Neispravan projekt." });
  }

  let mode: "CHECK" | "RECHECK";
  try {
    mode = parseLektaHandoffRequest(await request.json());
  } catch (error) {
    if (error instanceof LektaWorkflowInputError) {
      return json(400, { error: "Neispravan Lekta handoff zahtjev." });
    }
    return json(400, { error: "Neispravan JSON zahtjev." });
  }

  const project = await getOwnedProject({ ownerUserId: user.id, projectId });
  if (!project) return json(404, { error: "Projekt nije pronađen." });

  try {
    const prepared = await prepareOwnedLektaHandoff({
      userId: user.id,
      project,
      recheck: mode === "RECHECK",
    });
    return json(200, {
      url: prepared.url,
      expiresAt: prepared.expiresAt,
      recheckCandidatesMarked: prepared.recheckCandidatesMarked,
    });
  } catch (error) {
    if (error instanceof LektaWorkflowError) {
      return json(409, { error: "Lekta handoff trenutačno nije moguće pripremiti." });
    }
    console.error("completion_lekta_handoff_unexpected_failure", {
      projectId,
      userId: user.id,
      error: error instanceof Error ? error.name : "unknown",
    });
    return json(500, { error: "Lekta handoff trenutačno nije dostupan." });
  }
}
