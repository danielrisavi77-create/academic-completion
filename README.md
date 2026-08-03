# Academic Completion

Working repository for the third Academic Suite product: a **policy-aware academic completion system**.

## Product boundaries

- **Academic Completion:** knows where the academic project stands, what blocks it and what should happen next.
- **Katedra:** Croatian academic content and writing assistance.
- **Lekta:** deterministic verification of the actual document.

The central product primitive here is **project state**, not chat.

## Current status

**Epic 12 — Authoritative Lekta Verification Loop: MERGED**  
**Epic 12.5 — Production E2E Acceptance: HARNESS IMPLEMENTED; LIVE HOSTING/BROWSER GATE PENDING**

The repository now includes:
- typed academic project state and events;
- a versioned, source-backed FPZG rules/policy pack;
- a public landing page and guest Completion Scan for FPZG Politologija;
- deterministic project blockers and Next Best Action;
- Supabase SSR auth + permanent-user ownership of shared `academic_projects.id`;
- server-owned structured Completion persistence;
- guest Scan → login → saved project flow;
- real task-status and mentor workflow controls with atomic audit events;
- separate user-reported mentor sent-version and mentor-seen state;
- fail-closed runtime AI capability authorization;
- the first real provider-backed action, scoped only to persisted `DISCLOSURE_HELP` tasks;
- deterministic Data Safety blocking before cloud processing;
- direct Anthropic Messages integration using `claude-sonnet-5`;
- project/task-scoped content-free usage telemetry and atomic provider-spend reservations;
- `/project` as a real resume index for signed-in users while guests keep the demo;
- project-scoped sidebar/mobile navigation on `/project/[projectId]`;
- real hydration of the latest `lekta_checks` + structured `completion_lekta_findings` lifecycle;
- `OPEN → USER_CHANGED → RECHECK_REQUIRED → VERIFIED_FIXED`, with only Lekta allowed to produce the final verification state;
- server-minted project-bound handoff capabilities whose raw token stays in the URL fragment and whose DB form is SHA-256 only;
- DB enforcement that generic task controls cannot mutate `LEKTA_FINDING` task authority;
- a content-free `/api/health` production readiness contract;
- a manually triggered, self-cleaning production authority E2E smoke.

There is still **no generic chat endpoint**. The live HTTP boundary currently rejects every capability except `DISCLOSURE_HELP`, even though the domain engine models additional capabilities for future verified releases.

The repository does **not** currently record a canonical deployed Academic Completion production origin. Green application CI is therefore not equivalent to production browser acceptance; see `docs/architecture/EPIC_12_5_PRODUCTION_E2E.md`.

## Canonical database authority

Completion database migrations live in the Lekta repository and the shared Academic Suite Supabase migration history:

- `0041_completion_app_foundation.sql`
- `0042_completion_app_access_hardening.sql`
- `0043_completion_app_permanent_account_gate.sql`
- `0044_completion_ai_usage.sql`
- `0045_completion_ai_rate_reservation.sql`
- `0046_completion_ai_finalize_grant.sql`
- `0047_completion_workflow_mutations.sql`
- `0048_completion_mentor_sent_version.sql`
- `0049_completion_lekta_handoff_lifecycle.sql`
- `0050_completion_lekta_handoff_token_rotation.sql`
- `0051_completion_lekta_task_authority_guard.sql`

## Persistence + workflow safety

- `auth.users.id` remains the account authority;
- `academic_projects.id` remains the shared academic-project authority;
- shared-core ownership uses `academic_projects.user_id`;
- Supabase anonymous-auth sessions are not accepted as Completion accounts;
- browser clients cannot write Completion authority/AI-audit state directly;
- task and mentor mutations are service-role RPCs after permanent-user auth;
- task/status changes and workflow audit events are atomic;
- `mentor_last_sent_version_label` never overwrites `mentor_last_seen_version_label`;
- mentor-message bodies are never required or persisted;
- Completion does not ingest raw DOCX/body text for Lekta verification;
- current Lekta workflow UI reads only the structured finding projection and latest check metadata;
- a user may report that a document was changed, but only a later Lekta check can create `VERIFIED_FIXED`;
- `LEKTA_FINDING` tasks cannot be manually closed/reopened through the generic task RPC;
- unsupported work types/profiles and legacy projects without Completion state are not presented as Completion projects.

## AI safety

- service-role credentials and `ANTHROPIC_API_KEY` are server-only;
- live AI request accepts only `taskId + userInput`; browser cannot choose capability/model;
- official `DENY`, `UNKNOWN`, task mismatch and non-actionable tasks produce zero provider calls;
- live v0.1 allows only `DISCLOSURE_HELP`;
- obvious email/phone/OIB-like identifiers, API secrets and bearer tokens are blocked before cloud processing;
- user input and model output are returned through the request but are not persisted in Completion tables;
- usage persistence contains project/task/capability/provider/model/token metadata only;
- provider reservations are atomically limited to 4 per rolling 10 minutes and 12 per rolling 24 hours during the pilot;
- user-reported Lekta status never becomes `LEKTA_VERIFIED`;
- stale/mismatched policy rulesets fail closed.

## Routes

- `/` — public MTK landing
- `/scan` — guest Completion Scan + save-to-project handoff
- `/prijava` — Academic Suite login
- `/registracija` — account creation
- `/project` — signed-in project index; guest demo when there is no permanent session
- `/project/[projectId]` — authenticated persisted Project Home with scoped navigation, workflow controls, Lekta lifecycle and contextual disclosure AI when applicable
- `/api/health` — content-free production readiness contract; HTTP 503 until core production authority is configured
- `PATCH /api/projects/[projectId]/tasks/[taskId]` — controlled generic user task-state mutation (Lekta tasks are rejected by DB authority)
- `POST /api/projects/[projectId]/mentor-workflow` — content-free mentor workflow mutation
- `POST /api/projects/[projectId]/ai-actions` — strict task-scoped live AI boundary
- `POST /api/projects/[projectId]/lekta-handoff` — server-minted Lekta handoff capability
- `POST /api/projects/[projectId]/lekta-findings/[issueKey]` — controlled `USER_CHANGED` finding mutation

## Environment

Copy `.env.example` and configure:

- canonical `COMPLETION_APP_URL`;
- shared Academic Suite Supabase public values;
- server-only `SUPABASE_SERVICE_ROLE_KEY`;
- optional `LEKTA_APP_URL` override (production default: `https://lektahr.netlify.app`);
- server-only `ANTHROPIC_API_KEY` for live contextual AI.

Never set `PRODUCTION_E2E_CONFIRM` permanently in the deployed app.

## Production acceptance

Normal validation never mutates production data.

```bash
npm run check:production-e2e
```

The real production authority smoke is manual only:

```bash
PRODUCTION_E2E_CONFIRM=CREATE_AND_DELETE_E2E_DATA \
COMPLETION_APP_URL=https://your-completion-origin.example \
SUPABASE_URL=https://zrrjttizjyfcxmcpgzml.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=... \
npm run production:e2e
```

Prefer the manually triggered GitHub workflow `Production E2E Acceptance`, which uses the protected `production-e2e` environment. Full browser + private real-FPZG-DOCX acceptance remains a separate required gate; see the Epic 12.5 architecture note.

## Canonical product docs

See `docs/product/`. Epic implementation notes live under `docs/architecture/`.

## Development

```bash
npm ci
npm run dev
```

Validation:

```bash
npm run check:production-e2e
npm run build
npm run lint
npm test
```

CI uses the committed npm lockfile, runs production dependency audit at high severity, validates the production E2E harness syntax, then tests, lint and Next production build.
