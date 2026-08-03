import { AppShell } from "@/components/AppShell";

const statusCards = [
  { label: "Faza", value: "Nije postavljeno", detail: "Completion Scan određuje početnu fazu." },
  { label: "Kritični blockeri", value: "—", detail: "Nema projektnog stanja." },
  { label: "Čeka se", value: "—", detail: "Mentor i vanjske odluke žive odvojeno." },
];

export default function Home() {
  return (
    <AppShell>
      <div className="page-frame">
        <header className="topbar"><div><p className="eyebrow">Moj rad</p><h1>Projekt pod kontrolom.</h1></div><span className="alpha-badge">EPIC 1 · SHELL</span></header>
        <section className="empty-project-card" aria-labelledby="empty-project-title">
          <div className="empty-project-copy"><p className="eyebrow">Početno stanje</p><h2 id="empty-project-title">Još nema aktivnog akademskog projekta.</h2><p>Sljedeći Epic uvodi strukturirano project state. Completion Scan dolazi tek nakon njega; ovaj shell namjerno ne glumi podatke koje još nemamo.</p></div>
          <button className="primary-button" disabled type="button">Completion Scan dolazi u Epicu 4</button>
        </section>
        <section className="status-grid" aria-label="Sažetak projektnog stanja">{statusCards.map((card) => <article className="status-card" key={card.label}><p className="status-label">{card.label}</p><p className="status-value">{card.value}</p><p className="status-detail">{card.detail}</p></article>)}</section>
        <section className="next-action-card" aria-labelledby="next-action-title"><div className="next-action-icon" aria-hidden="true">→</div><div className="next-action-copy"><p className="eyebrow">Sljedeće</p><h2 id="next-action-title">Next Best Action ima najviši prioritet u sučelju.</h2><p>Kada postoji stvarni projekt, ovdje se prikazuje samo jedna primarna akcija i razlog zašto je upravo ona sljedeća.</p></div><button className="secondary-button" disabled type="button">Nema aktivne akcije</button></section>
        <section className="workspace-grid">
          <article className="workspace-panel" id="zadaci"><div className="panel-heading"><div><p className="eyebrow">Zadaci</p><h2>Otvoreno i riješeno</h2></div><span className="panel-count">0</span></div><p className="panel-empty">Task lifecycle dolazi s typed Project Stateom.</p></article>
          <article className="workspace-panel" id="mentor"><div className="panel-heading"><div><p className="eyebrow">Mentor</p><h2>Odvojeno od tvoje akcije</h2></div><span className="panel-state">Nema podataka</span></div><p className="panel-empty">Budući state razlikuje ono što radiš ti od onoga što čeka vanjsku odluku.</p></article>
          <article className="workspace-panel" id="provjera"><div className="panel-heading"><div><p className="eyebrow">Provjera</p><h2>Katedra ≠ Lekta</h2></div></div><div className="verification-split"><div><strong>Katedra</strong><span>Sadržajna pomoć i procjena</span></div><div><strong>Lekta</strong><span>Deterministička provjera dokumenta</span></div></div></article>
          <article className="workspace-panel" id="dnevnik"><div className="panel-heading"><div><p className="eyebrow">Dnevnik</p><h2>Proces bez arhive teksta</h2></div></div><p className="panel-empty">Dnevnik će spremati strukturirane događaje, ne thesis body, mentorove mailove ili AI transkripte.</p></article>
        </section>
      </div>
    </AppShell>
  );
}
