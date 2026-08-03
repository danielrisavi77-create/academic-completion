# Epic 9 — First Live Contextual AI Action

## Goal

Prove one real provider-backed Academic Completion action end-to-end without reintroducing a generic chat product or bypassing the academic-policy boundary established in Epics 6–7.

## First live capability

Only `DISCLOSURE_HELP` is enabled at the HTTP boundary in v0.1.

Why:

- the FPZG ruleset currently resolves it as `ALLOW`;
- it works from a short factual description of actual AI usage;
- it does not require sending the thesis body;
- it directly supports the faculty's transparency requirement;
- it is a safer production proof than opening content-generation/review capabilities immediately.

Other capabilities remain implemented in the domain engine but return `CAPABILITY_NOT_LIVE` at the route until they receive their own privacy/UX review.

## Execution chain

```text
permanent Supabase user
  -> owns academic_projects.id
  -> POST /api/projects/:projectId/ai-actions
  -> strict body: { taskId, userInput }
  -> load owned persisted project
  -> capability comes from persisted task, never browser
  -> live-capability allowlist
  -> executeContextualAIAction()
      -> task/actionable validation
      -> Data Safety Gate
      -> runtime policy resolver
      -> DENY/UNKNOWN => zero provider calls
      -> authorized => UsageTrackedAIProvider
          -> atomic completion_ai_reserve()
          -> AnthropicSonnetProvider
          -> completion_ai_finalize()
  -> content-free completion_events audit
  -> output returned to browser only
```

## Provider

Direct HTTP against the Anthropic Messages API:

- endpoint: `POST https://api.anthropic.com/v1/messages`
- API version header: `2023-06-01`
- model: `claude-sonnet-5`
- output ceiling: 1200 tokens
- request timeout: 45 seconds

The browser cannot choose model, provider or capability.

`ANTHROPIC_API_KEY` is server-only.

## Data Safety Gate

Before any provider or usage reservation, deterministic detection blocks obvious:

- email addresses;
- Croatian-phone-like identifiers;
- 11-digit OIB-like identifiers;
- API-key/secret patterns;
- bearer-token patterns.

This is a guardrail, not a claim of perfect PII detection. UI still instructs the user not to paste interviews, personal/confidential data, mentor messages or whole thesis content.

## Persistence boundary

Never persisted by this flow:

- user input;
- provider prompt;
- model output;
- thesis body;
- mentor-message body;
- source passage.

Persisted metadata:

- AI action allowed/denied event;
- project/task/capability;
- policy rule IDs;
- provider/model IDs after execution;
- provider-reported input/output token counts;
- timestamps.

## Spend and abuse guard

Canonical schema is owned by Lekta migrations:

- `0044_completion_ai_usage.sql`
- `0045_completion_ai_rate_reservation.sql`
- `0046_completion_ai_finalize_grant.sql`

Initial pilot ceiling supplied by the app:

- 4 real provider reservations per rolling 10 minutes;
- 12 per rolling 24 hours.

The DB function uses a per-user transaction advisory lock before counting and inserting, preventing parallel requests from all observing the same stale count.

Policy denial happens before the provider wrapper, so DENY/UNKNOWN actions consume neither Anthropic spend nor a usage reservation.

## AI transparency

The UI visibly labels the feature `Katedra AI · pilot` before first interaction.

The response carries machine-readable `generatedByAI: true`, provider/model identifiers and a visible notice that the result is generative AI assistance rather than a mentor, faculty or Lekta decision.

This is a product transparency control and should not be represented as a legal conclusion about complete Article 50 compliance.

## Explicit non-goals

Epic 9 does not add:

- generic chat;
- submission-text generation;
- live content review/language review/question coaching;
- streaming;
- Project Pass/Stripe gating;
- conversation history persistence;
- raw document upload to the AI route.
