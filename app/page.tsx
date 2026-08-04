import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="public-page landing-page">
      <header className="public-header">
        <Link className="public-brand" href="/" aria-label="Academic Completion početna">
          <span className="brand-mark" aria-hidden="true">A</span>
          <span>Academic Completion</span>
        </Link>
        <nav
          aria-label="Račun i projekt"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Link className="header-link" href="/project">Projektni pregled</Link>
          <Link className="header-link" href="/prijava">Prijavi se</Link>
          <Link className="primary-button button-link" href="/registracija">Registriraj se</Link>
        </nav>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <p className="eyebrow">FPZG · Politologija pilot · završni i diplomski</p>
          <h1>Završi rad bez nagađanja.</h1>
          <p className="landing-lead">
            Academic Completion prati što još trebaš riješiti, što vrijedi za tvoj FPZG projekt i koji je sljedeći najsigurniji potez. Katedra radi sa sadržajem, a Lekta provjerava dokument.
          </p>
          <div className="landing-actions">
            <Link className="primary-button button-link" href="/scan">Provjeri gdje stoji moj rad</Link>
            <span className="landing-trust">Besplatni početni Scan · bez kartice · bez slanja teksta rada</span>
          </div>
        </div>
        <div className="landing-control-card" aria-label="Primjer projektnog pregleda">
          <div className="control-card-top"><span>Diplomski rad</span><strong>37 dana</strong></div>
          <div className="control-card-stage"><small>Faza</small><strong>Revizija drafta</strong></div>
          <div className="control-card-row"><span className="signal signal-critical" aria-hidden="true" />2 kritična blockera</div>
          <div className="control-card-row"><span className="signal signal-waiting" aria-hidden="true" />1 stvar čeka mentora</div>
          <div className="control-card-next"><small>Sljedeće</small><strong>Pošalji mentorici aktualnu metodologiju.</strong></div>
        </div>
      </section>

      <section className="landing-how" aria-labelledby="how-heading">
        <div className="landing-section-heading"><p className="eyebrow">Kako radi</p><h2 id="how-heading">Ne dodaje još jedan chatbot. Smanjuje broj nepoznanica.</h2></div>
        <div className="how-grid">
          <article><span>01</span><h3>Kažeš gdje si</h3><p>Rok, faza, mentor, dokument i AI status — bez teksta rada.</p></article>
          <article><span>02</span><h3>Dobiješ stvarno stanje</h3><p>Najviše tri stvari koje trenutno nose najveći rizik ili blokiraju napredak.</p></article>
          <article><span>03</span><h3>Znaš što ide sljedeće</h3><p>Jedna primarna akcija s razlogom, umjesto još jedne generičke checkliste.</p></article>
        </div>
      </section>

      <section className="landing-boundaries" aria-labelledby="boundaries-heading">
        <div><p className="eyebrow">Academic Suite</p><h2 id="boundaries-heading">Tri specijalizirana sustava. Jedan rad.</h2></div>
        <div className="boundary-grid">
          <article><strong>Academic Completion</strong><span>Što je sljedeće?</span><p>Projekt, rok, blockeri, mentor i službena pravila.</p></article>
          <article><strong>Katedra</strong><span>Kako raditi na sadržaju?</span><p>Hrvatski akademski content i writing assistance.</p></article>
          <article><strong>Lekta</strong><span>Što je stvarno u dokumentu?</span><p>Deterministička provjera konkretnog DOCX-a.</p></article>
        </div>
      </section>

      <section className="landing-final-cta">
        <div><p className="eyebrow">3 minute</p><h2>Prvo saznaj što je otvoreno.</h2><p>Za pilot trenutno podržavamo FPZG Politologiju — završne i diplomske radove.</p></div>
        <Link className="primary-button button-link" href="/scan">Pokreni Completion Scan</Link>
      </section>
    </main>
  );
}
