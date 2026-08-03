export const primaryNavigation = [
  { id: "work", label: "Moj rad", anchor: "" },
  { id: "tasks", label: "Zadaci", anchor: "#zadaci" },
  { id: "mentor", label: "Mentor", anchor: "#mentor" },
  { id: "review", label: "Provjera", anchor: "#provjera" },
  { id: "log", label: "Dnevnik", anchor: "#dnevnik" },
] as const;

export type NavigationId = (typeof primaryNavigation)[number]["id"];

export function buildPrimaryNavigation(projectId?: string) {
  const base = projectId ? `/project/${encodeURIComponent(projectId)}` : "/project";
  return primaryNavigation.map((item) => ({
    ...item,
    href: `${base}${item.anchor}`,
  }));
}
