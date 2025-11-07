import type { Metadata } from "next";
import Link from "next/link";
import "../styles/globals.css";
import { SupabaseAuthProvider, type Profile } from "@/components/auth/SupabaseAuthProvider";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UserMenu } from "@/components/UserMenu";

export const metadata: Metadata = {
  title: "DeltaSports",
  description: "Conversational sports intelligence platform"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  let profile: Profile | null = null;

  if (session?.user) {
    const { data } = await supabase
      .from("profiles")
      .select("id,email,role,created_at")
      .eq("id", session.user.id)
      .maybeSingle();

    profile = (data as Profile | null) ?? null;
  }

  return (
    <html lang="en">
      <body>
        <SupabaseAuthProvider initialSession={session} initialProfile={profile}>
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
              <nav className="flex items-center gap-4 text-sm text-slate-300">
                <Link href="/#features">Features</Link>
                <Link href="/#integrations">Integrations</Link>
                <Link href="/command-center">Command Center</Link>
                <Link href="/#cta">Get Access</Link>
                <UserMenu session={session} profile={profile} />
              </nav>
            </header>
            {children}
          </div>
        </SupabaseAuthProvider>
      </body>
    </html>
  );
}
