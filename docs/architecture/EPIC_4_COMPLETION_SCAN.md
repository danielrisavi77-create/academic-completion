# Epic 4 — Completion Scan

## Goal

Create the first real user-value surface of the MTK: a guest Completion Scan that turns a small set of structured FPZG Politologija project facts into a focused diagnostic result.

## Public flow

- `/` — MTK landing page
- `/scan` — guest Completion Scan
- `/project` — preserved project-control shell for the next Epic

No account is required for the Scan.

## Inputs

The Scan intentionally contains no academic free-text fields.

It asks only for structured data:
- work type
- target submission date
- topic approval
- stage
- draft status
- mentor-version status
- unresolved mentor-feedback level
- Lekta status
- whether GenAI has been used
- mentor consultation status when AI has been used

## Output

A result contains:
- current stage
- days to user target
- at most 3 prioritized findings
- waiting-external item where applicable
- FPZG AI-policy snapshot
- one initial Next Action

The Scan does not produce:
- readiness percentage
- grade prediction
- faculty approval
- document-compliance certification

## Scope boundary

Epic 4 uses a dedicated pure `evaluateCompletionScan()` function.

This is **not** the final project blocker engine or project Next Best Action engine. Those arrive in Epic 5 and operate on persistent typed Project State.

The Scan evaluator exists to validate the free diagnostic experience before account/persistence/commercial complexity is introduced.

## Privacy

Guest Scan data is held only in client component state during this Epic.

No raw thesis text, mentor comments, files or source passages are requested.

Analytics events are client-dispatched metadata only. There is no analytics backend in this Epic.

## MTK scope

The public copy is intentionally narrower than "all FPZG":

**FPZG Politologija — final and master's thesis**

This matches the currently pinned Lekta document profiles and avoids implying unsupported formal-document coverage for other FPZG study variants.

## Non-goals

Not implemented:
- auth
- Supabase persistence
- project creation from Scan
- Stripe/paywall
- actual AI execution
- Katedra network handoff
- Lekta network handoff
- full blocker engine
- persistent Next Best Action engine
- other faculties/programs

## Validation

Required CI:
- production dependency audit
- scan-domain unit tests
- existing project-state/rules tests
- lint
- Next build
