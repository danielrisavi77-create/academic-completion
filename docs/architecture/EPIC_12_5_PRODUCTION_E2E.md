# Epic 12.5 — Production E2E Acceptance

Status: **HARNESS IMPLEMENTED; LIVE BROWSER GATE BLOCKED UNTIL ACADEMIC COMPLETION HAS A CANONICAL PRODUCTION ORIGIN.**

Epic 12 established the authoritative Lekta verification loop. Epic 12.5 does not add product capability. Its job is to prove that the merged system works through production boundaries rather than only through unit tests, SQL smoke tests, or preview code.

## Acceptance invariant

A project is production-accepted only when all of the following are true:

1. the deployed Academic Completion app reports `readyForLektaHandoff=true` from `/api/health`;
2. the configured Completion origin, Lekta origin and shared Supabase origin match the production environment;
3. a short-lived project-bound handoff capability reaches the deployed `record-completion-check` Edge Function;
4. the first check creates a current `OPEN` Lekta finding and a `LEKTA_FINDING` Completion task;
5. user intent can move the lifecycle only to `USER_CHANGED` and then `RECHECK_REQUIRED`;
6. only a later Lekta check can produce `VERIFIED_FIXED` and close the Lekta task;
7. the generic task mutation RPC cannot reopen/close a `LEKTA_FINDING` task;
8. temporary E2E account/project/check data is deleted after the automated acceptance run;
9. a real private FPZG `.docx` completes the same flow in a real browser without its bytes/body being persisted by Completion.

## Public readiness contract

`GET /api/health` is deliberately content-free and exposes only deployment/configuration readiness:

- service identity;
- Epic 12.5 contract version;
- deploy revision when hosting exposes one;
- normalized Completion, Lekta and Supabase origins;
- boolean configuration checks;
- `readyForLektaHandoff`.

It never exposes keys, tokens, user data, document data, provider credentials or DB contents. Missing server authority or canonical Completion origin returns HTTP 503.

## Automated production authority smoke

Manual workflow: `.github/workflows/production-e2e.yml`

Script: `scripts/production-e2e-acceptance.mjs`

The workflow is intentionally `workflow_dispatch` only. It never runs on ordinary PR/push CI.

Required GitHub configuration:

- repository/environment variable `COMPLETION_APP_URL` = canonical deployed HTTPS origin;
- environment secret `SUPABASE_SERVICE_ROLE_KEY` for the existing shared Lekta Supabase project.

The workflow pins:

- Lekta origin: `https://lektahr.netlify.app`;
- shared Supabase origin: `https://zrrjttizjyfcxmcpgzml.supabase.co`.

To start it, the operator must type exactly:

`CREATE_AND_DELETE_E2E_DATA`

### What the smoke actually does

1. Calls deployed Completion `/api/health` and requires the Epic 12.5 contract.
2. Calls the deployed Lekta origin.
3. Creates an isolated permanent Supabase Auth test account.
4. Creates one isolated FPZG graduate Academic Completion project and state.
5. Mints a short-lived opaque handoff token; only its SHA-256 is persisted.
6. POSTs one sanitized finding to the real deployed `record-completion-check` Edge Function with the Lekta production `Origin` header.
7. Requires `OPEN`, `present_in_latest=true` and a linked `LEKTA_FINDING` task.
8. Calls the canonical `USER_CHANGED` mutation.
9. Prepares re-check and requires exactly one `RECHECK_REQUIRED` transition.
10. POSTs a second real Edge check with the finding absent.
11. Requires `VERIFIED_FIXED`, `present_in_latest=false`, the second analysis as verification authority, and task `DONE`.
12. Attempts the generic task-status bypass and requires `COMPLETION_LEKTA_TASK_REQUIRES_LEKTA_RECHECK`.
13. Requires exactly two `lekta_checks` rows for the temporary project.
14. Deletes the temporary Auth user and verifies the project was cascade-deleted.

The script never prints the service-role key, handoff token, temporary password, user id or project id.

## Real-browser + real-DOCX gate

This is deliberately separate from the backend smoke because the real document must remain a private local browser input.

Use a **duplicate** of a private FPZG final/master `.docx`; never commit it to this repository and never upload it to the Completion backend.

Acceptance steps:

1. Open the canonical Academic Completion production origin in a normal browser.
2. Register/sign in with a permanent test account.
3. Create/save an FPZG final or graduate project through the real Scan flow.
4. From `/project/[projectId]`, choose the real Lekta Check action.
5. Confirm the browser lands on the Lekta production origin and that the raw `#handoff=` capability disappears from the address bar after Lekta bootstrap.
6. Upload the private FPZG `.docx` in Lekta and run the normal local analysis.
7. Confirm the result shows the return action only after server persistence succeeds.
8. Return to the same Completion project. Require the latest Lekta analysis metadata, current finding(s), blocker/task projection and a Lekta-derived Next Best Action where applicable.
9. On a duplicate document, correct one deterministic finding. In Completion click only `Promijenio sam`; verify it does **not** become `VERIFIED_FIXED` yet.
10. Start re-check from Completion, analyze the revised duplicate in Lekta, then return.
11. Require that the disappeared stable finding is `VERIFIED_FIXED` and its `LEKTA_FINDING` task is `DONE`.
12. Require that any unrelated finding that merely disappeared without `USER_CHANGED/RECHECK_REQUIRED` is not falsely marked verified.

### Browser privacy inspection

During the real check, inspect the `record-completion-check` request in browser DevTools. The request body must not contain:

- DOCX bytes or body text;
- `projectId` or `userId`;
- issue detail/location;
- mentor text;
- source passages;
- prompts or model output.

The browser may send only the minimized sanitized check projection plus the opaque capability header.

## Current blocker

At implementation time the Academic Completion repository has CI but no canonical production hosting origin recorded in the repository and no hosting deployment status attached to the merged PR. Therefore the real-browser gate cannot honestly be marked PASS yet.

Do **not** interpret green application CI as production E2E acceptance. Epic 12.5 becomes PASS only after:

- Academic Completion is deployed to a canonical HTTPS origin;
- `COMPLETION_APP_URL` and production Supabase env are configured there;
- the manual production authority smoke passes;
- the private real-FPZG-DOCX browser checklist above passes.
