import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  eyebrow?: string;
  children: ReactNode;
};

export function SectionCard({ title, eyebrow, children }: SectionCardProps) {
  return (
    <section className="border-2 border-[var(--ink)] bg-white p-5 shadow-[6px_6px_0_var(--ink)]">
      {eyebrow ? (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--concrete)]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-lg font-black uppercase tracking-tight text-[var(--ink)]">{title}</h2>
      <div className="mt-3 text-sm leading-relaxed text-zinc-700">{children}</div>
    </section>
  );
}
