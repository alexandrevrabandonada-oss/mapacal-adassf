import type { ReactNode } from "react";

import { TopNav } from "./top-nav";

type SiteShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function SiteShell({ title, subtitle, children }: SiteShellProps) {
  return (
    <div className="min-h-screen bg-[var(--bg-grid)] text-[var(--ink)]">
      <TopNav />
      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <section className="mb-8 border-2 border-[var(--ink)] bg-[var(--signal)] p-6 shadow-[8px_8px_0_var(--ink)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink)]">Concreto Zen</p>
          <h2 className="mt-1 text-3xl font-black uppercase tracking-tight md:text-4xl">{title}</h2>
          <p className="mt-3 max-w-3xl text-sm font-medium leading-relaxed text-zinc-800 md:text-base">
            {subtitle}
          </p>
        </section>
        <div className="grid gap-5 md:grid-cols-2">{children}</div>
      </main>
    </div>
  );
}
