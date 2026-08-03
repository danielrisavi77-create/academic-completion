import Link from "next/link";
import { signUp } from "@/app/auth/actions";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const next = params.next?.startsWith("/") && !params.next.startsWith("//") ? params.next : "/";

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link className="public-brand" href="/">
          <span className="brand-mark" aria-hidden="true">A</span>
          <span>Academic Completion</span>
        </Link>
        <div className="auth-heading">
          <p className="eyebrow">Registracija</p>
          <h1>Spremi projekt pod svoj račun.</h1>
          <p>Academic Completion sprema strukturirano stanje projekta, ne tekst tvog rada.</p>
        </div>
        {params.error ? <p className="auth-message auth-error">{params.error}</p> : null}
        <form action={signUp} className="auth-form">
          <input name="next" type="hidden" value={next} />
          <label>Email<input autoComplete="email" name="email" required type="email" /></label>
          <label>Lozinka<input autoComplete="new-password" minLength={8} name="password" required type="password" /></label>
          <button className="primary-button" type="submit">Kreiraj račun</button>
        </form>
        <p className="auth-switch">Već imaš račun? <Link href={`/prijava?next=${encodeURIComponent(next)}`}>Prijavi se</Link></p>
      </section>
    </main>
  );
}
