export const primaryNavigation = [
  { id: "work", label: "Moj rad", href: "/" },
  { id: "tasks", label: "Zadaci", href: "/#zadaci" },
  { id: "mentor", label: "Mentor", href: "/#mentor" },
  { id: "review", label: "Provjera", href: "/#provjera" },
  { id: "log", label: "Dnevnik", href: "/#dnevnik" },
] as const;

export type NavigationId = (typeof primaryNavigation)[number]["id"];
