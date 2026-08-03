import type { Metadata } from "next";
import "./globals.css";
import "./project-home.css";
import "./ai-action.css";
import "./workflow-controls.css";
import "./project-index.css";
import "./lekta-workflow.css";

export const metadata: Metadata = {
  title: "Academic Completion",
  description: "Policy-aware academic completion system — working product shell.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="hr"><body>{children}</body></html>;
}
