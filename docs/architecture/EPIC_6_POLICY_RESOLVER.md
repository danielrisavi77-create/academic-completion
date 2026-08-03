# Epic 6 — Runtime Policy Resolver

## Goal

Epic 6 creates the fail-closed authorization layer that must run **before any future AI provider invocation**.

The resolver answers:

> May Academic Completion invoke this AI capability for this exact project, using this exact current ruleset and project governance state?

It does not answer whether an AI model is technically capable of doing the task.

## Resolver contract

```ts
resolveCapability({ project, capability }): PolicyResolution
```

The result includes:
- underlying policy `decision`;
- `authorized` boolean;
- reason;
- all conditions;
- currently unmet blocking conditions;
- continuing obligations;
- source rule IDs;
- policy basis;
- ruleset ID/version.

## Fail-closed rules

Authorization returns false when:
- faculty/profile is unsupported;
- project does not have the exact current ruleset ID/version;
- stored capability decision no longer matches the current ruleset;
- current policy decision is `DENY`;
- current policy decision is `UNKNOWN`;
- a blocking runtime condition is not satisfied.

`UNKNOWN` never becomes `ALLOW`.

## Official deny cannot be overridden

A user-reported mentor permission cannot override an official `DENY`.

For FPZG:

`GENERATE_SUBMISSION_TEXT = DENY`

therefore remains denied even if:

`mentorConsultation = USER_REPORTED_PERMISSION_GIVEN`.

This is deliberate defense in depth.

## AI governance state

AcademicProject now contains:

```ts
aiGovernance: {
  mentorConsultation,
  disclosureState,
  dataSafetyAcknowledged
}
```

These are structured project-governance fields, not raw mentor correspondence.

Typed events update them:
- `AI_MENTOR_CONSULTATION_REPORTED`
- `AI_DISCLOSURE_STATE_CHANGED`
- `AI_DATA_SAFETY_ACKNOWLEDGED`

## Blocking conditions vs continuing obligations

Not every policy condition is a pre-execution blocker.

### Blocking in Epic 6

`MENTOR_CONSULTATION_REQUIRED`
- action is not authorized until consultation is recorded;
- `USER_REPORTED_RESTRICTED` blocks a conditionally allowed capability.

`PERSONAL_DATA_CAUTION`
- capabilities such as transcription require the product's data-safety acknowledgement before execution.

### Continuing obligations

Examples:
- `DISCLOSURE_REQUIRED`
- `VERIFY_SOURCES`
- `VERIFY_TRANSLATION`
- `VERIFY_TRANSCRIPTION`
- `STUDENT_MAINTAINS_INTELLECTUAL_CONTROL`
- `ACTIVE_STUDENT_PARTICIPATION_REQUIRED`

These remain visible in `obligations` after authorization. Authorization does not mean the obligation has disappeared or been institutionally certified as fulfilled.

A future action workflow must surface/enforce the relevant obligation at the correct point.

## Ruleset freshness

The resolver checks both:
- `project.policy.rulesetId`
- `project.policy.rulesetVersion`

against the current source-backed ruleset.

It also compares the project's stored capability decision with the active rule decision.

Mismatch => `RULESET_NOT_LOADED_OR_STALE` and `authorized=false`.

This prevents an old project snapshot from silently using a superseded permission.

## Explicit non-goals

Epic 6 does not:
- call Anthropic or any other model provider;
- create an AI API route;
- persist AI content;
- implement Katedra handoff;
- decide disclosure sufficiency;
- verify mentor correspondence;
- add another faculty;
- weaken FPZG source rules.

## Required tests

The suite must prove:
- FPZG final/master's generation remains denied;
- mentor permission cannot override official deny;
- conditional language review is blocked before mentor consultation;
- language review can be authorized after consultation while obligations remain visible;
- research discovery keeps source-verification obligation;
- transcription requires data-safety acknowledgement;
- unknown faculty fails closed;
- stale/mismatched ruleset fails closed;
- mentor-reported restriction blocks conditionally allowed actions;
- unknown capabilities remain unauthorized;
- disclosure help can be authorized under its current rule;
- project AI-governance state starts fail-closed and changes only through typed events.

Epic 7 may only invoke a provider through this resolver.
