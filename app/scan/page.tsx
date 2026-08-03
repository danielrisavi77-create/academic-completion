import Link from "next/link";
import { CompletionScan } from "@/components/scan/CompletionScan";

export default function ScanPage() {
  return (
    <main className="public-page scan-page">
      <header className="public-header">
        <Link className="public-brand" href="/" aria-label="Academic Completion početna">
          <span className="brand-mark" aria-hidden="true">A</span>
          <span>Academic Completion</span>
        </Link>
        <span className="public-header-note">FPZG pilot · bez registracije</span>
      </header>

      <CompletionScan />
    </main>
  );
}
