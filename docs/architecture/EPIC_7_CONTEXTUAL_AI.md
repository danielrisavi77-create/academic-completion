# Epic 7 — Contextual AI Execution Contract

## Goal

Create the provider-agnostic execution boundary for contextual AI actions **without exposing an unauthenticated paid-provider endpoint**.

Epic 7 proves the complete pre-provider contract:

`PROJECT TASK -> CAPABILITY MATCH -> TASK STATUS -> POLICY RESOLVER -> CAPABILITY-SCOPED INSTRUCTIONS -> PROVIDER`

If any gate fails, the provider is not called.

## Why there is no public `/api/ai` route yet

The app does not yet have production auth + persistent project ownership.

Exposing a live provider route before that boundary would create:
- uncontrolled API cost;
- project-ownership ambiguity;
- an avoidable abuse surface.

Therefore Epic 7 implements and tests the execution service and provider interface only.

A future server route may call this service only after it can authenticate the user and load an owned project server-side.

## Provider interface

```ts
interface AIProvider {
  execute(request: AIProviderRequest): Promise<AIProviderResponse>;
}
```

The domain service does not know or require Anthropic, OpenAI or another specific vendor.

This keeps model routing/vendor changes separate from academic policy.

## Contextual execution contract

`executeContextualAIAction()` requires:
- an existing project task;
- task belongs to the project;
- task is actionable (`OPEN` or `IN_PROGRESS`);
- task declares an AI capability;
- requested capability exactly matches the task capability;
- non-empty session input within the MTK size limit;
- runtime policy resolver authorization.

Only then is the provider invoked.

## Capability-scoped instructions

Instructions are not a generic "academic writer" system prompt.

Examples:

### QUESTION_COACHING
- ask focused questions;
- preserve active student reasoning;
- do not write submission-ready thesis prose.

### CONTENT_REVIEW
- diagnose reasoning/gaps;
- critique user-written material;
- do not replace the argument with newly authored submission-ready paragraphs.

### LANGUAGE_REVIEW
- improve language/clarity only;
- do not introduce new substantive arguments/findings/conclusions.

### RESEARCH_DISCOVERY
- help with queries/source evaluation;
- do not invent citations, page numbers, bibliographic metadata or source claims.

Policy obligations are appended as explicit execution instructions.

## Audit metadata

The service returns content-free audit metadata:
- event type;
- project ID;
- task ID;
- capability;
- policy rule IDs;
- provider/model ID after success.

It does **not** include:
- user input;
- system prompt text;
- provider output;
- thesis text.

## Failure behavior

### Policy denied/unknown

Returns a typed `DENIED` result and never calls provider.

### Invalid task contract

Throws `AIActionContractError` before provider invocation.

Examples:
- unknown task;
- capability mismatch;
- task has no capability;
- `WAITING_EXTERNAL`, `DONE`, etc.;
- empty/oversized input.

## Explicit non-goals

Epic 7 does not:
- configure Anthropic credentials;
- add a live provider implementation;
- expose a public AI API endpoint;
- persist user input or model output;
- create auth/Supabase ownership;
- create Katedra handoff;
- create pricing/credits/Stripe.

## Required tests

The suite must prove:
- FPZG official generation deny => zero provider calls;
- UNKNOWN capability => zero provider calls;
- authorized contextual task => exactly one provider call;
- task/capability mismatch => zero provider calls;
- non-actionable task => zero provider calls;
- empty/oversized input => zero provider calls;
- content review receives critique-only instructions;
- question coaching receives student-participation instructions;
- audit metadata contains no session input or provider output.

## Next architectural dependency

Before a live AI route is enabled, Academic Completion needs a trustworthy authenticated project-ownership/persistence boundary.

That requirement is now explicit rather than being hidden inside "AI integration" work.
