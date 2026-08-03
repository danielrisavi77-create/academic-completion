# Academic Completion

Working repository for the third Academic Suite product: a **policy-aware academic completion system**.

## Product boundaries

- **Academic Completion:** knows where the academic project stands, what blocks it and what should happen next.
- **Katedra:** Croatian academic content and writing assistance.
- **Lekta:** deterministic verification of the actual document.

The central product primitive here is **project state**, not chat.

## Current status

**Epic 3 — FPZG Rules & AI Policy Pack**

The repository now contains typed project state plus a first versioned, source-backed FPZG completion ruleset for 2025/2026. Process and AI-policy rules live here; formal/document rules remain referenced to Lekta as the canonical verification authority.

Runtime policy resolution, Completion Scan, AI execution, Stripe and live cross-product integrations remain intentionally deferred to later Epics.

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
