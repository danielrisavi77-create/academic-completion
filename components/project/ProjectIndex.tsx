import Link from "next/link";
import type { ProjectIndexItem } from "@/domain/project/project-index";

const stageLabels: Record<ProjectIndexItem["stage"], string> = {
  TOPIC_ACTIVE: "Tema",
  PLANNING: "Planiranje",
  RESEARCH: "Istraživanje",
  DRAFTING: "Pisanje",
  REVISION: "Revizija",
  MENTOR_REVIEW: "Kod mentora",
  FINAL_CHECK: "Završna provjera",
  SUBMISSION: "Predaja",
  DEFENSE: "Obrana",
  COMPLETED: "Završeno",
};

const workTypeLabels: Record<ProjectIndexItem["workType"], string> = {
  FINAL_THESIS: "Završni rad",
  MASTERS_THESIS: "Diplomski rad",
};

function formatDate(value: string | null) {
  if (!value) return "Rok nije postavljen";
  return new Intl.DateTimeFormat("hr-HR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("hr-HR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function ProjectIndex({ projects }: { projects: ProjectIndexItem[] }) {
  return (
    <div className="page-frame project-index-page">
      <section className="project-index-hero">
        <div>
          <p className="eyebrow">Academic Completion</p>
          <h1>Moji radovi</h1>
          <p>
            Nastavi tamo gdje si stao. Svaki rad ima vlastiti stage, mentor workflow,
            blockere i sljedeću akciju.
          </p>
        </div>
        <Link className="primary-button" href="/scan">Pokreni novi Completion Scan</Link>
      </section>

      {projects.length ? (
        <section className="project-index-list" aria-label="Spremljeni akademski projekti">
          {projects.map((project) => (
            <Link className="project-index-card" href={`/project/${project.id}`} key={project.id}>
              <div className="project-index-card-main">
                <div className="project-index-card-title-row">
                  <div>
                    <p className="eyebrow">{workTypeLabels[project.workType]}</p>
                    <h2>{stageLabels[project.stage]}</h2>
                  </div>
                  <span className="project-index-open">Nastavi →</span>
                </div>

                <div className="project-index-meta">
                  <span>Rok: {formatDate(project.targetSubmissionDate)}</span>
                  <span>Ažurirano: {formatUpdatedAt(project.updatedAt)}</span>
                </div>
              </div>

              <div className="project-index-state">
                <span className={`project-index-status${project.waitingForMentor ? " is-waiting" : ""}`}>
                  {project.waitingForMentor ? "Čeka se mentor" : "Aktivan projekt"}
                </span>
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <section className="project-index-empty">
          <p className="eyebrow">Još nema spremljenog rada</p>
          <h2>Prvi projekt nastaje iz besplatnog Scana.</h2>
          <p>
            Scan prvo daje rezultat bez registracije. Račun trebaš tek kada želiš spremiti stanje i
            nastaviti rad kroz vrijeme.
          </p>
          <Link className="primary-button" href="/scan">Provjeri gdje stoji moj rad</Link>
        </section>
      )}
    </div>
  );
}
