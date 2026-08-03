# Minimum Testable Product Specification v0.1

## 1. Cilj testa

MTK testira najrizičniju poslovnu hipotezu:

> **Hoće li stvarni student platiti persistent project control i Next Best Action nakon što mu Completion Scan pokaže relevantan problem?**

## 2. Launch ICP

Student koji:
- piše **završni ili diplomski**
- tema mu je aktivna/odobrena
- ima barem dio građe, plan ili draft
- ima stvarni target predaje
- približno je **14–60 dana** od predaje
- ima barem jedan unresolved blocker
- želi završiti vlastiti rad

Tipični triggeri:
- mentor je vratio komentare
- mentor nije vidio aktualnu verziju
- ne zna što sljedeće
- rok se približava
- AI-policy situacija nije jasna
- finalna provjera nije napravljena
- postoje Lekta nalazi

### Anti-ICP
- seminarski
- osoba bez aktivnog rada
- osoba koja želi potpuni ghostwriting
- unsupported faculty
- osoba koja želi samo generalni chatbot
- osoba koja traži zaobilaženje eksplicitnog pravila

## 3. Launch institution

### FPZG first

Razlozi:
- visok fit s text/research workflowom
- aktualna službena AI pravila
- službene procedure završnog/diplomskog javno dostupne
- dovoljno uzak scope za trustworthy prvi ruleset

Novi fakultet se ne dodaje dok FPZG ne prođe komercijalni gate.

## 4. First-user flow

### A — Landing
Hero: **Završi rad bez nagađanja.**

Sub:
> Aplikacija prati što još trebaš riješiti, što tvoj fakultet traži i koji je sljedeći najsigurniji potez. Katedra pomaže sa sadržajem, a Lekta provjerava dokument.

CTA: **Provjeri gdje stoji moj rad**

Trust: FPZG · završni i diplomski · besplatni Scan · bez kartice

### B — Completion Scan
Minimum input:
1. work type
2. FPZG profile
3. target submission date
4. topic status
5. current stage
6. draft/material status
7. last mentor interaction
8. unresolved mentor feedback status/count
9. Lekta-check status
10. AI-use / mentor-consultation status

Target time-to-value: **<3 minute**.

### C — Result
Mora sadržavati:
- work/faculty
- days to target
- stage
- do 3 critical blockers
- secondary open items
- waiting-external
- policy snapshot
- jedan Next Best Action

Nema readiness %.

### D — Free first action
Jedan ograničeni contextual action:
- question coaching
- blocker explanation
- official-rule evidence

### E — Paid offer
Tek nakon demonstrirane vrijednosti.

CTA: **Vodi me do predaje**

Pilot:
- Završni €59,90
- Diplomski €99,90

Target nakon validacije:
- Završni €79,90
- Diplomski €129,90

### F — Paid Project Pass
Otključava:
- persistent state
- ongoing Next Best Action
- task lifecycle
- mentor tracking
- policy-aware AI
- Katedra handoff gdje je dopušten
- Lekta lifecycle
- process/disclosure log
- defense-prep kada je stage relevantan

## 5. Free proizvod

Free:
- Completion Scan
- FPZG rules/policy snapshot
- do 3 glavna blockera
- jedan Next Best Action
- jedan ograničeni assistance flow
- Lekta free check gdje Lekta to omogućuje

Free ne demonstrira "koliko teksta AI može napisati".

## 6. Navigacija

1. **Moj rad**
2. **Zadaci**
3. **Mentor**
4. **Provjera**
5. **Dnevnik**

Chat nije glavni tab. Otvara se iz taska.

## 7. Minimalna blocker taksonomija

- `DEADLINE_RISK`
- `MENTOR_NOT_SEEN_CURRENT_VERSION`
- `MENTOR_FEEDBACK_OPEN`
- `METHODOLOGY_UNRESOLVED`
- `SOURCE_GAP`
- `AI_POLICY_UNRESOLVED`
- `AI_DISCLOSURE_REQUIRED`
- `LEKTA_CHECK_MISSING`
- `LEKTA_CRITICAL_FINDING_OPEN`
- `SUBMISSION_ADMIN_REQUIREMENT_OPEN`
- `WAITING_ON_MENTOR`

## 8. Next Best Action prioritizacija

Početni deterministički red:
1. hard submission/institutional blocker
2. unresolved policy blocker
3. mentor dependency koji blokira napredak
4. critical Lekta finding
5. deadline-critical task
6. substantive open task
7. lower-priority polish

Sustav pokazuje i **zašto** je to sljedeće.

## 9. MTK AI capabilities

Prvo:
- `QUESTION_COACHING`
- `CONTENT_REVIEW`
- `LANGUAGE_REVIEW`
- `RESEARCH_DISCOVERY`

Kasnije po potrebi:
- `STRUCTURE_ASSIST`
- `DEFENSE_PREP`
- `DISCLOSURE_HELP`

Completion App ne implementira generiranje thesis-sekcija kao MTK feature.

## 10. Katedra integration rule

Handoff sadrži samo safe context:
- `projectId`
- `taskId`
- `capability`

Completion App handoffa samo capability koji je autoriziran.

Katedra assessment ne postaje automatski verified project fact.

## 11. Lekta integration rule

Completion App ne ingestira raw DOCX.

Lekta vraća sanitized contract:
- project ID
- analysis ID
- checkedAt
- ruleset/version
- finding IDs
- rule IDs
- severity
- lifecycle status
- sanitized label

Lifecycle:
`OPEN -> USER_CHANGED -> RECHECK_REQUIRED -> VERIFIED_FIXED`

Samo Lekta re-check može dati `VERIFIED_FIXED`.

## 12. Non-goals prije payment proofa

Ne graditi:
- faculty breadth
- seminarski
- full DOCX semantic ingestion
- rich editor
- citation manager
- Zotero replacement
- autonomous research engine
- mentor accounts
- B2B dashboard
- native mobile
- predictive ML
- community
- referral engine
- više projekata
- themes/skins
- multi-model selector
- credits UI
- mass faculty SEO

## 13. Required analytics

- `landing_view`
- `scan_started`
- `faculty_selected`
- `deadline_set`
- `scan_completed`
- `blocker_presented`
- `first_action_clicked`
- `pass_offer_viewed`
- `checkout_started`
- `purchase_completed`
- `paid_action_completed`
- `mentor_task_added`
- `lekta_handoff_started`
- `lekta_recheck_completed`
- `submitted_user_reported`
- `defended_user_reported`
- `support_minutes_logged`

Bez akademskog sadržaja u analytics payloadima.

## 14. Proof stages

### Scan value
30 qualified FPZG Scanova.

Green: barem 15 kaže da je Scan otkrio važnu/novu stvar.

### WTP
50 stvarnih paid offera:
- >=5 kupnji green
- 3–4 warning
- 0–2 red

Na 100 high-quality offera:
- <5% = formalni pivot checkpoint

### Purchase reason
Među prvih 20 kupaca barem 5 dijeli isti dominantni purchase trigger.

### Support economics
Nakon stabilizacije:
- target median <30 min founder supporta / paid project
- >60 min = redesign/hybrid-service checkpoint

### Policy-safe utility
Ako korisnici sustavno napuštaju proizvod kada se generation zabrani, product thesis se revidira prije scalea.

## 15. Faculty expansion gate

Faculty #2 tek nakon:
- >=5 paid FPZG projekata
- ponavljajući purchase reason
- nema ozbiljnog trust/policy incidenta
- policy-safe flow zadržava korisnike
- maintenance effort je održiv
- postoji barem rani second-order acquisition

## 16. Feature freeze

Nakon paid MTK launch-a:
- bug/compliance/analytics fix = da
- novi speculative core feature = ne
dok commercial checkpoint nije završen.
