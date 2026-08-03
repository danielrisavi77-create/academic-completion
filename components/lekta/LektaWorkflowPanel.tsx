"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LektaFinding, LektaState } from "@/domain/lekta/types";

const statusLabel: Record<LektaFinding["status"], string> = {
  OPEN: "Otvoreno",
  USER_CHANGED: "Promijenjeno — treba re-check",
  RECHECK_REQUIRED: "Čeka Lekta re-check",
  VERIFIED_FIXED: "Lekta potvrdila ispravak",
};

function formatDate(value: string | null) {
  if (!value) return "Nema provjere";
  return new Intl.DateTimeFormat("hr-HR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function LektaWorkflowPanel({
  projectId,
  lekta,
}: {
  projectId: string;
  lekta: LektaState;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentFindings = lekta.findings.filter(
    (finding) => finding.presentInLatest !== false && finding.status !== "VERIFIED_FIXED",
  );
  const recentlyVerified = lekta.findings
    .filter((finding) => finding.status === "VERIFIED_FIXED")
    .slice(0, 4);
  const needsRecheck = currentFindings.some(
    (finding) => finding.status === "USER_CHANGED" || finding.status === "RECHECK_REQUIRED",
  );

  async function markChanged(findingId: string) {
    setBusy(`finding:${findingId}`);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/lekta-findings`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "MARK_CHANGED", issueKey: findingId }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Promjena nije uspjela.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Promjena nije uspjela.");
    } finally {
      setBusy(null);
    }
  }

  async function openLekta() {
    const mode = needsRecheck ? "RECHECK" : "CHECK";
    setBusy("handoff");
    setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/lekta-handoff`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || typeof body?.url !== "string") {
        throw new Error(body?.error || "Lektu trenutačno nije moguće otvoriti.");
      }
      window.location.assign(body.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Lektu trenutačno nije moguće otvoriti.");
      setBusy(null);
    }
  }

  return (
    <section className="lekta-workflow-card" aria-labelledby="lekta-workflow-heading">
      <div className="lekta-workflow-heading">
        <div>
          <p className="eyebrow">Lekta · document authority</p>
          <h2 id="lekta-workflow-heading">Provjera stvarnog dokumenta</h2>
          <p>
            Completion vodi rješavanje nalaza. Samo novi Lekta check može potvrditi da je
            tehnički nalaz stvarno nestao iz dokumenta.
          </p>
        </div>
        <div className="lekta-check-summary" aria-label="Zadnja Lekta provjera">
          <strong>{lekta.score == null ? "—" : `${lekta.score}/100`}</strong>
          <span>{formatDate(lekta.lastCheckedAt)}</span>
        </div>
      </div>

      <div className="lekta-count-strip">
        <span><strong>{lekta.openCriticalCount}</strong> kritičnih</span>
        <span><strong>{lekta.openWarningCount}</strong> upozorenja</span>
        <span><strong>{currentFindings.length}</strong> aktualnih nalaza</span>
      </div>

      {currentFindings.length ? (
        <div className="lekta-finding-list">
          {currentFindings.map((finding) => (
            <article className="lekta-finding-row" key={finding.findingId}>
              <div>
                <span className={`lekta-severity lekta-severity-${finding.severity.toLowerCase()}`}>
                  {finding.severity === "CRITICAL"
                    ? "Kritično"
                    : finding.severity === "WARNING"
                      ? "Upozorenje"
                      : "Info"}
                </span>
                <h3>{finding.label}</h3>
                <p>{statusLabel[finding.status]}</p>
              </div>
              {finding.status === "OPEN" ? (
                <button
                  className="secondary-button"
                  disabled={busy !== null}
                  onClick={() => void markChanged(finding.findingId)}
                  type="button"
                >
                  {busy === `finding:${finding.findingId}` ? "Spremam…" : "Promijenio sam"}
                </button>
              ) : null}
            </article>
          ))}
        </div>
      ) : lekta.lastCheckedAt ? (
        <p className="lekta-empty">Aktualni Lekta check nema otvorenih nalaza u ovom workflowu.</p>
      ) : (
        <p className="lekta-empty">Ovaj projekt još nema spremljenu Lekta provjeru dokumenta.</p>
      )}

      {recentlyVerified.length ? (
        <details className="lekta-verified-history">
          <summary>Prikaži zadnje Lekta-potvrđene ispravke ({recentlyVerified.length})</summary>
          <ul>
            {recentlyVerified.map((finding) => (
              <li key={finding.findingId}>{finding.label}</li>
            ))}
          </ul>
        </details>
      ) : null}

      <div className="lekta-workflow-actions">
        <div>
          <strong>
            {needsRecheck
              ? "Promjene su evidentirane. Potrebna je nova provjera dokumenta."
              : "“Promijenio sam” nije potvrda ispravnosti."}
          </strong>
          <span>
            {needsRecheck
              ? "Pokretanje re-checka označit će promijenjene nalaze kao RECHECK_REQUIRED."
              : "Lekta će ponovno analizirati lokalni DOCX i vratiti samo sanitizirane nalaze."}
          </span>
        </div>
        <button className="primary-button" disabled={busy !== null} onClick={() => void openLekta()} type="button">
          {busy === "handoff"
            ? "Otvaram Lektu…"
            : needsRecheck
              ? "Pokreni Lekta re-check"
              : lekta.lastCheckedAt
                ? "Otvori Lektu"
                : "Pokreni Lekta Check"}
        </button>
      </div>

      {error ? <p className="lekta-workflow-error" role="alert">{error}</p> : null}
    </section>
  );
}
