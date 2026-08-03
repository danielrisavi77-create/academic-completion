"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SaveProjectButton, scanDraftStorageKey } from "@/components/scan/SaveProjectButton";
import { evaluateCompletionScan } from "@/domain/scan/evaluate-scan";
import { parseScanInputPayload } from "@/domain/scan/parse-input";
import {
  profileForWorkType,
  type DraftStatus,
  type LektaCheckStatus,
  type MentorAIConsultationStatus,
  type MentorFeedbackStatus,
  type MentorVersionStatus,
  type ScanInput,
  type ScanResult,
  type ScanStage,
} from "@/domain/scan/types";
import type { WorkType } from "@/domain/project/types";
import { trackClientEvent } from "@/lib/analytics/client";

type YesNo = "YES" | "NO" | "";

type FormState = {
  workType: WorkType | "";
  targetSubmissionDate: string;
  topicApproved: YesNo;
  stage: ScanStage | "";
  draftStatus: DraftStatus | "";
  mentorVersionStatus: MentorVersionStatus | "";
  mentorFeedbackStatus: MentorFeedbackStatus | "";
  lektaCheckStatus: LektaCheckStatus | "";
  usedAI: YesNo;
  mentorAIConsultation: MentorAIConsultationStatus | "";
};

type Option<T extends string> = { value: T; label: string; hint?: string };

const initialForm: FormState = {
  workType: "",
  targetSubmissionDate: "",
  topicApproved: "",
  stage: "",
  draftStatus: "",
  mentorVersionStatus: "",
  mentorFeedbackStatus: "",
  lektaCheckStatus: "",
  usedAI: "",
  mentorAIConsultation: "",
};

const stageOptions: Option<ScanStage>[] = [
  { value: "PLANNING", label: "Planiram strukturu", hint: "Tema je aktivna, ali rad još nije stvarno krenuo." },
  { value: "RESEARCH", label: "Skupljam literaturu i građu" },
  { value: "DRAFTING", label: "Pišem prvu verziju" },
  { value: "REVISION", label: "Imam draft i uređujem ga" },
  { value: "MENTOR_REVIEW", label: "Rad je kod mentora" },
  { value: "FINAL_CHECK", label: "Pred finalnom sam predajom" },
];

const draftOptions: Option<DraftStatus>[] = [
  { value: "NONE", label: "Još nemam draft" },
  { value: "PARTIAL", label: "Imam dio rada" },
  { value: "FULL", label: "Imam cijeli draft" },
];

const mentorVersionOptions: Option<MentorVersionStatus>[] = [
  { value: "NEVER", label: "Još nije vidio rad" },
  { value: "OLDER_VERSION", label: "Vidio je stariju verziju" },
  { value: "CURRENT_VERSION", label: "Vidio je aktualnu verziju" },
];

const feedbackOptions: Option<MentorFeedbackStatus>[] = [
  { value: "NONE", label: "Nemam otvorenih komentara" },
  { value: "SOME", label: "Imam nekoliko otvorenih komentara" },
  { value: "MANY", label: "Imam puno otvorenih komentara" },
];

const lektaOptions: Option<LektaCheckStatus>[] = [
  { value: "NEVER_CHECKED", label: "Nisam još provjerio/la dokument" },
  { value: "CHECKED_CLEAR", label: "Provjeren je i nema otvorenih nalaza" },
  { value: "FINDINGS_OPEN", label: "Provjeren je i ima otvorenih nalaza" },
];

const consultationOptions: Option<MentorAIConsultationStatus>[] = [
  { value: "YES", label: "Da, razgovarao/la sam s mentorom" },
  { value: "NO", label: "Ne" },
  { value: "UNKNOWN", label: "Nisam siguran/na što vrijedi za moj rad" },
];

const stageLabels: Record<ScanStage, string> = {
  PLANNING: "Planiranje",
  RESEARCH: "Istraživanje i građa",
  DRAFTING: "Pisanje drafta",
  REVISION: "Revizija drafta",
  MENTOR_REVIEW: "Pregled mentora",
  FINAL_CHECK: "Finalna provjera",
};

function ChoiceGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | "";
  options: Option<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="scan-fieldset">
      <legend>{label}</legend>
      <div className="choice-grid">
        {options.map((option) => (
          <button
            className={`choice-card${value === option.value ? " choice-card-selected" : ""}`}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            <span>{option.label}</span>
            {option.hint ? <small>{option.hint}</small> : null}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function canContinue(step: number, form: FormState) {
  if (step === 0) return Boolean(form.workType && form.targetSubmissionDate && form.topicApproved);
  if (step === 1) return Boolean(form.stage && form.draftStatus);
  if (step === 2) return Boolean(form.mentorVersionStatus && form.mentorFeedbackStatus && form.lektaCheckStatus);
  if (step === 3) {
    return Boolean(form.usedAI && (form.usedAI === "NO" || form.mentorAIConsultation));
  }
  return false;
}

function policySymbol(decision: ScanResult["policySnapshot"]["items"][number]["decision"]) {
  if (decision === "DENY") return "×";
  if (decision === "ALLOW") return "✓";
  if (decision === "ALLOW_WITH_CONDITIONS") return "◐";
  return "?";
}

function scanInputFromForm(form: FormState): ScanInput | null {
  if (
    !form.workType ||
    !form.targetSubmissionDate ||
    !form.topicApproved ||
    !form.stage ||
    !form.draftStatus ||
    !form.mentorVersionStatus ||
    !form.mentorFeedbackStatus ||
    !form.lektaCheckStatus ||
    !form.usedAI
  ) {
    return null;
  }

  return {
    workType: form.workType,
    profileId: profileForWorkType(form.workType),
    targetSubmissionDate: form.targetSubmissionDate,
    topicApproved: form.topicApproved === "YES",
    stage: form.stage,
    draftStatus: form.draftStatus,
    mentorVersionStatus: form.mentorVersionStatus,
    mentorFeedbackStatus: form.mentorFeedbackStatus,
    lektaCheckStatus: form.lektaCheckStatus,
    usedAI: form.usedAI === "YES",
    mentorAIConsultation:
      form.usedAI === "YES" && form.mentorAIConsultation
        ? form.mentorAIConsultation
        : "UNKNOWN",
  };
}

export function CompletionScan() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [actionAcknowledged, setActionAcknowledged] = useState(false);

  useEffect(() => {
    trackClientEvent("scan_started", { faculty: "fpzg", program: "politologija" });

    const stored = sessionStorage.getItem(scanDraftStorageKey);
    if (!stored) return;

    try {
      const restored = parseScanInputPayload(JSON.parse(stored));
      setForm({
        workType: restored.workType,
        targetSubmissionDate: restored.targetSubmissionDate,
        topicApproved: restored.topicApproved ? "YES" : "NO",
        stage: restored.stage,
        draftStatus: restored.draftStatus,
        mentorVersionStatus: restored.mentorVersionStatus,
        mentorFeedbackStatus: restored.mentorFeedbackStatus,
        lektaCheckStatus: restored.lektaCheckStatus,
        usedAI: restored.usedAI ? "YES" : "NO",
        mentorAIConsultation: restored.mentorAIConsultation,
      });
      setStep(3);
      setResult(evaluateCompletionScan(restored));
    } catch {
      sessionStorage.removeItem(scanDraftStorageKey);
    }
  }, []);

  const progress = useMemo(() => `${step + 1} / 4`, [step]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function next() {
    if (!canContinue(step, form)) return;
    setStep((current) => Math.min(3, current + 1));
  }

  function back() {
    setStep((current) => Math.max(0, current - 1));
  }

  function submit() {
    if (!canContinue(3, form)) return;
    const scanInput = scanInputFromForm(form);
    if (!scanInput) return;

    const scanResult = evaluateCompletionScan(scanInput);

    setResult(scanResult);
    trackClientEvent("scan_completed", {
      faculty: "fpzg",
      program: "politologija",
      workType: form.workType,
      stage: form.stage,
      findings: scanResult.findings.length,
      daysToTarget: scanResult.daysToTarget,
    });
    for (const finding of scanResult.findings) {
      trackClientEvent("blocker_presented", {
        type: finding.type,
        severity: finding.severity,
      });
    }
  }

  function reset() {
    setForm(initialForm);
    setStep(0);
    setResult(null);
    setActionAcknowledged(false);
    sessionStorage.removeItem(scanDraftStorageKey);
    trackClientEvent("scan_started", { faculty: "fpzg", program: "politologija", restart: true });
  }

  if (result) {
    const completedScanInput = scanInputFromForm(form);

    return (
      <div className="scan-result" aria-live="polite">
        <div className="result-hero">
          <div>
            <p className="eyebrow">Tvoj Completion Scan</p>
            <h1>{result.workType === "MASTERS_THESIS" ? "Diplomski rad" : "Završni rad"}</h1>
            <p className="result-subline">FPZG · Politologija · {result.daysToTarget >= 0 ? `${result.daysToTarget} dana do cilja` : "ciljani datum je prošao"}</p>
          </div>
          <div className="stage-chip"><span>Faza</span><strong>{stageLabels[result.stage]}</strong></div>
        </div>

        <section className="result-section" aria-labelledby="findings-heading">
          <div className="section-heading-row"><div><p className="eyebrow">Najvažnije sada</p><h2 id="findings-heading">{result.findings.length ? `${result.findings.length} stvari traže pažnju` : "Nema velikog blockera u podacima koje pratimo"}</h2></div></div>
          <div className="finding-list">
            {result.findings.map((finding) => (
              <article className={`finding-card finding-${finding.severity.toLowerCase()}`} key={finding.id}>
                <span className="finding-severity">{finding.severity === "CRITICAL" ? "Kritično" : finding.severity === "HIGH" ? "Važno" : "Prati"}</span>
                <h3>{finding.title}</h3>
                <p>{finding.explanation}</p>
              </article>
            ))}
          </div>
        </section>

        {result.waitingItems.length ? (
          <section className="waiting-strip">
            <span>Čeka se</span>
            <strong>{result.waitingItems[0]?.label}</strong>
          </section>
        ) : null}

        <section className="result-next" aria-labelledby="next-heading">
          <div className="next-number">01</div>
          <div>
            <p className="eyebrow">Sljedeći potez</p>
            <h2 id="next-heading">{result.nextAction.title}</h2>
            <p>{result.nextAction.reason}</p>
          </div>
          <button
            className="primary-button"
            onClick={() => {
              setActionAcknowledged(true);
              trackClientEvent("first_action_clicked", {
                sourceFindingId: result.nextAction.sourceFindingId ?? null,
              });
            }}
            type="button"
          >
            {actionAcknowledged ? "Ovo je moj sljedeći korak" : "Postavi kao moj sljedeći korak"}
          </button>
        </section>

        <section className="policy-panel" aria-labelledby="policy-heading">
          <div className="section-heading-row">
            <div><p className="eyebrow">AI pravila</p><h2 id="policy-heading">FPZG · provjereni službeni izvor</h2></div>
            <a href={result.policySnapshot.sourceUrl} target="_blank" rel="noreferrer">Otvori izvor ↗</a>
          </div>
          <div className="policy-list">
            {result.policySnapshot.items.map((item) => (
              <div className={`policy-row policy-${item.decision.toLowerCase()}`} key={item.capability}>
                <span className="policy-symbol" aria-hidden="true">{policySymbol(item.decision)}</span>
                <span>{item.label}</span>
                <strong>{item.decision === "DENY" ? "Nije dopušteno" : item.decision === "ALLOW" ? "Dopušteno" : item.decision === "ALLOW_WITH_CONDITIONS" ? "Uz uvjete" : "Nije razjašnjeno"}</strong>
              </div>
            ))}
          </div>
          <p className="source-note">Ruleset provjeren {result.policySnapshot.verifiedAt}. Konačnu akademsku odluku donose mentor i Fakultet.</p>
        </section>

        {completedScanInput ? (
          <section className="result-section" aria-labelledby="save-project-heading">
            <div className="section-heading-row">
              <div>
                <p className="eyebrow">Nastavi bez ponovnog unosa</p>
                <h2 id="save-project-heading">Pretvori ovaj Scan u svoj projekt</h2>
                <p>Besplatni rezultat ostaje tvoj. Račun trebaš samo ako želiš spremiti stanje, blockere i sljedeće korake.</p>
              </div>
            </div>
            <SaveProjectButton scanInput={completedScanInput} />
          </section>
        ) : null}

        <div className="result-actions">
          <button className="secondary-button" onClick={reset} type="button">Ponovi Scan</button>
          <Link className="text-link" href="/project">Pogledaj kako izgleda projektni pregled →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="scan-flow">
      <div className="scan-progress"><span>Completion Scan</span><strong>{progress}</strong></div>

      {step === 0 ? (
        <section className="scan-step">
          <p className="eyebrow">Rad i rok</p>
          <h1>Krenimo od onoga što se ne smije nagađati.</h1>
          <p className="scan-intro">Pilot je trenutačno ograničen na FPZG Politologiju. Ne tražimo tekst rada ni dokument.</p>
          <ChoiceGroup
            label="Što pišeš?"
            value={form.workType}
            options={[
              { value: "FINAL_THESIS", label: "Završni rad" },
              { value: "MASTERS_THESIS", label: "Diplomski rad" },
            ]}
            onChange={(value) => update("workType", value)}
          />
          <div className="scan-fieldset">
            <label htmlFor="target-date">Koji je tvoj ciljani datum predaje?</label>
            <input
              id="target-date"
              onBlur={() => form.targetSubmissionDate && trackClientEvent("deadline_set", { hasDeadline: true })}
              onChange={(event) => update("targetSubmissionDate", event.target.value)}
              type="date"
              value={form.targetSubmissionDate}
            />
          </div>
          <ChoiceGroup
            label="Je li tema odobrena?"
            value={form.topicApproved}
            options={[{ value: "YES", label: "Da" }, { value: "NO", label: "Ne / još čekam" }]}
            onChange={(value) => update("topicApproved", value)}
          />
        </section>
      ) : null}

      {step === 1 ? (
        <section className="scan-step">
          <p className="eyebrow">Trenutačno stanje</p>
          <h1>Gdje si stvarno s radom?</h1>
          <ChoiceGroup label="Koja te faza najbolje opisuje?" value={form.stage} options={stageOptions} onChange={(value) => update("stage", value)} />
          <ChoiceGroup label="Koliko rada već postoji?" value={form.draftStatus} options={draftOptions} onChange={(value) => update("draftStatus", value)} />
        </section>
      ) : null}

      {step === 2 ? (
        <section className="scan-step">
          <p className="eyebrow">Mentor i dokument</p>
          <h1>Što je već prošlo vanjsku provjeru?</h1>
          <ChoiceGroup label="Koju je verziju mentor vidio?" value={form.mentorVersionStatus} options={mentorVersionOptions} onChange={(value) => update("mentorVersionStatus", value)} />
          <ChoiceGroup label="Imaš li neriješene mentorove komentare?" value={form.mentorFeedbackStatus} options={feedbackOptions} onChange={(value) => update("mentorFeedbackStatus", value)} />
          <ChoiceGroup label="Jesi li već napravio/la Lekta provjeru?" value={form.lektaCheckStatus} options={lektaOptions} onChange={(value) => update("lektaCheckStatus", value)} />
        </section>
      ) : null}

      {step === 3 ? (
        <section className="scan-step">
          <p className="eyebrow">AI policy</p>
          <h1>AI nije isti problem na svakom radu.</h1>
          <ChoiceGroup
            label="Jesi li već koristio/la generativni AI na ovom radu?"
            value={form.usedAI}
            options={[{ value: "YES", label: "Da" }, { value: "NO", label: "Ne" }]}
            onChange={(value) => {
              update("usedAI", value);
              if (value === "NO") update("mentorAIConsultation", "UNKNOWN");
            }}
          />
          {form.usedAI === "YES" ? (
            <ChoiceGroup label="Jesi li se o AI uporabi konzultirao/la s mentorom?" value={form.mentorAIConsultation} options={consultationOptions} onChange={(value) => update("mentorAIConsultation", value)} />
          ) : null}
          <div className="scan-trust-note"><strong>Ne šalješ tekst rada.</strong><span>Scan koristi samo strukturirane odgovore na ovoj stranici.</span></div>
        </section>
      ) : null}

      <div className="scan-controls">
        {step > 0 ? (
          <button className="secondary-button" onClick={back} type="button">Natrag</button>
        ) : (
          <Link className="secondary-button button-link" href="/">Odustani</Link>
        )}
        {step < 3 ? (
          <button className="primary-button" disabled={!canContinue(step, form)} onClick={next} type="button">Nastavi</button>
        ) : (
          <button className="primary-button" disabled={!canContinue(step, form)} onClick={submit} type="button">Prikaži moj Scan</button>
        )}
      </div>
    </div>
  );
}
