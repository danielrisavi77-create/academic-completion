"use client";

import { useState } from "react";

type AIActionResponse = {
  status?: "COMPLETED" | "DENIED";
  text?: string;
  error?: string;
  notice?: string;
  findings?: string[];
};

export function DisclosureAIAction({
  projectId,
  taskId,
  taskTitle,
}: {
  projectId: string;
  taskId: string;
  taskTitle: string;
}) {
  const [userInput, setUserInput] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function runAction() {
    const normalized = userInput.trim();
    if (!normalized || pending) return;

    setPending(true);
    setError(null);
    setOutput(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/ai-actions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ taskId, userInput: normalized }),
      });
      const payload = (await response.json()) as AIActionResponse;

      if (response.status === 401) {
        window.location.assign(
          `/prijava?next=${encodeURIComponent(`/project/${projectId}#ai-disclosure-action`)}`,
        );
        return;
      }

      if (!response.ok || payload.status !== "COMPLETED" || !payload.text) {
        const findingSuffix = payload.findings?.length
          ? ` Ukloni: ${payload.findings.join(", ")}.`
          : "";
        setError(`${payload.error ?? "AI radnju nije moguće izvršiti."}${findingSuffix}`);
        return;
      }

      setOutput(payload.text);
      setNotice(
        payload.notice ??
          "Ovo je generativna AI pomoć, ne odluka mentora, Fakulteta ili Lekte.",
      );
    } catch {
      setError("Mrežna greška. Pokušaj ponovno.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="workspace-panel ai-action-panel" id="ai-disclosure-action" aria-labelledby="ai-disclosure-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Katedra AI · pilot</p>
          <h2 id="ai-disclosure-heading">{taskTitle}</h2>
        </div>
        <span className="panel-state">AI pomoć</span>
      </div>

      <p className="panel-empty">
        Ukratko opiši samo stvarnu uporabu AI-ja koju želiš evidentirati. Ne lijepi cijeli rad,
        mentorove poruke, osobne podatke, intervjue ni povjerljive informacije.
      </p>

      <label className="ai-action-label" htmlFor="ai-disclosure-input">
        Što si stvarno radio uz AI?
      </label>
      <textarea
        className="ai-action-textarea"
        id="ai-disclosure-input"
        maxLength={12_000}
        onChange={(event) => setUserInput(event.target.value)}
        placeholder="Primjer: koristio sam AI za prijedlog ključnih riječi za pretragu literature i jezičnu provjeru vlastitog teksta. Izvore sam zatim provjerio samostalno."
        rows={6}
        value={userInput}
      />

      <div className="ai-action-controls">
        <button
          className="primary-button"
          disabled={pending || !userInput.trim()}
          onClick={runAction}
          type="button"
        >
          {pending ? "Katedra AI radi…" : "Složi transparentnu evidenciju"}
        </button>
        <span>{userInput.length.toLocaleString("hr-HR")} / 12.000</span>
      </div>

      <p className="ai-data-note">
        Completion ne sprema ovaj unos ni generirani odgovor u projektnu bazu. Za generiranje se
        sadržaj ove radnje šalje Anthropic API-ju; u bazi ostaju samo content-free usage i audit metapodaci.
      </p>

      {error ? <p className="ai-action-error" role="alert">{error}</p> : null}

      {output ? (
        <div className="ai-action-result" aria-live="polite">
          <p className="eyebrow">Katedra AI rezultat</p>
          <div>{output}</div>
          {notice ? <p className="ai-result-notice">{notice}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
