export const primaryNavigation = [
  { id: "work", label: "Moj rad", href: "/project" },
  { id: "tasks", label: "Zadaci", href: "/project#zadaci" },
  { id: "mentor", label: "Mentor", href: "/project#mentor" },
  { id: "review", label: "Provjera", href: "/project#provjera" },
  { id: "log", label: "Dnevnik", href: "/project#dnevnik" },
] as const;

export type NavigationId = (typeof primaryNavigation)[number]["id"];
