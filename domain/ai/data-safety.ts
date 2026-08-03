export type AIDataSafetyFindingType =
  | "EMAIL_ADDRESS"
  | "CROATIAN_OIB_LIKE"
  | "CROATIAN_PHONE_LIKE"
  | "API_SECRET_LIKE"
  | "BEARER_TOKEN_LIKE";

export type AIDataSafetyFinding = {
  type: AIDataSafetyFindingType;
  label: string;
};

export type AIDataSafetyResult = {
  safeToSend: boolean;
  findings: AIDataSafetyFinding[];
};

const detectors: Array<{
  type: AIDataSafetyFindingType;
  label: string;
  pattern: RegExp;
}> = [
  {
    type: "EMAIL_ADDRESS",
    label: "email adresa",
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  },
  {
    type: "CROATIAN_OIB_LIKE",
    label: "11-znamenkasti identifikator nalik OIB-u",
    pattern: /(?:^|\D)\d{11}(?:\D|$)/,
  },
  {
    type: "CROATIAN_PHONE_LIKE",
    label: "telefonski broj",
    pattern: /(?:\+385|00385|0)(?:[\s./-]*\d){8,9}\b/,
  },
  {
    type: "API_SECRET_LIKE",
    label: "API ključ ili tajna",
    pattern: /\b(?:sk-ant-|sk-proj-|sk-[A-Za-z0-9_-]{16,}|ANTHROPIC_API_KEY\s*[=:]|SUPABASE_SERVICE_ROLE_KEY\s*[=:])/i,
  },
  {
    type: "BEARER_TOKEN_LIKE",
    label: "Bearer token",
    pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]{16,}\b/i,
  },
];

export function inspectAIInputForDataSafety(input: string): AIDataSafetyResult {
  const findings = detectors
    .filter((detector) => detector.pattern.test(input))
    .map(({ type, label }) => ({ type, label }));

  return {
    safeToSend: findings.length === 0,
    findings,
  };
}

export class AIDataSafetyError extends Error {
  readonly findings: AIDataSafetyFinding[];

  constructor(findings: AIDataSafetyFinding[]) {
    super(
      findings.length
        ? `AI input contains data that should be removed before cloud processing: ${findings
            .map((finding) => finding.label)
            .join(", ")}.`
        : "AI input failed the data-safety gate.",
    );
    this.name = "AIDataSafetyError";
    this.findings = findings;
  }
}

export function assertAIInputDataSafe(input: string): void {
  const result = inspectAIInputForDataSafety(input);
  if (!result.safeToSend) {
    throw new AIDataSafetyError(result.findings);
  }
}
