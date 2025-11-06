"use client";

import Link from "next/link";
import type { Route } from "next";

const features = [
  {
    name: "Dashboard",
    href: "/dashboard"
  },
  {
    name: "Prompts",
    href: "/prompts"
  },
  {
    name: "Files",
    href: "/files"
  },
  {
    name: "Settings",
    href: "/settings"
  }
] satisfies readonly { name: string; href: Route }[];

export function Sidebar() {
  return (
    <aside className="flex h-full w-full flex-col justify-between rounded-2xl border border-white/5 bg-black/30 p-6 text-sm">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Workspace</h3>
          <p className="mt-1 text-xs text-slate-300">
            Jump between key modules as the conversational tooling evolves.
          </p>
        </div>
        <nav>
          <ul className="space-y-2">
            {features.map((feature) => (
              <li key={feature.name}>
                <Link
                  href={feature.href}
                  className="flex items-center justify-between rounded-lg border border-transparent px-3 py-2 text-slate-200 transition hover:border-brand-accent/60 hover:bg-brand-accent/10 hover:text-white"
                >
                  <span>{feature.name}</span>
                  <span aria-hidden className="text-xs text-slate-400">
                    ↗
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <p className="text-xs text-slate-400">
        Roadmap items are actively in development. Check back soon for deeper controls.
      </p>
    </aside>
  );
}

export default Sidebar;
