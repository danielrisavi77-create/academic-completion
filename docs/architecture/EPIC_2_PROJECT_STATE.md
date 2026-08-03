# Epic 2 — Typed Project State

## Scope

Epic 2 establishes the typed domain foundation for Academic Completion.

Included:
- authority types
- project identity/timeline/stage
- tasks
- mentor evidence state
- Lekta lifecycle state
- blocker/Next Best Action types only
- typed project events
- pure project reducer
- repository interface + in-memory adapter
- unit tests

## Explicit non-goals

Not included:
- Completion Scan UI
- Supabase production adapter/migration
- blocker engine
- Next Best Action engine
- FPZG rule data
- policy resolver
- AI/model execution
- Katedra integration
- Lekta network integration
- Stripe

The in-memory repository is a test/dev persistence boundary, not a production database decision.

Shared production schema work must remain compatible with the Academic Suite database-authority rule documented in `docs/product/03_TECHNICAL_ARCHITECTURE.md`.
