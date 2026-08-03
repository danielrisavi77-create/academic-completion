# AI Policy Schema v0.1

## Objective

Policy layer prevodi različite fakultetske smjernice u normaliziranu odluku za jedan AI capability.

Ne odgovara na pitanje "je li nešto univerzalno legalno".

Odgovara:

> **Smije li Completion App prema aktivnom verificiranom project policyju izvršiti ovaj capability?**

## Capabilities

```ts
type AICapability =
  | "RESEARCH_DISCOVERY"
  | "QUESTION_COACHING"
  | "STRUCTURE_ASSIST"
  | "LANGUAGE_REVIEW"
  | "CONTENT_REVIEW"
  | "PARAPHRASE"
  | "GENERATE_SUBMISSION_TEXT"
  | "DEFENSE_PREP"
  | "DISCLOSURE_HELP"
  | "TRANSCRIPTION"
  | "TRANSLATION";
```

## Decision

```ts
type PolicyDecision =
  | "ALLOW"
  | "ALLOW_WITH_CONDITIONS"
  | "DENY"
  | "UNKNOWN";
```

- `UNKNOWN` nikad ne postaje silent `ALLOW`.
- `DENY` se ne može zaobići frontend stateom.
- `ALLOW_WITH_CONDITIONS` mora imati machine-readable uvjete.

## Academic policy rule

```ts
type AcademicPolicyRule = {
  id: string;
  institutionId: string;
  facultyId: string;
  profileId: string;
  workTypes: Array<"FINAL_THESIS" | "MASTERS_THESIS">;
  capability: AICapability;
  decision: PolicyDecision;
  conditions?: PolicyCondition[];
  source: {
    title: string;
    officialUrl: string;
    sourceDate?: string;
    effectiveDate?: string;
    verifiedAt: string;
    locator?: string;
  };
  interpretation: string;
  confidence: "VERIFIED" | "HIGH" | "MEDIUM";
  version: string;
};
```

## Conditions

```ts
type PolicyCondition =
  | { type: "VERIFY_SOURCES" }
  | { type: "STUDENT_MAINTAINS_INTELLECTUAL_CONTROL" }
  | { type: "DISCLOSURE_REQUIRED" }
  | { type: "MENTOR_CONSULTATION_REQUIRED" }
  | { type: "PERSONAL_DATA_CAUTION" }
  | { type: "VERIFY_TRANSLATION" }
  | { type: "VERIFY_TRANSCRIPTION" }
  | { type: "ACTIVE_STUDENT_PARTICIPATION_REQUIRED" };
```

## Source hierarchy

Preferirati:
1. official institution/faculty rule
2. official work-type/program rule
3. official course/task rule
4. documented mentor permission samo gdje viši rule dopušta diskreciju
5. inače `UNKNOWN`

Mentor user-report ne smije nadjačati jasan higher-level `DENY` osim ako službeno pravilo eksplicitno dopušta iznimku.

# FPZG policy projection v0.1

## Official source

**Smjernice za uporabu generativne umjetne inteligencije u nastavi i izradi studentskih radova**  
Fakultet političkih znanosti Sveučilišta u Zagrebu  
Donesene: **21. svibnja 2026.**

Official source URL: https://www.fpzg.unizg.hr/_download/repository/Smjernice%20za%20uporabu%20generativne%20umjetne%20inteligencije%20u%20nastavi%20i%20izradi%20studentskih%20radova_21.5.2026%5B1%5D.pdf

Production ruleset mora pinati službeni source artifact/version i datum verifikacije.

## Relevantna službena načela za MTK

Smjernice navode kao primjerenu uporabu, među ostalim:
- formatiranje vlastitih pisanih radova
- lektoriranje i jezičnu provjeru vlastitih radova
- pronalaženje znanstvene/stručne literature uz obveznu provjeru relevantnosti i autentičnosti
- pronalaženje informacija/izvora uz provjeru
- transkripciju uz provjeru točnosti i zaštitu osobnih podataka
- prijevod uz provjeru značenja i terminologije

Konačni sadržaj mora proizlaziti iz individualnog promišljanja i rada studenta, uz zadržavanje intelektualne kontrole.

Smjernice kao neprimjerenu uporabu navode **generiranje dijelova ili cijelih seminarskih, završnih ili diplomskih radova**.

Za studentske radove zahtijeva se transparentno evidentiranje korištenja GenAI-ja, a za završne/diplomske smjernice upućuju studente da se prije korištenja GenAI-ja konzultiraju s mentorom.

## Initial mapping

### `LANGUAGE_REVIEW`
Decision: `ALLOW_WITH_CONDITIONS`

Conditions:
- `STUDENT_MAINTAINS_INTELLECTUAL_CONTROL`

Dopušten je review/lektoriranje user-written teksta. Workflow se ne smije potajno pretvoriti u generiranje novih akademskih argumenata.

### `RESEARCH_DISCOVERY`
Decision: `ALLOW_WITH_CONDITIONS`

Conditions:
- `VERIFY_SOURCES`
- `STUDENT_MAINTAINS_INTELLECTUAL_CONTROL`

### `TRANSLATION`
Decision: `ALLOW_WITH_CONDITIONS`

Conditions:
- `VERIFY_TRANSLATION`
- `STUDENT_MAINTAINS_INTELLECTUAL_CONTROL`

### `TRANSCRIPTION`
Decision: `ALLOW_WITH_CONDITIONS`

Conditions:
- `VERIFY_TRANSCRIPTION`
- `PERSONAL_DATA_CAUTION`

### `GENERATE_SUBMISSION_TEXT`
Decision: `DENY`

Za MTK završne/diplomske blokira generiranje teksta namijenjenog direktnom uvrštavanju u rad kao studentski authored submission content.

### `PARAPHRASE`
Decision: `UNKNOWN` po defaultu.

Generic paraphrasing se ne smatra automatski dopuštenim.

### `QUESTION_COACHING`
Decision: `ALLOW_WITH_CONDITIONS`

Conditions:
- `ACTIVE_STUDENT_PARTICIPATION_REQUIRED`
- `STUDENT_MAINTAINS_INTELLECTUAL_CONTROL`

Model smije postavljati strukturirana pitanja i kritizirati odgovore, ali ne pretvoriti flow u gotov thesis tekst za predaju.

### `STRUCTURE_ASSIST`
Decision: `UNKNOWN` u konzervativnom MTK defaultu dok se interpretacija ne verificira.

### `CONTENT_REVIEW`
Decision: `ALLOW_WITH_CONDITIONS` samo za critique/review user-written materijala bez isporuke zamjenskih argumenata/zaključaka.

Condition:
- `STUDENT_MAINTAINS_INTELLECTUAL_CONTROL`

### `DISCLOSURE_HELP`
Decision: `ALLOW`

Aplikacija može strukturirati disclosure iz stvarnih usage eventova, ali ne smije fabricirati usage history.

### `DEFENSE_PREP`
Decision: `UNKNOWN` u početnom MTK policyju dok se konkretan workflow ne pregleda.

## Mentor AI consultation

```ts
type MentorAIConsultationState =
  | "NOT_ASKED"
  | "USER_REPORTED_CONSULTED"
  | "USER_REPORTED_PERMISSION_GIVEN"
  | "USER_REPORTED_RESTRICTED"
  | "UNKNOWN";
```

Ovo polje samo po sebi ne nadjačava policy decision.

## Disclosure state

```ts
type AIDisclosureState =
  | "NOT_STARTED"
  | "USAGE_EVENTS_EXIST"
  | "DRAFT_READY"
  | "USER_REPORTED_INCLUDED";
```

## Server authorization API

```ts
resolveCapability({ project, capability }): {
  decision: PolicyDecision;
  conditions: PolicyCondition[];
  sourceRuleIds: string[];
  explanationKey: string;
}
```

AI route mora pozvati resolver prije modela.

## DENY behavior

Kod `DENY`:
- model se ne poziva za zabranjeni action
- piše se content-free `AI_ACTION_DENIED`
- UI pokazuje source-backed razlog
- nudi nearest allowed flow

Primjer: `GENERATE_SUBMISSION_TEXT` DENY -> `QUESTION_COACHING`

## UNKNOWN behavior

Kod `UNKNOWN`:
- ne pretpostavljaj dopuštenje
- ponudi safe process/coaching
- pokaži službeni source
- opcionalno omogući "zatraži verifikaciju policyja"

## Required tests

- FPZG final + `GENERATE_SUBMISSION_TEXT` => DENY
- FPZG masters + `GENERATE_SUBMISSION_TEXT` => DENY
- FPZG + `LANGUAGE_REVIEW` => conditional allow
- FPZG + `RESEARCH_DISCOVERY` => conditional allow
- unknown faculty + risky generation => UNKNOWN
- mentor report ne mijenja clear official DENY u ALLOW
- client tampering ne bypassa server resolver
- DENY => zero model invocation

Policy test suite je launch blocker.
