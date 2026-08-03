# Technical Architecture v0.1

## 1. Repo odluka

Nova aplikacija ide u **novi repo**.

Preporučeni radni naziv repoa: `academic-completion`.

Ne graditi novu aplikaciju unutar Katedra repoa.

## 2. Shared Academic Suite

Dugoročni canonical ID-jevi ostaju:
- account: `auth.users.id`
- academic project: `academic_projects.id`

Nova aplikacija treba biti kompatibilna s postojećim Katedra/Lekta shared-core modelom, ali MTK ne smije potrošiti tjedne na savršeni cross-domain SSO.

Praktični red:
1. novi frontend repo
2. reuse shared auth/project IDs gdje je jednostavno
3. dodaj minimalne nove state contracts
4. očuvaj `academic_project_id`
5. seamless cross-domain session UX kasnije

## 3. Database authority

Ako Academic Suite zadržava postojeći database-authority princip, shared production migrations ostaju u Lekta migration historyju.

Novi repo sadrži TypeScript contracts, adapters, service code i migration docs/pointers, ne konkurentsku canonical DDL povijest bez eksplicitnog ADR-a.

## 4. Proposed domain ownership

Shared:
- `academic_projects`
- auth/account identity
- entitlements povezani s `academic_project_id`

Completion App:
- `completion_project_state`
- `completion_tasks`
- `completion_policy_state`
- `completion_events`
- opcionalno `completion_scan_sessions`

Lekta:
- document checks/findings
- deterministic verification

Katedra:
- content execution / AI usage metadata gdje treba

## 5. Stack

Preporuka:
- Next.js
- TypeScript
- React
- Supabase auth/client gdje odgovara
- mobile-first responsive UI

Ne kopirati legacy Katedra vanilla-engine arhitekturu.

## 6. Suggested modules

```text
app/
  page.tsx
  scan/
  project/[projectId]/
  api/
    scan/
    project/
    tasks/
    policy/
    ai/
    checkout/
    events/

components/
  project/
  scan/
  tasks/
  policy/
  mentor/
  lekta/
  katedra/

domain/
  project/
  policy/
  tasks/
  blockers/
  next-action/
  authority/

lib/
  academic-suite/
  supabase/
  analytics/
  ai/
  security/

docs/
```

Domain logic ne smije biti zakopana u UI komponentama.

## 7. Core services

### Project State Service
- read project
- apply typed events
- compute snapshot
- ownership enforcement

### Blocker Engine
Input: project state, policy state, official rules, Lekta state. Output: typed blockers. MTK: deterministički.

### Next Best Action Engine
Input: blockers, tasks, deadline, waiting states. Output: jedna akcija + reason. MTK: deterministički/rule-based.

### Policy Resolver
Input: project + requested capability. Output: ALLOW / ALLOW_WITH_CONDITIONS / DENY / UNKNOWN + source rule IDs. Mora biti pure/testable.

### AI Execution Service
Traži auth, owned project, task/action, capability i policy decision. Ne prima arbitrary prompt kao authority.

### Handoff adapters
Odvojeno: Katedra adapter i Lekta adapter.

## 8. Guest Scan

Completion Scan mora raditi bez accounta. Guest state je browser/session scoped, short-lived i bez academic free-text persistencea po defaultu.

## 9. Next Best Action v0.1

```text
if hard_submission_blocker:
    return blocker
elif unresolved_policy_blocker:
    return blocker
elif mentor_dependency_blocks_progress:
    return blocker
elif critical_lekta_finding:
    return blocker
elif deadline_critical_task:
    return task
elif substantive_open_task:
    return highest_priority_task
else:
    return next_stage_transition
```

UI pokazuje action i reason.

## 10. AI execution contract

Server sequence:
1. authenticate
2. ownership
3. load project/policy
4. validate task/capability
5. resolve capability
6. deny/fallback gdje treba
7. construct safe model context
8. call model
9. return result
10. write content-free event

Client ne šalje authority `systemPrompt`.

## 11. Katedra handoff

Safe payload uključuje `academicProjectId`, `taskId`, `capability`, `origin`. Ne stavljati raw thesis/mentor/source content u URL. Completion App ne handoffa denied capability.

## 12. Lekta handoff

Completion App šalje project identity, return destination i rules/profile reference gdje treba. Lekta vraća sanitized structured result, ne raw DOCX kroz shared backend.

## 13. Commerce target

`Stripe -> shared entitlement -> academic_project_id -> Completion Project Pass -> Completion App rights + definirana Lekta rights`

Visible credits su zabranjeni.

## 14. Testing

Unit: policy resolver, blocker engine, next-best-action, task transitions, privacy serialization, entitlement checks.

Integration: guest scan/result, scan->persistent project, DENY ne zove model, ALLOW zove adapter, unauthorized access fails, Lekta lifecycle, checkout->entitlement.

E2E: mobile scan, paid project home, mentor task, Lekta roundtrip.

Policy engine ne smije ovisiti samo o browser E2E testovima.

## 15. Epics

1. App shell
2. Project State
3. FPZG rules/policy pack
4. Completion Scan
5. Project Home + blocker + Next Best Action
6. Policy resolver + tests
7. Contextual AI
8. Mentor tasks
9. Lekta adapter
10. Katedra adapter
11. Project Pass
12. Trust/legal/privacy
13. Analytics/pilot console

Nakon Epica 13: feature freeze.
