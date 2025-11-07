import type { Metadata } from "next";
import Link from "next/link";
import "../styles/globals.css";
import { SupabaseAuthProvider } from "@/components/auth/SupabaseAuthProvider";
import { AppQueryProvider } from "@/components/providers/QueryProvider";

export const metadata: Metadata = {
  title: "DeltaSports",
  description: "Conversational sports intelligence platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SupabaseAuthProvider>
          <AppQueryProvider>
            <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-8">
              <header className="mb-8 flex flex-col gap-4 border-b border-white/5 pb-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <Link href="/" className="text-2xl font-semibold">
                      DeltaSports
                    </Link>
                    <p className="text-sm text-slate-300">
                      Conversational sports analytics grounded in real-time data feeds.
                    </p>
                  </div>
                  <nav className="flex flex-wrap gap-4 text-sm text-slate-300">
                    <Link href="/#features">Features</Link>
                    <Link href="/#integrations">Integrations</Link>
                    <Link href="/dashboard">Command Center</Link>
                    <Link href="/#cta">Get Access</Link>
                  </nav>
                </div>
                <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
                  Analytics, not financial advice. Bet responsibly (21+). Check local regulations before wagering.
                </div>
              </header>
              {children}
            </div>
          </AppQueryProvider>
        </SupabaseAuthProvider>
      </body>
    </html>
  );
}
