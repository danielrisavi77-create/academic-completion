import { describe, expect, it } from "vitest";
import { buildPrimaryNavigation, primaryNavigation } from "./navigation";

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

  it("keeps navigation inside the active persisted project", () => {
    const navigation = buildPrimaryNavigation("project-123");

    expect(navigation.map((item) => item.href)).toEqual([
      "/project/project-123",
      "/project/project-123#zadaci",
      "/project/project-123#mentor",
      "/project/project-123#provjera",
      "/project/project-123#dnevnik",
    ]);
  });

  it("uses the project index route when there is no active project", () => {
    expect(buildPrimaryNavigation()[0]?.href).toBe("/project");
  });
});
