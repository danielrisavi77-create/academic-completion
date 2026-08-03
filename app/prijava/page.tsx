import Link from "next/link";
import { signIn } from "@/app/auth/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
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
          <p className="eyebrow">Prijava</p>
          <h1>Nastavi svoj projekt.</h1>
          <p>Isti Supabase account identity koristi se kroz Academic Suite.</p>
        </div>
        {params.error ? <p className="auth-message auth-error">{params.error}</p> : null}
        {params.message ? <p className="auth-message">{params.message}</p> : null}
        <form action={signIn} className="auth-form">
          <input name="next" type="hidden" value={next} />
          <label>Email<input autoComplete="email" name="email" required type="email" /></label>
          <label>Lozinka<input autoComplete="current-password" minLength={8} name="password" required type="password" /></label>
          <button className="primary-button" type="submit">Prijavi se</button>
        </form>
        <p className="auth-switch">Nemaš račun? <Link href={`/registracija?next=${encodeURIComponent(next)}`}>Registriraj se</Link></p>
      </section>
    </main>
  );
}
