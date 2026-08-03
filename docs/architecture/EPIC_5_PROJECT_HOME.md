# Epic 5 — Project Home, Blockers & Next Best Action

## Goal

Turn typed AcademicProject state into an explainable project-control surface.

Epic 5 introduces:
- deterministic blocker derivation;
- a separate waiting-external signal;
- deterministic Next Best Action selection;
- a real Project Home view powered by typed state;
- a clearly labelled demo FPZG project fixture until persistence is introduced.

## Key product rule

Deadline pressure is **context**, not automatically the action.

If a concrete substantive or verification blocker exists, the Next Best Action should point to the task that can actually be executed instead of returning a generic "deadline is close" instruction.

Priority order in this Epic favours:
1. critical Lekta verification blockers;
2. future policy/admin blockers;
3. substantive methodology/mentor blockers;
4. missing final verification;
5. actionable project tasks;
6. generic deadline risk;
7. waiting-external state only when no actionable work remains.

## Waiting is not a blocker

`mentor.waitingForMentor` is rendered through `ProjectWaitingItem` and does not become a critical/open blocker.

The system may still select `WAIT_FOR_EXTERNAL` as the final state when no other actionable task exists.

## Authority

Derived blockers inherit the most relevant authority where possible:
- mentor tasks keep `MENTOR_REPORTED` / user-reported authority;
- Lekta findings use `LEKTA_VERIFIED` with analysis reference;
- deadline calculations use `SYSTEM_ASSESSED` while retaining the underlying deadline source context.

## Project Home route

`/project` now renders a typed, deterministic demo state.

The demo is explicitly labelled `DEMO STATE` and is not presented as the current user's persisted project.

This is intentional: guest Scan-to-project persistence and Supabase storage are not smuggled into this Epic.

## Explicit non-goals

Not implemented:
- account/auth;
- persistent database adapter;
- Scan -> persistent project migration;
- runtime AI policy resolver;
- actual AI action execution;
- actual Lekta/Katedra network handoff;
- Stripe/paywall;
- mentor CRUD UI.

## Validation

Unit tests must prove:
- critical Lekta finding outranks generic deadline pressure;
- mentor feedback derives from typed tasks;
- waiting is separate from blockers;
- an actionable task outranks waiting;
- waiting becomes the next state only when nothing else is actionable;
- no readiness percentage is produced.
