# Academic Completion

Working repository for the third Academic Suite product: a **policy-aware academic completion system**.

## Product boundaries

- **Academic Completion:** knows where the academic project stands, what blocks it and what should happen next.
- **Katedra:** Croatian academic content and writing assistance.
- **Lekta:** deterministic verification of the actual document.

The central product primitive here is **project state**, not chat.

## Current status

**Epic 8 — Authenticated Project Persistence**

The repository now includes:
- typed academic project state and events;
- a versioned, source-backed FPZG rules/policy pack;
- a public landing page and guest Completion Scan for FPZG Politologija;
- deterministic project blockers and Next Best Action;
- fail-closed runtime AI capability authorization;
- a provider-agnostic contextual AI execution contract;
- Supabase SSR authentication using the existing Academic Suite account authority;
- authenticated ownership of the shared `academic_projects.id`;
- server-owned structured Completion persistence;
- guest Scan → login → restored Scan → saved project flow;
- typed initial project tasks derived from structured Scan answers without persisting thesis text or mentor-message bodies;
- authenticated `/project/[projectId]` loading backed by persisted project state.

The canonical Completion database migrations live in the Lekta repository and follow the existing Academic Suite migration history:

- `0041_completion_app_foundation.sql`
- `0042_completion_app_access_hardening.sql`
- `0043_completion_app_permanent_account_gate.sql`

There is intentionally **no public/live AI provider endpoint yet**. The next execution layer must pass through permanent-user auth, project ownership, actionable task validation and the runtime policy resolver before any provider call.

## Persistence safety

- `auth.users.id` remains the account authority;
- `academic_projects.id` remains the shared academic-project authority;
- shared-core ownership uses `academic_projects.user_id`;
- Supabase anonymous-auth sessions are not accepted as Completion accounts;
- authenticated browsers have read-only access to owned Completion state;
- writes use trusted server credentials only after authenticated ownership validation;
- the project-creation API accepts only the canonical structured Scan fields and rejects unknown fields;
- service-role credentials are server-only;
- no raw thesis text, DOCX body, mentor-message body, AI prompt or model output is persisted by the Completion foundation;
- user-reported Lekta status never becomes `LEKTA_VERIFIED`;
- stale/mismatched policy rulesets fail closed.

## Policy + AI safety

- official `DENY` cannot be overridden by a user-reported mentor permission;
- `UNKNOWN` is never treated as `ALLOW`;
- requested capability must exactly match the project task;
- only actionable tasks can invoke AI;
- denied/invalid actions produce zero provider calls;
- successful audit metadata excludes user input and model output;
- capability instructions prevent contextual review/coaching from silently becoming submission-text generation.

## Routes

- `/` — public MTK landing
- `/scan` — guest Completion Scan + save-to-project handoff
- `/prijava` — Academic Suite login / registration entry
- `/project` — demo project-control home until project selection/index is added
- `/project/[projectId]` — authenticated persisted Project Home

## Canonical product docs

See `docs/product/`.

Epic implementation notes live under `docs/architecture/`.

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
