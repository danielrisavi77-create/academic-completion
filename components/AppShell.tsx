import Link from "next/link";
import type { ReactNode } from "react";
import { primaryNavigation } from "@/domain/navigation/navigation";

type AppShellProps = { children: ReactNode };

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Glavna navigacija">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">A</span>
          <div><p className="brand-name">Academic Completion</p><p className="brand-kicker">radni naziv</p></div>
        </div>
        <nav className="nav-list">
          {primaryNavigation.map((item, index) => (
            <Link className={`nav-item${index === 0 ? " nav-item-active" : ""}`} href={item.href} key={item.id}>
              <span className="nav-dot" aria-hidden="true" />{item.label}
            </Link>
          ))}
        </nav>
        <div className="suite-boundary">
          <p className="eyebrow">Academic Suite</p>
          <p>Katedra radi sa sadržajem.</p><p>Lekta provjerava dokument.</p><p>Ovdje upravljaš projektom.</p>
        </div>
      </aside>
      <main className="main-content">{children}</main>
      <nav className="mobile-nav" aria-label="Glavna navigacija">
        {primaryNavigation.map((item, index) => (
          <Link className={`mobile-nav-item${index === 0 ? " mobile-nav-item-active" : ""}`} href={item.href} key={item.id}>
            <span className="mobile-nav-dot" aria-hidden="true" /><span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
