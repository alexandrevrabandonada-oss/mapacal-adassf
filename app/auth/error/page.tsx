import Link from "next/link";

import { SectionCard } from "@/components/section-card";
import { SiteShell } from "@/components/site-shell";

type AuthErrorPageProps = {
  searchParams: Promise<{ message?: string }>;
};

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const { message } = await searchParams;
  const displayMessage = message ? decodeURIComponent(message) : "Ocorreu um erro na autenticação.";

  return (
    <SiteShell title="Erro de autenticacao" subtitle="Algo deu errado ao tentar fazer login">
      <SectionCard title="O que aconteceu?" eyebrow="Erro">
        <p>{displayMessage}</p>
      </SectionCard>

      <SectionCard title="Proximos passos" eyebrow="Acao">
        <div className="flex gap-2">
          <Link href="/login" className="border-2 border-[var(--ink)] bg-[var(--signal)] px-3 py-2 text-xs font-bold uppercase">
            Tentar novamente
          </Link>
          <Link href="/" className="border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase">
            Voltar ao inicio
          </Link>
        </div>
      </SectionCard>
    </SiteShell>
  );
}
