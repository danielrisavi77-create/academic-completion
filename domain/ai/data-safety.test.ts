import { describe, expect, it } from "vitest";
import {
  AIDataSafetyError,
  assertAIInputDataSafe,
  inspectAIInputForDataSafety,
} from "@/domain/ai/data-safety";

describe("AI data safety gate", () => {
  it("allows ordinary academic process context", () => {
    const result = inspectAIInputForDataSafety(
      "Koristio sam generativni AI za pronalaženje ključnih riječi i jezičnu provjeru vlastitog teksta.",
    );

    expect(result.safeToSend).toBe(true);
    expect(result.findings).toEqual([]);
  });

  it("blocks obvious email, phone and OIB-like identifiers", () => {
    const result = inspectAIInputForDataSafety(
      "Kontakt je student@example.com, broj +385 91 234 5678, a identifikator 12345678901.",
    );

    expect(result.safeToSend).toBe(false);
    expect(result.findings.map((item) => item.type)).toEqual(
      expect.arrayContaining(["EMAIL_ADDRESS", "CROATIAN_PHONE_LIKE", "CROATIAN_OIB_LIKE"]),
    );
  });

  it("blocks API secrets and bearer tokens", () => {
    const result = inspectAIInputForDataSafety(
      "ANTHROPIC_API_KEY=secret-value Bearer abcdefghijklmnopqrstuvwxyz123456",
    );

    expect(result.safeToSend).toBe(false);
    expect(result.findings.map((item) => item.type)).toEqual(
      expect.arrayContaining(["API_SECRET_LIKE", "BEARER_TOKEN_LIKE"]),
    );
  });

  it("throws a typed error before cloud processing", () => {
    expect(() => assertAIInputDataSafe("Piši mi na osoba@primjer.hr")).toThrow(AIDataSafetyError);
  });
});
