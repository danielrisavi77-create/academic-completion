import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const CONFIRMATION = "CREATE_AND_DELETE_E2E_DATA";
const PROFILE_ID = "fpzg-politologija-diplomski";
const RULESET_ID = "fpzg-completion-2025-2026";
const RULESET_VERSION = "2026-08-03.1";
const ISSUE_KEY = "check:epic-12-5-production-e2e";

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function httpOrigin(name, value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid URL.`);
  }
  if (parsed.protocol !== "https:") {
    throw new Error(`${name} must use HTTPS for production acceptance.`);
  }
  return parsed.origin;
}

function token() {
  const raw = randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(raw, "utf8").digest("hex");
  return { raw, hash };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertNoError(error, context) {
  if (error) throw new Error(`${context}: ${error.message}`);
}

async function readJson(response, context) {
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error(`${context}: response was not JSON (HTTP ${response.status}).`);
  }
  return body;
}

async function postCheck({ endpoint, lektaOrigin, rawToken, analysisId, issues }) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-completion-handoff": rawToken,
      origin: lektaOrigin,
    },
    body: JSON.stringify({
      schemaVersion: "0.1",
      analysisId,
      rulesetId: RULESET_ID,
      profileId: PROFILE_ID,
      score: issues.length ? 82 : 100,
      categoryScores: [
        { category: "format", earned: issues.length ? 8 : 10, max: 10 },
      ],
      issues,
      analyzedAt: new Date().toISOString(),
      documentFingerprint: `epic-12-5:${analysisId}`,
      coverageTier: 1,
    }),
  });

  const body = await readJson(response, "record-completion-check");
  assert(response.ok && body?.ok === true, `record-completion-check failed with HTTP ${response.status}.`);
  const reflectedOrigin = response.headers.get("access-control-allow-origin");
  assert(
    reflectedOrigin === lektaOrigin,
    `Edge CORS origin mismatch: expected ${lektaOrigin}, received ${reflectedOrigin || "<missing>"}.`,
  );
  return body;
}

async function main() {
  if (process.env.PRODUCTION_E2E_CONFIRM !== CONFIRMATION) {
    throw new Error(
      `Refusing to mutate production test data. Set PRODUCTION_E2E_CONFIRM=${CONFIRMATION}.`,
    );
  }

  const completionOrigin = httpOrigin("COMPLETION_APP_URL", required("COMPLETION_APP_URL"));
  const lektaOrigin = httpOrigin(
    "LEKTA_APP_URL",
    process.env.LEKTA_APP_URL?.trim() || "https://lektahr.netlify.app",
  );
  const supabaseOrigin = httpOrigin("SUPABASE_URL", required("SUPABASE_URL"));
  const serviceRoleKey = required("SUPABASE_SERVICE_ROLE_KEY");
  const edgeEndpoint = new URL(
    process.env.RECORD_COMPLETION_CHECK_URL?.trim() ||
      `${supabaseOrigin}/functions/v1/record-completion-check`,
  ).toString();

  console.log("[1/8] Checking deployed Completion readiness contract...");
  const healthResponse = await fetch(`${completionOrigin}/api/health`, {
    headers: { accept: "application/json" },
    redirect: "follow",
  });
  const health = await readJson(healthResponse, "Completion /api/health");
  assert(healthResponse.ok, `Completion health is not ready (HTTP ${healthResponse.status}).`);
  assert(health?.service === "academic-completion", "Unexpected Completion health service identity.");
  assert(health?.contractVersion === "epic-12.5", "Deployed Completion does not expose Epic 12.5 contract.");
  assert(health?.readyForLektaHandoff === true, "Deployed Completion reports Lekta handoff not ready.");
  assert(health?.completionOrigin === completionOrigin, "Completion canonical production origin mismatch.");
  assert(health?.lektaOrigin === lektaOrigin, "Completion -> Lekta production origin mismatch.");
  assert(health?.supabaseOrigin === supabaseOrigin, "Completion -> Supabase production origin mismatch.");

  console.log("[2/8] Checking deployed Lekta origin...");
  const lektaResponse = await fetch(lektaOrigin, { redirect: "follow" });
  assert(lektaResponse.ok, `Lekta production origin is unavailable (HTTP ${lektaResponse.status}).`);

  const admin = createClient(supabaseOrigin, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const suffix = `${Date.now()}-${randomBytes(4).toString("hex")}`;
  const email = `academic-completion-e2e-${suffix}@example.com`;
  const password = `E2e-${randomBytes(24).toString("base64url")}!`;
  let userId = null;
  let projectId = null;

  try {
    console.log("[3/8] Creating isolated permanent Auth account + Completion project...");
    const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { purpose: "academic-completion-production-e2e" },
    });
    assertNoError(createUserError, "Could not create E2E Auth user");
    userId = createdUser.user?.id || null;
    assert(userId, "Supabase did not return the E2E user id.");

    const { data: project, error: projectError } = await admin
      .from("academic_projects")
      .insert({
        user_id: userId,
        topic: "Epic 12.5 production acceptance",
        institution_id: "unizg",
        unit_id: "fpzg",
        profile_id: PROFILE_ID,
        work_type: "graduate",
        academic_year: "2025./2026.",
        stage: "lekta-preflight",
        ruleset_id: RULESET_ID,
        ruleset_version: RULESET_VERSION,
      })
      .select("id")
      .single();
    assertNoError(projectError, "Could not create E2E academic project");
    projectId = project?.id || null;
    assert(projectId, "Supabase did not return the E2E project id.");

    const { error: stateError } = await admin.from("completion_project_state").insert({
      academic_project_id: projectId,
      stage: "FINAL_CHECK",
      deadline_authority_type: "USER_REPORTED",
      mentor_waiting_for_response: false,
      ai_policy_ruleset_id: RULESET_ID,
      ai_policy_ruleset_version: RULESET_VERSION,
      ai_policy_verified_at: "2026-08-03",
      ai_mentor_consultation: "NOT_ASKED",
      ai_disclosure_state: "NOT_STARTED",
      ai_data_safety_acknowledged: false,
    });
    assertNoError(stateError, "Could not create E2E completion state");

    console.log("[4/8] Minting first project-bound handoff and posting a real Edge request...");
    const firstToken = token();
    const firstAnalysis = `e2e-open-${suffix}`;
    const { error: prepareError } = await admin.rpc("completion_prepare_lekta_handoff", {
      p_user: userId,
      p_project: projectId,
      p_token_hash: firstToken.hash,
      p_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      p_mark_recheck: false,
    });
    assertNoError(prepareError, "Could not prepare first Lekta handoff");

    await postCheck({
      endpoint: edgeEndpoint,
      lektaOrigin,
      rawToken: firstToken.raw,
      analysisId: firstAnalysis,
      issues: [
        {
          issueKey: ISSUE_KEY,
          issueInstanceId: `${firstAnalysis}:1`,
          checkId: "epic-12-5-production-e2e",
          ruleId: null,
          category: "format",
          severity: "error",
          summary: "Production acceptance synthetic finding",
          fixable: false,
          fixerId: null,
          status: "OPEN",
        },
      ],
    });

    const { data: openFinding, error: findingError } = await admin
      .from("completion_lekta_findings")
      .select("lifecycle_status,present_in_latest,task_id,last_seen_analysis_id")
      .eq("academic_project_id", projectId)
      .eq("issue_key", ISSUE_KEY)
      .single();
    assertNoError(findingError, "Could not read imported Lekta finding");
    assert(openFinding.lifecycle_status === "OPEN", "Imported finding did not start OPEN.");
    assert(openFinding.present_in_latest === true, "Imported finding is not current.");
    assert(openFinding.last_seen_analysis_id === firstAnalysis, "Imported finding analysis identity mismatch.");
    assert(openFinding.task_id, "Critical Lekta finding did not create a Completion task.");

    console.log("[5/8] Exercising USER_CHANGED -> RECHECK_REQUIRED through canonical RPCs...");
    const { data: changed, error: changedError } = await admin.rpc(
      "completion_mark_lekta_finding_changed",
      {
        p_user: userId,
        p_project: projectId,
        p_issue_key: ISSUE_KEY,
      },
    );
    assertNoError(changedError, "Could not mark E2E finding USER_CHANGED");
    assert(changed === true, "USER_CHANGED mutation did not report a change.");

    const secondToken = token();
    const secondAnalysis = `e2e-fixed-${suffix}`;
    const { data: markedForRecheck, error: recheckError } = await admin.rpc(
      "completion_prepare_lekta_handoff",
      {
        p_user: userId,
        p_project: projectId,
        p_token_hash: secondToken.hash,
        p_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        p_mark_recheck: true,
      },
    );
    assertNoError(recheckError, "Could not prepare E2E re-check handoff");
    assert(Number(markedForRecheck) === 1, "Expected exactly one USER_CHANGED finding to require re-check.");

    console.log("[6/8] Posting second Edge check and requiring Lekta-only VERIFIED_FIXED...");
    await postCheck({
      endpoint: edgeEndpoint,
      lektaOrigin,
      rawToken: secondToken.raw,
      analysisId: secondAnalysis,
      issues: [],
    });

    const { data: fixedFinding, error: fixedError } = await admin
      .from("completion_lekta_findings")
      .select("lifecycle_status,present_in_latest,task_id,verified_fixed_analysis_id")
      .eq("academic_project_id", projectId)
      .eq("issue_key", ISSUE_KEY)
      .single();
    assertNoError(fixedError, "Could not read VERIFIED_FIXED finding");
    assert(fixedFinding.lifecycle_status === "VERIFIED_FIXED", "Finding was not VERIFIED_FIXED by the second check.");
    assert(fixedFinding.present_in_latest === false, "VERIFIED_FIXED finding is still marked current.");
    assert(
      fixedFinding.verified_fixed_analysis_id === secondAnalysis,
      "VERIFIED_FIXED authority does not reference the second Lekta analysis.",
    );

    const { data: task, error: taskError } = await admin
      .from("completion_tasks")
      .select("status,task_type")
      .eq("id", fixedFinding.task_id)
      .eq("academic_project_id", projectId)
      .single();
    assertNoError(taskError, "Could not read the reconciled Lekta task");
    assert(task.task_type === "LEKTA_FINDING", "Reconciled task has the wrong type.");
    assert(task.status === "DONE", "Lekta did not close its finding task after verification.");

    console.log("[7/8] Proving the generic user task RPC cannot override Lekta authority...");
    const { error: bypassError } = await admin.rpc("completion_set_task_status", {
      p_user: userId,
      p_project: projectId,
      p_task: fixedFinding.task_id,
      p_status: "OPEN",
    });
    assert(bypassError, "Generic task mutation unexpectedly accepted a LEKTA_FINDING task.");
    assert(
      String(bypassError.message).includes("COMPLETION_LEKTA_TASK_REQUIRES_LEKTA_RECHECK"),
      "Generic task mutation failed for an unexpected reason.",
    );

    const { count: checkCount, error: checksError } = await admin
      .from("lekta_checks")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId);
    assertNoError(checksError, "Could not count E2E Lekta checks");
    assert(checkCount === 2, `Expected 2 persisted Lekta checks, found ${checkCount ?? 0}.`);

    console.log("[8/8] Authority loop passed; cleaning all E2E data...");
  } finally {
    if (userId) {
      const { error: deleteUserError } = await admin.auth.admin.deleteUser(userId);
      if (deleteUserError) {
        if (projectId) await admin.from("academic_projects").delete().eq("id", projectId);
        throw new Error(`E2E cleanup failed: ${deleteUserError.message}`);
      }
    }

    if (projectId) {
      const { count: remainingProjects, error: cleanupCheckError } = await admin
        .from("academic_projects")
        .select("id", { count: "exact", head: true })
        .eq("id", projectId);
      assertNoError(cleanupCheckError, "Could not verify E2E cleanup");
      assert(remainingProjects === 0, "E2E academic project survived test-user deletion.");
    }
  }

  console.log("PASS: production Epic 12.5 backend authority acceptance completed with zero retained test project data.");
}

main().catch((error) => {
  console.error(`FAIL: ${error instanceof Error ? error.message : "unknown production E2E failure"}`);
  process.exitCode = 1;
});
