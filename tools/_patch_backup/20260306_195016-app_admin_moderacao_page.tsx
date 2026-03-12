"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { SectionCard } from "@/components/section-card";
import { SiteShell } from "@/components/site-shell";

type ModerationItem = {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  status: string;
  condition: string;
  neighborhood: string | null;
  note: string | null;
  lat: number;
  lng: number;
  needs_review: boolean;
  accuracy_m: number | null;
  verification_count: number;
  is_verified: boolean;
};

type FetchModerationResult = {
  ok: boolean;
  items: ModerationItem[];
  message?: string;
  reason?: string;
};

type ModerateActionResult = {
  ok: boolean;
  message: string;
  newStatus?: string;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  needs_review: "Precisa revisão",
  published: "Publicado",
  hidden: "Ocultado",
};

export default function ModeracaoPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [authState, setAuthState] = useState<"loading" | "authenticated" | "anonymous">("loading");
  const [canModerate, setCanModerate] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [moderatingId, setModeratingId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<Record<string, string>>({});

  useEffect(() => {
    async function checkAuth() {
      try {
        // Verificar se há sessão ativa (simples check via fetch que precisa auth)
        // Como não temos endpoint público de profile, vamos tentar buscar a lista
        const res = await fetch("/api/reports/moderation-list?status=pending&limit=1");
        const data = (await res.json()) as FetchModerationResult;

        if (data.reason === "not-authenticated") {
          setAuthState("anonymous");
          setCanModerate(false);
          setLoading(false);
          return;
        }

        if (data.reason === "permission-denied") {
          setAuthState("authenticated");
          setCanModerate(false);
          setErrorMessage("Acesso negado: somente moderadores");
          setLoading(false);
          return;
        }

        if (data.ok) {
          setAuthState("authenticated");
          setCanModerate(true);
        }

        setLoading(false);
      } catch {
        setAuthState("anonymous");
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  useEffect(() => {
    if (!canModerate) {
      return;
    }

    async function fetchItems() {
      setLoading(true);
      setErrorMessage("");

      try {
        const statusParam = filterStatus === "all" ? "" : `?status=${filterStatus}`;
        const res = await fetch(`/api/reports/moderation-list${statusParam}`);
        const data = (await res.json()) as FetchModerationResult;

        if (!data.ok) {
          setErrorMessage(data.message || "Erro ao carregar reports");
          setItems([]);
        } else {
          setItems(data.items);
        }
      } catch {
        setErrorMessage("Erro de rede ao carregar reports");
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    fetchItems();
  }, [filterStatus, canModerate]);

  async function handleModerate(reportId: string, action: string, reason?: string) {
    setModeratingId(reportId);
    setActionFeedback({ ...actionFeedback, [reportId]: "" });

    try {
      const res = await fetch("/api/reports/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, action, reason }),
      });

      const data = (await res.json()) as ModerateActionResult;

      if (data.ok) {
        setActionFeedback({ ...actionFeedback, [reportId]: `✓ ${data.message}` });
        // Atualizar item localmente
        setItems((prev) =>
          prev.map((item) =>
            item.id === reportId
              ? {
                  ...item,
                  status: data.newStatus || item.status,
                  needs_review: action === "request_review" ? true : item.needs_review,
                }
              : item,
          ),
        );
      } else {
        setActionFeedback({ ...actionFeedback, [reportId]: `✗ ${data.message}` });
      }
    } catch {
      setActionFeedback({ ...actionFeedback, [reportId]: "✗ Erro de rede" });
    } finally {
      setModeratingId(null);
    }
  }

  if (loading && authState === "loading") {
    return (
      <SiteShell title="Moderacao" subtitle="Painel operacional de triagem civica">
        <SectionCard title="Verificando sessao" eyebrow="Auth">
          <p>Conferindo permissoes...</p>
        </SectionCard>
      </SiteShell>
    );
  }

  if (authState === "anonymous") {
    return (
      <SiteShell title="Moderacao" subtitle="Painel operacional de triagem civica">
        <SectionCard title="Login necessario" eyebrow="Acesso restrito">
          <p>Para acessar o painel de moderacao, faca login com uma conta autorizada.</p>
          <Link
            href="/login"
            className="mt-3 inline-block border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
          >
            Fazer login
          </Link>
        </SectionCard>
      </SiteShell>
    );
  }

  if (!canModerate) {
    return (
      <SiteShell title="Moderacao" subtitle="Painel operacional de triagem civica">
        <SectionCard title="Acesso negado" eyebrow="Permissao insuficiente">
          <p>{errorMessage || "Sua conta nao tem permissao de moderador."}</p>
          <p className="mt-2">
            Essa area e restrita a moderadores e administradores. Se voce acredita que deveria ter
            acesso, entre em contato com a equipe administrativa.
          </p>
          <Link
            href="/"
            className="mt-3 inline-block border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
          >
            Voltar a home
          </Link>
        </SectionCard>
      </SiteShell>
    );
  }

  return (
    <SiteShell title="Moderacao operacional" subtitle="Fila real de triagem e publicacao">
      <SectionCard title="Status do produto" eyebrow="T06 ativo">
        <ul className="space-y-2">
          <li>- Registro cidadao: ativo</li>
          <li>- Mapa publico: ativo</li>
          <li>- Verificacao comunitaria: ativa</li>
          <li>- Moderacao operacional: ativa</li>
          <li>- Foto: proximo tijolo</li>
        </ul>
      </SectionCard>

      <SectionCard title="Filtros" eyebrow="Status">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {["all", "pending", "needs_review", "published", "hidden"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStatus(s)}
              className={`border-2 px-3 py-2 text-xs font-bold uppercase ${
                filterStatus === s
                  ? "border-[var(--ink)] bg-[var(--signal)]"
                  : "border-[var(--ink)] bg-white hover:bg-[var(--paper)]"
              }`}
            >
              {s === "all" ? "Todos" : STATUS_LABELS[s] || s}
            </button>
          ))}
        </div>
      </SectionCard>

      {errorMessage ? (
        <SectionCard title="Erro ao carregar" eyebrow="Estado">
          <p className="text-red-700">{errorMessage}</p>
        </SectionCard>
      ) : null}

      {loading ? (
        <SectionCard title="Carregando reports" eyebrow="Aguarde">
          <p>Buscando dados...</p>
        </SectionCard>
      ) : null}

      {!loading && items.length === 0 ? (
        <SectionCard title="Nenhum report encontrado" eyebrow="Fila vazia">
          <p>Nao ha reports no filtro selecionado.</p>
        </SectionCard>
      ) : null}

      {!loading && items.length > 0 ? (
        <section className="space-y-4 md:col-span-2">
          {items.map((item) => (
            <div key={item.id} className="border-2 border-[var(--ink)] bg-white p-4">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-sm font-black uppercase">
                  {item.condition === "good"
                    ? "Boa"
                    : item.condition === "bad"
                      ? "Ruim"
                      : item.condition === "blocked"
                        ? "Bloqueada"
                        : item.condition}
                </h3>
                <div className="flex flex-wrap gap-2">
                  <span className="border border-[var(--ink)] bg-[var(--paper)] px-2 py-0.5 text-[10px] font-bold uppercase">
                    {STATUS_LABELS[item.status] || item.status}
                  </span>
                  {item.needs_review ? (
                    <span className="border border-red-600 bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700">
                      Revisao solicitada
                    </span>
                  ) : null}
                  {item.is_verified ? (
                    <span className="border border-[var(--ink)] bg-[var(--signal)] px-2 py-0.5 text-[10px] font-bold uppercase">
                      Verificado ({item.verification_count})
                    </span>
                  ) : null}
                </div>
              </div>

              <ul className="mb-3 space-y-1 text-sm">
                <li>
                  <span className="font-semibold">Bairro:</span>{" "}
                  {item.neighborhood || "Nao informado"}
                </li>
                <li>
                  <span className="font-semibold">Nota:</span> {item.note || "Sem observacao"}
                </li>
                <li>
                  <span className="font-semibold">Criado em:</span>{" "}
                  {new Date(item.created_at).toLocaleString("pt-BR")}
                </li>
                <li>
                  <span className="font-semibold">Atualizado em:</span>{" "}
                  {new Date(item.updated_at).toLocaleString("pt-BR")}
                </li>
                {item.accuracy_m !== null ? (
                  <li>
                    <span className="font-semibold">Precisao:</span> {item.accuracy_m.toFixed(0)}m
                  </li>
                ) : null}
              </ul>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleModerate(item.id, "publish")}
                  disabled={moderatingId === item.id || item.status === "published"}
                  className="border-2 border-[var(--ink)] bg-[var(--signal)] px-3 py-1 text-xs font-bold uppercase hover:bg-white disabled:opacity-50"
                >
                  Publicar
                </button>
                <button
                  type="button"
                  onClick={() => handleModerate(item.id, "hide")}
                  disabled={moderatingId === item.id || item.status === "hidden"}
                  className="border-2 border-[var(--ink)] bg-white px-3 py-1 text-xs font-bold uppercase hover:bg-[var(--paper)] disabled:opacity-50"
                >
                  Ocultar
                </button>
                <button
                  type="button"
                  onClick={() => handleModerate(item.id, "request_review", "Ponto requer revisao")}
                  disabled={moderatingId === item.id || item.needs_review}
                  className="border-2 border-[var(--ink)] bg-white px-3 py-1 text-xs font-bold uppercase hover:bg-[var(--paper)] disabled:opacity-50"
                >
                  Pedir revisao
                </button>
                <Link
                  href={`/r/${item.id}`}
                  className="border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-1 text-xs font-bold uppercase hover:bg-[var(--signal)]"
                >
                  Ver detalhe
                </Link>
              </div>

              {actionFeedback[item.id] ? (
                <p className="mt-2 text-xs font-semibold">{actionFeedback[item.id]}</p>
              ) : null}
            </div>
          ))}
        </section>
      ) : null}
    </SiteShell>
  );
}
