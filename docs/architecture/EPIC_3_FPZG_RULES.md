# Epic 3 — FPZG Rules & AI Policy Pack

## Scope

Epic 3 creates the first versioned, source-backed faculty ruleset for the MTK launch institution: FPZG.

The ruleset contains:
- official process rules for final/master's completion;
- current 2025/2026 deadline windows relevant to the 2026 autumn cycle;
- normalized AI capability decisions based on FPZG's 21 May 2026 GenAI guidance;
- a pinned reference to Lekta for formal/document rules.

## Source model

Every rule references one or more typed source records.

Sources are either:
- official FPZG web pages;
- official FPZG PDFs;
- a pinned Lekta verified export.

The current Lekta source commit is:

`39c4db7a52bac7f1d67ed68a60173a1c8be50dac`

## Important boundary

Academic Completion does **not** copy Lektina formal/document rules into its own rule database.

Instead it stores a `DocumentRulesReference` pointing to:
- `fpzg-politologija-zavrsni`
- `fpzg-politologija-diplomski`

This preserves Lekta as the document-verification authority and avoids two diverging normative stores.

## Direct rule vs interpretation

AI policy records distinguish:
- `DIRECT` — source clearly supports the normalized decision;
- `CONSERVATIVE_INTERPRETATION` — product maps broader source principles to a capability conservatively.

A conservative interpretation is never presented as a verbatim faculty statement.

## MTK safety defaults

- `GENERATE_SUBMISSION_TEXT` is `DENY` for FPZG final/master's projects.
- uncertain capabilities such as generic `PARAPHRASE`, `STRUCTURE_ASSIST` and initial `DEFENSE_PREP` remain `UNKNOWN`.
- core allowed assistance carries mentor-consultation/disclosure conditions for final/master's work.

## Explicit non-goals

This Epic does not implement:
- runtime policy resolution;
- AI execution;
- blocker generation from deadlines;
- Next Best Action ranking;
- new faculty support;
- a duplicate formatting-rule engine.

Runtime authorization arrives in a later Epic. This Epic only establishes authoritative, testable data.
