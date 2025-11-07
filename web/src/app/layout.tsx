import type { Metadata } from "next";
import Link from "next/link";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "DeltaSports",
  description: "Conversational sports intelligence platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-8">
          <header className="mb-8 flex items-center justify-between">
            <div>
              <Link href="/" className="text-2xl font-semibold">
                DeltaSports
              </Link>
              <p className="text-sm text-slate-300">
                AI-powered betting intelligence with live edges and bankroll insights.
              </p>
            </div>
            <nav className="flex flex-wrap gap-4 text-sm text-slate-300">
              <Link href="/#features">Features</Link>
              <Link href="/#integrations">Integrations</Link>
              <Link href="/dashboard">Command Center</Link>
              <Link href="/#cta">Get Access</Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
