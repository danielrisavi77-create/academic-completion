import { AppShell } from "@/components/AppShell";

const statusCards = [
  { label: "Faza", value: "Nije postavljeno", detail: "Completion Scan određuje početnu fazu." },
  { label: "Kritični blockeri", value: "—", detail: "Nema aktivnog persistent projekta." },
  { label: "Čeka se", value: "—", detail: "Mentor i vanjske odluke ostaju odvojeni od tvojih zadataka." },
];

export default function ProjectPage() {
  return (
    <AppShell>
      <div className="page-frame">
        <header className="topbar">
          <div><p className="eyebrow">Moj rad</p><h1>Projekt pod kontrolom.</h1></div>
          <span className="alpha-badge">PROJECT SHELL</span>
        </header>
        <section className="empty-project-card" aria-labelledby="empty-project-title">
          <div className="empty-project-copy">
            <p className="eyebrow">Početno stanje</p>
            <h2 id="empty-project-title">Još nema aktivnog persistent projekta.</h2>
            <p>Completion Scan sada postoji kao guest dijagnostika. Pretvaranje Scana u pravi projekt dolazi tek nakon što blocker i Next Best Action engine budu spremni.</p>
          </div>
          <a className="primary-button button-link" href="/scan">Napravi Completion Scan</a>
        </section>
        <section className="status-grid" aria-label="Sažetak projektnog stanja">
          {statusCards.map((card) => (
            <article className="status-card" key={card.label}>
              <p className="status-label">{card.label}</p>
              <p className="status-value">{card.value}</p>
              <p className="status-detail">{card.detail}</p>
            </article>
          ))}
        </section>
        <section className="next-action-card" aria-labelledby="next-action-title">
          <div className="next-action-icon" aria-hidden="true">→</div>
          <div className="next-action-copy">
            <p className="eyebrow">Sljedeće</p>
            <h2 id="next-action-title">Next Best Action ostaje centralni dio projektnog pogleda.</h2>
            <p>Epic 5 povezuje typed project state, blockere i službena pravila u stvarni projektni prioritet.</p>
          </div>
          <a className="secondary-button button-link" href="/scan">Otvori Scan</a>
        </section>
        <section className="workspace-grid">
          <article className="workspace-panel" id="zadaci"><div className="panel-heading"><div><p className="eyebrow">Zadaci</p><h2>Otvoreno i riješeno</h2></div><span className="panel-count">0</span></div><p className="panel-empty">Typed task lifecycle je spreman; persistent project adapter dolazi kasnije.</p></article>
          <article className="workspace-panel" id="mentor"><div className="panel-heading"><div><p className="eyebrow">Mentor</p><h2>Odvojeno od tvoje akcije</h2></div><span className="panel-state">Nema podataka</span></div><p className="panel-empty">User-reported mentor state nikad se neće prikazati kao fakultetska potvrda.</p></article>
          <article className="workspace-panel" id="provjera"><div className="panel-heading"><div><p className="eyebrow">Provjera</p><h2>Katedra ≠ Lekta</h2></div></div><div className="verification-split"><div><strong>Katedra</strong><span>Sadržajna pomoć i procjena</span></div><div><strong>Lekta</strong><span>Deterministička provjera dokumenta</span></div></div></article>
          <article className="workspace-panel" id="dnevnik"><div className="panel-heading"><div><p className="eyebrow">Dnevnik</p><h2>Proces bez arhive teksta</h2></div></div><p className="panel-empty">Dnevnik će spremati strukturirane događaje, ne thesis body, mentorove mailove ili AI transkripte.</p></article>
        </section>
      </div>
    </AppShell>
  );
}
