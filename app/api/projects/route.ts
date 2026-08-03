import { NextResponse } from "next/server";
import { createProjectCommandFromScan } from "@/domain/persistence/scan-project-draft";
import { parseScanInputPayload } from "@/domain/scan/parse-input";
import { createOwnedProjectFromScan } from "@/lib/persistence/completion-repository";
import { requireAuthenticatedUser } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const user = await requireAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  try {
    const scan = parseScanInputPayload(payload);
    const command = createProjectCommandFromScan(scan);
    const projectId = await createOwnedProjectFromScan({
      ownerUserId: user.id,
      command,
    });

    return NextResponse.json({ projectId }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create project.";
    const isValidationError =
      message.includes("Scan") ||
      message.includes("workType") ||
      message.includes("profile") ||
      message.includes("submission date") ||
      message.includes("stage") ||
      message.includes("Unexpected");

    return NextResponse.json(
      { error: isValidationError ? "INVALID_SCAN" : "PROJECT_CREATE_FAILED" },
      { status: isValidationError ? 400 : 500 },
    );
  }
}
