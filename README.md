# Academic Completion

Working repository for the third Academic Suite product: a **policy-aware academic completion system**.

## Product boundaries

- **Academic Completion:** knows where the academic project stands, what blocks it and what should happen next.
- **Katedra:** Croatian academic content and writing assistance.
- **Lekta:** deterministic verification of the actual document.

The central product primitive here is **project state**, not chat.

## Current status

**Epic 1 — App Shell**

The repository intentionally contains only the shell and canonical product documentation. No Stripe, AI execution, document upload, Katedra/Lekta integration or real faculty-policy logic is implemented in this Epic.

## Canonical product docs

See `docs/product/`.

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

## Epic 1 acceptance target

The shell must make it structurally easier to build a project-control product, not an AI-chat product.
