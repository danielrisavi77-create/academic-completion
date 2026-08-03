# Academic Completion

Working repository for the third Academic Suite product: a **policy-aware academic completion system**.

## Product boundaries

- **Academic Completion:** knows where the academic project stands, what blocks it and what should happen next.
- **Katedra:** Croatian academic content and writing assistance.
- **Lekta:** deterministic verification of the actual document.

The central product primitive here is **project state**, not chat.

## Current status

**Epic 9 — First Live Contextual AI Action**

The repository now includes:
- typed academic project state and events;
- a versioned, source-backed FPZG rules/policy pack;
- a public landing page and guest Completion Scan for FPZG Politologija;
- deterministic project blockers and Next Best Action;
- Supabase SSR auth + permanent-user ownership of shared `academic_projects.id`;
- server-owned structured Completion persistence;
- guest Scan → login → saved project flow;
- fail-closed runtime AI capability authorization;
- a provider-agnostic contextual AI execution contract;
- the first real provider-backed action, scoped only to persisted `DISCLOSURE_HELP` tasks;
- deterministic Data Safety blocking before cloud processing;
- direct Anthropic Messages integration using `claude-sonnet-5`;
- project/task-scoped content-free usage telemetry and atomic provider-spend reservations;
- visible generative-AI disclosure before and after the live action.

There is still **no generic chat endpoint**. The live HTTP boundary currently rejects every capability except `DISCLOSURE_HELP`, even though the domain engine models additional capabilities for future verified releases.

## Canonical database authority

Completion database migrations live in the Lekta repository and the shared Academic Suite Supabase migration history:

- `0041_completion_app_foundation.sql`
- `0042_completion_app_access_hardening.sql`
- `0043_completion_app_permanent_account_gate.sql`
- `0044_completion_ai_usage.sql`
- `0045_completion_ai_rate_reservation.sql`
- `0046_completion_ai_finalize_grant.sql`

## Persistence + AI safety

- `auth.users.id` remains the account authority;
- `academic_projects.id` remains the shared academic-project authority;
- shared-core ownership uses `academic_projects.user_id`;
- Supabase anonymous-auth sessions are not accepted as Completion accounts;
- browser clients cannot write Completion authority/AI-audit state directly;
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
- `/project` — offline demo Project Home
- `/project/[projectId]` — authenticated persisted Project Home; shows live disclosure AI only when the project has an actionable `DISCLOSURE_HELP` task
- `POST /api/projects/[projectId]/ai-actions` — strict task-scoped live AI boundary

## Environment

Copy `.env.example` and configure the shared Academic Suite Supabase values. Live AI additionally requires a server-only `ANTHROPIC_API_KEY`.

## Canonical product docs

See `docs/product/`. Epic implementation notes live under `docs/architecture/`.

## Development

```bash
npm ci
npm run dev
```

Validation:

```bash
npm run build
npm run lint
npm test
```

CI uses the committed npm lockfile, runs production dependency audit at high severity, then tests, lint and Next production build.
