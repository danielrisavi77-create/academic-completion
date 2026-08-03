# Academic Completion

Working repository for the third Academic Suite product: a **policy-aware academic completion system**.

## Product boundaries

- **Academic Completion:** knows where the academic project stands, what blocks it and what should happen next.
- **Katedra:** Croatian academic content and writing assistance.
- **Lekta:** deterministic verification of the actual document.

The central product primitive here is **project state**, not chat.

## Current status

**Epic 4 — Completion Scan**

The repository now includes:
- typed academic project state;
- a versioned, source-backed FPZG rules/policy pack;
- a public MTK landing page;
- a guest Completion Scan for **FPZG Politologija final/master's work**;
- a pure scan evaluator that returns at most three findings, a policy snapshot and one initial next action.

The Scan intentionally requests no thesis text, mentor-comment text or document upload. Persistent project creation, the full blocker/Next Best Action engine, runtime policy authorization, AI execution, Stripe and live Katedra/Lekta integrations remain deferred.

## Routes

- `/` — public MTK landing
- `/scan` — guest Completion Scan
- `/project` — project-control shell for the next Epic

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
