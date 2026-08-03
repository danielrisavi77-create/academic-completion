import { describe, expect, it } from "vitest";
import { primaryNavigation } from "./navigation";

describe("primaryNavigation", () => {
  it("keeps the canonical MTK navigation order", () => {
    expect(primaryNavigation.map((item) => item.label)).toEqual([
      "Moj rad",
      "Zadaci",
      "Mentor",
      "Provjera",
      "Dnevnik",
    ]);
  });

  it("does not expose chat as a primary navigation destination", () => {
    expect(primaryNavigation.some((item) => /chat|razgovor/i.test(item.label))).toBe(false);
  });
});
