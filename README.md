# Academic Completion

Working repository for the third Academic Suite product: a **policy-aware academic completion system**.

## Product boundaries

- **Academic Completion:** knows where the academic project stands, what blocks it and what should happen next.
- **Katedra:** Croatian academic content and writing assistance.
- **Lekta:** deterministic verification of the actual document.

The central product primitive here is **project state**, not chat.

## Current status

**Epic 7 — Contextual AI Execution Contract**

The repository now includes:
- typed academic project state and events;
- a versioned, source-backed FPZG rules/policy pack;
- a public landing page and guest Completion Scan for FPZG Politologija;
- deterministic project blockers and Next Best Action;
- a typed `/project` home (`DEMO STATE` until persistence arrives);
- fail-closed runtime AI capability authorization;
- a provider-agnostic contextual AI execution service with capability-scoped instructions and content-free audit metadata.

There is intentionally **no public/live AI provider endpoint yet**. Until authenticated project ownership exists, exposing a paid model route would create an unnecessary cost and abuse surface. The AI execution contract is fully testable with a fake provider and guarantees denied/invalid actions never reach a provider.

## Policy + AI safety

- official `DENY` cannot be overridden by a user-reported mentor permission;
- `UNKNOWN` is never treated as `ALLOW`;
- stale/mismatched project rulesets fail closed;
- requested capability must exactly match the project task;
- only actionable tasks can invoke AI;
- denied/invalid actions produce zero provider calls;
- successful audit metadata excludes user input and model output;
- capability instructions prevent contextual review/coaching from silently becoming submission-text generation.

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
