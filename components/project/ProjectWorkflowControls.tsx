"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ProjectTask, TaskStatus } from "@/domain/tasks/task";

type WorkflowResponse = {
  error?: string;
};

function taskActions(status: TaskStatus) {
  if (status === "CANCELLED") return [] as const;
  if (status === "DONE") {
    return [{ status: "OPEN" as const, label: "Ponovno otvori" }];
  }
  if (status === "IN_PROGRESS") {
    return [
      { status: "OPEN" as const, label: "Vrati na otvoreno" },
      { status: "DONE" as const, label: "Označi riješenim" },
    ];
  }
  return [
    { status: "IN_PROGRESS" as const, label: "Započni" },
    { status: "DONE" as const, label: "Označi riješenim" },
  ];
}

export function ProjectWorkflowControls({
  projectId,
  tasks,
  mentorWaiting,
  mentorVersionLabel,
}: {
  projectId: string;
  tasks: ProjectTask[];
  mentorWaiting: boolean;
  mentorVersionLabel: string | null;
}) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [versionLabel, setVersionLabel] = useState(mentorVersionLabel ?? "");
  const [error, setError] = useState<string | null>(null);

  async function mutateTask(taskId: string, status: "OPEN" | "IN_PROGRESS" | "DONE") {
    const key = `task:${taskId}:${status}`;
    setPendingKey(key);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = (await response.json()) as WorkflowResponse;
      if (!response.ok) {
        setError(payload.error ?? "Status zadatka nije moguće promijeniti.");
        return;
      }
      router.refresh();
    } catch {
      setError("Mrežna greška pri promjeni zadatka.");
    } finally {
      setPendingKey(null);
    }
  }

  async function mentorAction(action: "SUBMITTED" | "RESPONDED") {
    const key = `mentor:${action}`;
    setPendingKey(key);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/mentor-workflow`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          action === "SUBMITTED"
            ? { action, versionLabel: versionLabel.trim() || null }
            : { action },
        ),
      });
      const payload = (await response.json()) as WorkflowResponse;
      if (!response.ok) {
        setError(payload.error ?? "Mentor workflow nije moguće promijeniti.");
        return;
      }
      router.refresh();
    } catch {
      setError("Mrežna greška pri promjeni mentor workflowa.");
    } finally {
      setPendingKey(null);
    }
  }

  const visibleTasks = tasks.filter((task) => task.status !== "CANCELLED");

  return (
    <section className="project-section workflow-control-section" aria-labelledby="workflow-controls-heading">
      <div className="project-section-heading">
        <div>
          <p className="eyebrow">Kontrole projekta</p>
          <h2 id="workflow-controls-heading">Ažuriraj samo ono što se stvarno dogodilo</h2>
        </div>
      </div>

      {error ? <p className="workflow-error" role="alert">{error}</p> : null}

      <div className="workflow-control-grid">
        <div>
          <h3>Zadaci</h3>
          <div className="workflow-task-list">
            {visibleTasks.length ? visibleTasks.map((task) => (
              <article className="workflow-task" key={task.id}>
                <div>
                  <strong>{task.title}</strong>
                  <span>{task.status.replaceAll("_", " ")} · {task.priority}</span>
                </div>
                <div className="workflow-task-actions">
                  {taskActions(task.status).map((action) => {
                    const key = `task:${task.id}:${action.status}`;
                    return (
                      <button
                        className="secondary-button"
                        disabled={pendingKey !== null}
                        key={action.status}
                        onClick={() => mutateTask(task.id, action.status)}
                        type="button"
                      >
                        {pendingKey === key ? "Spremam…" : action.label}
                      </button>
                    );
                  })}
                </div>
              </article>
            )) : <p className="panel-empty">Nema zadataka za ručno ažuriranje.</p>}
          </div>
        </div>

        <div className="mentor-control-panel">
          <h3>Mentor</h3>
          <p className="panel-empty">
            Evidentira se samo status komunikacije i kratka oznaka verzije — ne sadržaj mentorove poruke.
          </p>

          <label className="workflow-label" htmlFor="mentor-version-label">Oznaka verzije (opcionalno)</label>
          <input
            className="workflow-input"
            id="mentor-version-label"
            maxLength={80}
            onChange={(event) => setVersionLabel(event.target.value.replace(/[\n\r\t]/g, " "))}
            placeholder="npr. v4 ili draft 03-08"
            value={versionLabel}
          />

          <div className="workflow-mentor-actions">
            <button
              className="primary-button"
              disabled={pendingKey !== null}
              onClick={() => mentorAction("SUBMITTED")}
              type="button"
            >
              {pendingKey === "mentor:SUBMITTED" ? "Spremam…" : "Evidentiraj da je verzija poslana"}
            </button>

            {mentorWaiting ? (
              <button
                className="secondary-button"
                disabled={pendingKey !== null}
                onClick={() => mentorAction("RESPONDED")}
                type="button"
              >
                {pendingKey === "mentor:RESPONDED" ? "Spremam…" : "Mentor je odgovorio"}
              </button>
            ) : null}
          </div>

          <p className="workflow-current-state">
            Trenutačno: {mentorWaiting ? "čeka se odgovor mentora" : "projekt nije označen kao na čekanju"}.
          </p>
        </div>
      </div>
    </section>
  );
}
