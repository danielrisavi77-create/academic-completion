# Academic Completion

Working repository for the third Academic Suite product: a **policy-aware academic completion system**.

## Product boundaries

- **Academic Completion:** knows where the academic project stands, what blocks it and what should happen next.
- **Katedra:** Croatian academic content and writing assistance.
- **Lekta:** deterministic verification of the actual document.

The central product primitive here is **project state**, not chat.

## Current status

**Epic 6 — Runtime Policy Resolver**

The repository now includes:
- typed academic project state and events;
- a versioned, source-backed FPZG rules/policy pack;
- a public landing page and guest Completion Scan for FPZG Politologija;
- deterministic project blockers and Next Best Action;
- a typed `/project` home (`DEMO STATE` until persistence arrives);
- fail-closed runtime AI capability authorization using exact project ruleset version and structured AI-governance state.

The resolver does not call an AI provider. Actual model execution, auth/Supabase persistence, Stripe and live Katedra/Lekta network integrations remain intentionally deferred.

## Policy safety

- official `DENY` cannot be overridden by a user-reported mentor permission;
- `UNKNOWN` is never treated as `ALLOW`;
- stale/mismatched project rulesets fail closed;
- conditional capabilities remain blocked until runtime blocking conditions are met;
- source verification, disclosure and student-control requirements remain visible obligations after authorization.

## Routes

- `/` — public MTK landing
- `/scan` — guest Completion Scan
- `/project` — typed project-control home (`DEMO STATE` until persistence arrives)

## Canonical product docs

See `docs/product/`.

Epic implementation notes live under `docs/architecture/`.

## Development

```bash
npm install
npm run dev
```

Validation:

```bash
npm run build
npm run lint
npm test
```

CI additionally audits production dependencies at high severity.
