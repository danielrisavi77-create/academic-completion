# Academic Completion

Working repository for the third Academic Suite product: a **policy-aware academic completion system**.

## Product boundaries

- **Academic Completion:** knows where the academic project stands, what blocks it and what should happen next.
- **Katedra:** Croatian academic content and writing assistance.
- **Lekta:** deterministic verification of the actual document.

The central product primitive here is **project state**, not chat.

## Current status

**Epic 5 — Project Home, Blockers & Next Best Action**

The repository now includes:
- typed academic project state and events;
- a versioned, source-backed FPZG rules/policy pack;
- a public landing page and guest Completion Scan for FPZG Politologija;
- deterministic project blocker derivation;
- a separate waiting-external signal;
- deterministic Next Best Action selection;
- a real `/project` home powered by typed state and a clearly labelled demo project.

The Project Home does not yet pretend the Scan is persisted. Auth, Supabase persistence, runtime policy authorization, AI execution, Stripe and live Katedra/Lekta network integrations remain intentionally deferred.

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
