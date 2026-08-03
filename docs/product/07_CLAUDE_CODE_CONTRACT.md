# Claude Code / Coding Agent Contract v0.1

## Purpose

Ovaj file ograničava coding agente.

Agent implementira odobreni Epic.

Agent **ne redizajnira proizvod**.

## Source-of-truth order

Prije svakog Epica čitati:
1. `01_PRODUCT_CONSTITUTION.md`
2. `06_DATA_BOUNDARY.md`
3. `05_AI_POLICY_SCHEMA.md`
4. `02_MTK_SPEC.md`
5. Epic-specific acceptance criteria

Ako implementation convenience dođe u konflikt sa specom, spec pobjeđuje.

## Scope rule

Jedan Epic = jedna branch/PR cjelina.

Ne dodavati "korisne" stvari izvan scopea.

Primjeri scope violationa:
- citation manager
- novi AI mode
- skin/theme
- novi fakultet
- source database izvan odobrenog scopea
- referral feature
- dodatni onboarding samo zato što je moguće

## Obavezno prije kodiranja

Agent prvo napiše:
- files koje planira dodati/mijenjati
- acceptance criteria kako ih razumije
- rizike
- non-goals

Tek onda implementira.

## Definition of Done

Svaki Epic:
- build pass
- lint pass
- relevant tests pass
- mobile viewport checked za UI
- nema Product Constitution violationa
- nema Data Boundary violationa
- nema novog unapproved persistent free-text fielda
- nema policy bypassa
- nema customer-facing credits
- nema globalnog readiness %
- docs updated ako se contract promijenio

## Hard rules

Nikad:
- LLM prije server-side policy autha
- trust client capability bez validationa
- raw prompt/output u project state
- mentor user-report overridea clear official DENY
- Lekta finding postane verified bez re-checka
- invent institutional rule
- user-reported status labelira kao externally verified

## Test naming examples

Policy:
- `fpzg_denies_generate_submission_text_for_masters`
- `fpzg_language_review_requires_conditions`
- `mentor_report_cannot_override_official_deny`
- `unknown_policy_never_defaults_to_allow`
- `denied_action_does_not_call_model`

Privacy:
- `project_state_rejects_raw_thesis_text`
- `project_state_rejects_raw_mentor_comment`
- `analytics_rejects_ai_prompt_payload`

Lekta:
- `user_changed_is_not_verified_fixed`
- `only_recheck_can_mark_verified_fixed`

# EPIC 1 CONTRACT — App Shell

## Goal

Napraviti clean novu application shell koja arhitektonski podržava Completion App model bez premature business logike.

## Must include

- Next.js + TypeScript
- mobile-first responsive shell
- navigacijski placeholders: Moj rad, Zadaci, Mentor, Provjera, Dnevnik
- neutralni working branding
- nema chatbot-first homea
- nema credits
- nema progress percentagea
- nema skin/theme featurea
- placeholder hijerarhija za stage, blockers, waiting, Next Best Action
- baseline lint/build/test setup

## Must NOT include

- Stripe
- Anthropic
- real policy logic
- Katedra integration
- Lekta integration
- faculty breadth
- complex auth osim ako shell to stvarno traži
- document upload
- AI chat
- generated sample thesis content

## Acceptance criteria

1. `npm install` succeeds.
2. `npm run build` succeeds.
3. `npm run lint` succeeds.
4. `npm test` postoji i succeeds, makar inicijalni suite bio minimalan.
5. 390px viewport nema horizontal overflow.
6. Desktop layout je koherentan.
7. Home ima jasnu hijerarhiju za stage/blockers/waiting/Next Best Action.
8. Navigation labels odgovaraju specu.
9. Repo sadrži Epic 0 docs.
10. README jasno razlikuje Completion App, Katedru i Lektu.

## PR review question

> Gradi li ovaj shell project-control proizvod ili je već počeo kliziti prema AI-chat proizvodu?

Ako je drugo, Epic nije done.

# Epic 2 preview

Tek nakon mergea Epica 1:
- typed project schema
- authority schema
- task schema
- event schema
- persistence adapter
- tests

Completion Scan UI još nije Epic 2.
