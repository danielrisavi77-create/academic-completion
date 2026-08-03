# Epic 12.5 — Canonical Production Origin

Canonical Academic Completion production origin:

`https://academic-completion.netlify.app`

This origin is the value that production hosting must expose as `COMPLETION_APP_URL` and that the protected `production-e2e` GitHub Environment must use for its `COMPLETION_APP_URL` variable.

This document records the deployment origin only. It does **not** by itself mark production E2E as passed. Full acceptance still requires:

1. deployed `/api/health` returns HTTP 200 and `readyForLektaHandoff: true`;
2. manual `Production E2E Acceptance` workflow passes;
3. private real FPZG DOCX browser round-trip passes without uploading raw DOCX/body text to Completion shared state.
