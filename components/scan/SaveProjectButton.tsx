"use client";

import { useState } from "react";
import type { ScanInput } from "@/domain/scan/types";

const STORAGE_KEY = "academic-completion:scan-draft";

export function SaveProjectButton({ scanInput }: { scanInput: ScanInput }) {
  const [state, setState] = useState<"IDLE" | "SAVING" | "ERROR">("IDLE");

  async function save() {
    setState("SAVING");

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(scanInput),
      });

      if (response.status === 401) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(scanInput));
        window.location.assign(`/prijava?next=${encodeURIComponent("/scan?resume=1")}`);
        return;
      }

      if (!response.ok) {
        setState("ERROR");
        return;
      }

      const payload = (await response.json()) as { projectId?: string };
      if (!payload.projectId) {
        setState("ERROR");
        return;
      }

      sessionStorage.removeItem(STORAGE_KEY);
      window.location.assign(`/project/${payload.projectId}`);
    } catch {
      setState("ERROR");
    }
  }

  return (
    <div className="save-project-control">
      <button className="primary-button" disabled={state === "SAVING"} onClick={save} type="button">
        {state === "SAVING" ? "Spremam…" : "Spremi kao moj projekt"}
      </button>
      {state === "ERROR" ? (
        <span role="alert">Projekt se nije uspio spremiti. Pokušaj ponovno.</span>
      ) : (
        <span>Za spremanje treba Academic Suite račun.</span>
      )}
    </div>
  );
}

export const scanDraftStorageKey = STORAGE_KEY;
