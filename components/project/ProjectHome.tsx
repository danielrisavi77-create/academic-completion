import type { ProjectIntelligence } from "@/domain/project/intelligence";
import type { AcademicProject, ProjectStage } from "@/domain/project/types";

const stageLabels: Record<ProjectStage, string> = {
  TOPIC_ACTIVE: "Aktivna tema",
  PLANNING: "Planiranje",
  RESEARCH: "Istraživanje",
  DRAFTING: "Pisanje drafta",
  REVISION: "Revizija drafta",
  MENTOR_REVIEW: "Pregled mentora",
  FINAL_CHECK: "Finalna provjera",
  SUBMISSION: "Predaja",
  DEFENSE: "Obrana",
  COMPLETED: "Završeno",
};

function daysUntil(date: string | null, referenceDate: Date) {
  if (!date) return null;
  const target = new Date(`${date}T00:00:00Z`);
  const reference = Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate(),
  );
  return Math.ceil((target.getTime() - reference) / (24 * 60 * 60 * 1000));
}

function authorityLabel(type: string) {
  const labels: Record<string, string> = {
    USER_REPORTED: "Prema tvojoj evidenciji",
    MENTOR_REPORTED: "Mentorov zahtjev",
    OFFICIAL_RULE: "Službeno pravilo",
    SYSTEM_ASSESSED: "Procjena sustava",
    KATEDRA_ASSESSED: "Katedra procjena",
    LEKTA_VERIFIED: "Lekta verificirano",
  };
  return labels[type] ?? type;
}

export function ProjectHome({
  project,
  intelligence,
  referenceDate,
  demo = false,
}: {
  project: AcademicProject;
  intelligence: ProjectIntelligence;
  referenceDate: Date;
  demo?: boolean;
}) {
  const days = daysUntil(project.timeline.targetSubmissionDate, referenceDate);
  const openTasks = project.tasks.filter((task) => task.status !== "DONE" && task.status !== "CANCELLED");
  const nextTaskId = intelligence.nextBestAction?.taskId;

  return (
    <div className="page-frame">
      <header className="topbar project-topbar">
        <div>
          <p className="eyebrow">Moj rad</p>
          <h1>{project.identity.topic ?? (project.identity.workType === "MASTERS_THESIS" ? "Diplomski rad" : "Završni rad")}</h1>
          <p className="project-meta">FPZG · Politologija · {days === null ? "rok nije postavljen" : `${days} dana do cilja`}</p>
        </div>
        {demo ? <span className="alpha-badge">DEMO STATE</span> : null}
      </header>

      <section className="status-grid" aria-label="Sažetak projektnog stanja">
        <article className="status-card">
          <p className="status-label">Faza</p>
          <p className="status-value">{stageLabels[project.stage]}</p>
          <p className="status-detail">Bez globalnog postotka spremnosti.</p>
        </article>
        <article className="status-card">
          <p className="status-label">Blockeri</p>
          <p className="status-value">{intelligence.blockers.length}</p>
          <p className="status-detail">{intelligence.blockers.filter((item) => item.severity === "CRITICAL").length} kritičnih · {intelligence.blockers.filter((item) => item.severity === "HIGH").length} važnih</p>
        </article>
        <article className="status-card">
          <p className="status-label">Čeka se</p>
          <p className="status-value">{intelligence.waitingItems.length}</p>
          <p className="status-detail">Vanjske odluke ne glume tvoje zadatke.</p>
        </article>
      </section>

      <section className="project-next-card" aria-labelledby="project-next-heading">
        <div className="next-number">01</div>
        <div className="project-next-copy">
          <p className="eyebrow">Sljedeći potez</p>
          <h2 id="project-next-heading">{intelligence.nextBestAction?.title ?? "Nema otvorenog prioritetnog koraka"}</h2>
          <p>{intelligence.nextBestAction?.reason ?? "Projekt trenutačno nema actionable task koji engine može sigurno prioritizirati."}</p>
        </div>
        {nextTaskId ? <a className="primary-button button-link" href={`#task-${nextTaskId}`}>Otvori zadatak</a> : null}
      </section>

      {intelligence.blockers.length ? (
        <section className="project-section" aria-labelledby="blockers-heading">
          <div className="project-section-heading"><div><p className="eyebrow">Blockeri</p><h2 id="blockers-heading">Što trenutno koči projekt</h2></div><span>{intelligence.blockers.length}</span></div>
          <div className="project-list">
            {intelligence.blockers.map((blocker) => (
              <article className={`project-list-item project-list-${blocker.severity.toLowerCase()}`} key={blocker.id}>
                <div>
                  <span className="item-kicker">{blocker.severity === "CRITICAL" ? "Kritično" : blocker.severity === "HIGH" ? "Važno" : "Prati"}</span>
                  <h3>{blocker.title}</h3>
                  <p>{blocker.reason}</p>
                </div>
                <span className="authority-pill">{authorityLabel(blocker.authority.type)}</span>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {intelligence.waitingItems.length ? (
        <section className="project-waiting" aria-labelledby="waiting-heading">
          <div><p className="eyebrow">Čeka se</p><h2 id="waiting-heading">Vanjska odluka</h2></div>
          {intelligence.waitingItems.map((item) => <strong key={item.id}>{item.label}</strong>)}
        </section>
      ) : null}

      <section className="project-section" id="zadaci" aria-labelledby="tasks-heading">
        <div className="project-section-heading"><div><p className="eyebrow">Zadaci</p><h2 id="tasks-heading">Otvoreni rad</h2></div><span>{openTasks.length}</span></div>
        <div className="task-stack">
          {openTasks.map((task) => (
            <article className={`task-row${task.id === nextTaskId ? " task-row-next" : ""}`} id={`task-${task.id}`} key={task.id}>
              <div className="task-state-dot" aria-hidden="true" />
              <div className="task-row-copy"><strong>{task.title}</strong><span>{task.status.replaceAll("_", " ")} · {task.priority}</span></div>
              <span className="authority-pill">{authorityLabel(task.authority.type)}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="workspace-grid project-workspace-grid">
        <article className="workspace-panel" id="mentor">
          <div className="panel-heading"><div><p className="eyebrow">Mentor</p><h2>Stanje komunikacije</h2></div><span className="panel-state">{project.mentor.waitingForMentor ? "Čeka se" : "Nije na čekanju"}</span></div>
          <div className="compact-facts"><div><span>Zadnje poslano</span><strong>{project.mentor.lastSentAt ? new Intl.DateTimeFormat("hr-HR", { dateStyle: "medium" }).format(new Date(project.mentor.lastSentAt)) : "Nije evidentirano"}</strong></div><div><span>Verzija</span><strong>{project.mentor.lastSeenVersionLabel ?? "Nije evidentirana"}</strong></div></div>
        </article>

        <article className="workspace-panel" id="provjera">
          <div className="panel-heading"><div><p className="eyebrow">Provjera</p><h2>Dva odvojena signala</h2></div></div>
          <div className="verification-split">
            <div><strong>Katedra</strong><span>Nema sadržajne procjene u ovom demo stateu.</span></div>
            <div><strong>Lekta</strong><span>{project.lekta.lastCheckedAt ? `${project.lekta.openCriticalCount} critical · ${project.lekta.openWarningCount} warning` : "Nema aktualne provjere dokumenta."}</span></div>
          </div>
        </article>

        <article className="workspace-panel" id="dnevnik">
          <div className="panel-heading"><div><p className="eyebrow">Dnevnik</p><h2>Authority ostaje vidljiv</h2></div></div>
          <p className="panel-empty">Mentorovi zahtjevi, sistemske procjene i budući Katedra/Lekta događaji imaju različite authority tipove umjesto jednog “verified” statusa.</p>
        </article>

        <article className="workspace-panel project-policy-card">
          <div className="panel-heading"><div><p className="eyebrow">AI policy</p><h2>{project.policy.rulesetVersion ? "FPZG ruleset učitan" : "Policy nije učitan"}</h2></div></div>
          <div className="compact-facts"><div><span>Generiranje predajnog teksta</span><strong>{project.policy.capabilityDecisions.GENERATE_SUBMISSION_TEXT === "DENY" ? "Nije dopušteno" : "Nije razjašnjeno"}</strong></div><div><span>Jezična provjera</span><strong>{project.policy.capabilityDecisions.LANGUAGE_REVIEW === "ALLOW_WITH_CONDITIONS" ? "Uz uvjete" : "Nije razjašnjeno"}</strong></div></div>
        </article>
      </section>
    </div>
  );
}
