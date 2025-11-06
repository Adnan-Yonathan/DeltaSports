import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <section className="flex min-h-screen items-center justify-center bg-gradient-to-br from-black via-black to-slate-900 px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/60 p-8 shadow-2xl">
        {children}
      </div>
    </section>
  );
}
