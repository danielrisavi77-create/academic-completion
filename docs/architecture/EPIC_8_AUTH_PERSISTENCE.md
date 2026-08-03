# Epic 8 — Authenticated Project Persistence

## Goal

Establish the authenticated ownership and persistence boundary required before live AI, mentor mutations, cross-product writes or commerce.

## Shared authority

Academic Completion reuses the existing Academic Suite Supabase project and canonical IDs:

- account: `auth.users.id`
- academic project: `academic_projects.id`

Production schema authority remains in the Lekta repository.

Applied shared migrations:

- `0037_completion_app_foundation.sql`
- `0038_completion_app_write_hardening.sql`
- `0039_completion_app_rls_performance.sql`

## Read/write model

Authenticated clients may read only completion rows belonging to their own parent `academic_projects.owner_user_id` through RLS.

Authenticated browser clients do **not** have direct mutation policies for:

- `completion_project_state`
- `completion_tasks`
- `completion_events`

Trusted server code performs mutations with the service role only after explicit ownership or creation validation.

This prevents browser clients from fabricating authority such as `OFFICIAL_RULE` or `LEKTA_VERIFIED`.

## App auth

The app uses the shared Supabase Auth identity through `@supabase/ssr`:

- browser client
- server cookie client
- Next proxy session refresh
- minimal email/password login/registration

The service-role key is only read in server persistence modules.

## Guest Scan persistence boundary

`POST /api/projects`:

1. validates a real Supabase Auth user with `auth.getUser()`;
2. rejects unknown JSON keys;
3. parses only the canonical structured Scan fields;
4. verifies work type/profile matching;
5. recomputes the trusted project-creation command from current source data;
6. writes shared `academic_projects` + Completion App structured state;
7. creates a content-free `PROJECT_CREATED` audit event.

The API does not accept blocker lists, policy decisions, authority labels, raw thesis text or mentor comments from the client.

## Work-type mapping

Validated against the live Academic Suite database constraint:

- `FINAL_THESIS -> final`
- `MASTERS_THESIS -> graduate`

## Ruleset persistence

The database stores only the active ruleset ID/version/date.

Capability decisions are **not** persisted as arbitrary browser-controlled data. When a project is loaded, the app reconstructs decisions from the current pinned FPZG ruleset only if the stored ID/version exactly matches.

Stale ruleset => empty capability decisions => runtime resolver fails closed.

## Project ownership

`/project/[projectId]`:

- requires authenticated user;
- loads the project through a service-role query filtered by both project ID and `owner_user_id`;
- returns 404 for an unowned/nonexistent project;
- derives blockers and Next Best Action from the typed project state.

## Data boundary

No persistence table added by this Epic contains:

- thesis body text;
- raw DOCX;
- mentor-message bodies;
- source passages;
- AI prompt/output content;
- generic JSON payloads.

`completion_events` remains content-free.

## Intentional limitation

The first persistence implementation uses compensating cleanup if creation of the 1:1 completion state or initial audit event fails after the parent project insert.

A future transactional RPC may replace this once usage justifies it; the MTK does not expose partial rows to the user.

## Explicit non-goals

This Epic does not yet:

- enable a live Anthropic/provider route;
- write mentor tasks through the UI;
- import live Lekta checks;
- implement Katedra handoff;
- implement Stripe/Project Pass;
- persist raw academic content.
