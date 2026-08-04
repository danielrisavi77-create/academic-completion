import { describe, expect, it } from "vitest";
import { productionReadiness } from "@/lib/runtime/readiness";

describe("deployment revision readiness", () => {
  it("prefers the revision baked into the Next build", () => {
    const readiness = productionReadiness({
      ACADEMIC_COMPLETION_BUILD_REVISION: "baked123",
      COMMIT_REF: "runtime456",
    });

    expect(readiness.revision).toBe("baked123");
  });
});
