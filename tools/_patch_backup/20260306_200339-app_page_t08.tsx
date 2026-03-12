import Link from "next/link";

import { isSupabaseConfigured } from "@/lib/env";
import { SectionCard } from "@/components/section-card";
import { SiteShell } from "@/components/site-shell";

const quickLinks = [
  { href: "/mapa", label: "Ver mapa base" },
  { href: "/novo", label: "Entender fluxo de novo relato" },
  { href: "/transparencia", label: "Acompanhar indicadores" }
];

export default function HomePage() {
  const supabaseReady = isSupabaseConfigured();

  return (
    <SiteShell
      title="Cidade caminhavel e legivel"
      subtitle="Mapa de Calcadas une percepcao cidada e leitura tecnica para transformar pontos de risco em agenda publica concreta."
    >
      <SectionCard
        title={supabaseReady ? "Backend integrado" : "Backend nao configurado"}
        eyebrow={supabaseReady ? "T02 Supabase" : "Setup necessario"}
      >
        {supabaseReady ? (
          <p>Front e Supabase base ja conversam. Falta: formulario /novo e fluxo de triagem.</p>
        ) : (
          <div className="space-y-2">
            <p>Siga as instrucoes em <span className="font-semibold">docs/T02_SUPABASE_SETUP.md</span> para ativar.</p>
            <Link href="/login" className="inline-block border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]">
              Tentar /login
            </Link>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Manifesto" eyebrow="VR Abandonada">
        <p>
          Cada calcada ruim e um aviso de abandono. Nossa proposta e dar nitidez ao problema, priorizar
          o que fere mobilidade e criar um historico publico de melhoria continua.
        </p>
      </SectionCard>

      <SectionCard title="Como comecamos" eyebrow="T01 Scaffold">
        <ul className="space-y-2">
          <li>- Base visual de alto contraste, direta e sem maquiagem.</li>
          <li>- Rotas para mapa, novos relatos, transparencia e moderacao.</li>
          <li>- Pipeline de verificacao tecnica para manter estabilidade.</li>
        </ul>
      </SectionCard>

      <SectionCard title="Status de entrega" eyebrow="Camadas ativas">
        <ul className="space-y-2">
          <li>- Registro cidadao: ativo.</li>
          <li>- Mapa publico: ativo.</li>
          <li>- Verificacao comunitaria: ativa.</li>
          <li>- Moderacao operacional: ativa.</li>
          <li>- Foto privada: ativa (signed URL).</li>
        </ul>
      </SectionCard>

      <SectionCard title="Atalhos" eyebrow="Entrar agora">
        <div className="flex flex-wrap gap-2">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] hover:bg-[var(--signal)]"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Compromisso" eyebrow="Infraestrutura publica">
        <p>
          O projeto nasce para apoiar decisoes com transparencia. O mapa interativo real entra em camadas,
          com dados, moderacao e auditoria evoluindo nos proximos tijolos.
        </p>
      </SectionCard>
    </SiteShell>
  );
}
