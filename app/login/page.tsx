"use client";

import Link from "next/link";
import { useState } from "react";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { SectionCard } from "@/components/section-card";
import { SiteShell } from "@/components/site-shell";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(""); let content;

  if (!isSupabaseConfigured()) {
    content = (
      <SectionCard title="Supabase não configurado" eyebrow="Setup necessário">
        <p>
          O ambiente de autenticação ainda não está conectado. Siga as instruções em{" "}
          <span className="font-semibold">docs/T02_SUPABASE_SETUP.md</span> para configurar as variáveis de
          ambiente.
        </p>
      </SectionCard>
    );
  } else {
    const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setLoading(true);
      setMessage("");

      try {
        const supabase = getSupabaseBrowserClient();

        if (!supabase) {
          throw new Error("Supabase client não disponível");
        }

        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });

        if (error) {
          throw error;
        }

        setMessage("Link de acesso enviado para seu email!");
      } catch (error) {
        setMessage(`Erro: ${error instanceof Error ? error.message : "Falha ao enviar link"}`);
      } finally {
        setLoading(false);
      }
    };

    content = (
      <>
        <SectionCard title="Acesso" eyebrow="Magic Link">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold uppercase tracking-[0.08em]">
                Seu email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 w-full border-2 border-[var(--ink)] bg-white px-3 py-2 text-sm"
                placeholder="seu@email.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full border-2 border-[var(--ink)] bg-[var(--signal)] px-3 py-3 text-sm font-bold uppercase tracking-[0.08em] hover:bg-[var(--paper)] disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Enviar link de acesso"}
            </button>
          </form>
          {message && <p className="mt-3 text-sm font-semibold text-[var(--ink)]">{message}</p>}
        </SectionCard>

        <SectionCard title="Sobre Magic Link" eyebrow="Segurança">
          <p>
            Você receberá um email com um link exclusivo. Sem necessidade de criar ou lembrar senhas. Cada link
            expira em 24h.
          </p>
        </SectionCard>
      </>
    );
  }

  return (
    <SiteShell title="Entrar" subtitle="Acesso ao painel de contribuições">
      <div className="md:col-span-2">
        <Link href="/" className="mb-4 inline-block border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase">
          ← Voltar ao inicio
        </Link>
      </div>
      {content}
    </SiteShell>
  );
}
