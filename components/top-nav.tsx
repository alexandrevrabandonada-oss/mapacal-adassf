import Link from "next/link";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/mapa", label: "Mapa" },
  { href: "/territorio", label: "Territorio" },
  { href: "/timeline", label: "Timeline" },
  { href: "/novo", label: "Novo Relato" },
  { href: "/transparencia", label: "Transparencia" },
  { href: "/snapshots/materializados/transparencia", label: "Snapshots" },
  { href: "/admin/snapshot-jobs", label: "Jobs Snapshot" },
  { href: "/admin/moderacao", label: "Moderacao" }
];

export function TopNav() {
  return (
    <header className="border-b-2 border-[var(--ink)] bg-[var(--paper)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--concrete)]">
            VR Abandonada
          </p>
          <h1 className="text-xl font-black uppercase tracking-tight text-[var(--ink)] md:text-2xl">
            Mapa de Calcadas do Sul Fluminense
          </h1>
        </div>
        <nav aria-label="Principal" className="flex flex-wrap gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-none border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--ink)] transition hover:bg-[var(--signal)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
