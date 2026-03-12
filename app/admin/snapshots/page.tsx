"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { SectionCard } from "@/components/section-card";
import { SiteShell } from "@/components/site-shell";
import { SnapshotCreateForm } from "@/components/snapshots/snapshot-create-form";
import { SnapshotDiffCreateForm } from "@/components/snapshots/snapshot-diff-create-form";
import { MaterializedNote } from "@/components/snapshots/materialized-note";
import { PublicSnapshotListItem } from "@/lib/snapshots/list-public-snapshots";
import { PublicSnapshotDiffListItem } from "@/lib/snapshots/list-public-snapshot-diffs";

type SnapshotCreatePayload = {
  kind: "transparency" | "territory";
  days: number;
  neighborhood?: string | null;
  title?: string | null;
};

type DiffCreatePayload = {
  fromSnapshotId: string;
  toSnapshotId: string;
  title?: string | null;
};

type AdminState = "loading" | "env-missing" | "not-authenticated" | "forbidden" | "ready" | "error";

export default function AdminSnapshotsPage() {
  const [adminState, setAdminState] = useState<AdminState>("loading");
  const [stateMessage, setStateMessage] = useState<string>("Verificando acesso...");

  const [snapshots, setSnapshots] = useState<PublicSnapshotListItem[]>([]);
  const [diffs, setDiffs] = useState<PublicSnapshotDiffListItem[]>([]);
  const [loadingSnapshots, setLoadingSnapshots] = useState(true);
  const [loadingDiffs, setLoadingDiffs] = useState(true);

  const [creatingSnapshot, setCreatingSnapshot] = useState(false);
  const [creatingDiff, setCreatingDiff] = useState(false);
  const [error, setError] = useState("");

  const compatibleForDiff = useMemo(() => snapshots, [snapshots]);

  type SnapshotRunItem = { id: string; status: string; snapshot_id: string; source: string; started_at: string; message: string; diff_id?: string; };
  const [runs, setRuns] = useState<SnapshotRunItem[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(true);

  async function loadSnapshotsAndDiffs() {
    setLoadingSnapshots(true);
    setLoadingDiffs(true);
    setLoadingRuns(true);

    const [snapshotsRes, diffsRes, runsRes] = await Promise.all([
      fetch("/api/admin/snapshots/list", { cache: "no-store" }),
      fetch("/api/admin/snapshots/diffs/list", { cache: "no-store" }),
      fetch("/api/admin/snapshots/diff-runs?limit=10", { cache: "no-store" }).catch(() => null)
    ]);

    const snapshotsJson = await snapshotsRes.json();
    const diffsJson = await diffsRes.json();

    let runsJson = { items: [] };
    if (runsRes && runsRes.ok) {
      runsJson = await runsRes.json();
    }

    setSnapshots(Array.isArray(snapshotsJson.items) ? snapshotsJson.items : []);
    setDiffs(Array.isArray(diffsJson.items) ? diffsJson.items : []);
    setRuns(Array.isArray(runsJson.items) ? runsJson.items : []);

    setLoadingSnapshots(false);
    setLoadingDiffs(false);
    setLoadingRuns(false);
  }

  useEffect(() => {
    const init = async () => {
      try {
        const stateRes = await fetch("/api/admin/snapshots/state", { cache: "no-store" });
        const stateJson = await stateRes.json();

        if (!stateJson.ok) {
          setAdminState("error");
          setStateMessage(stateJson.message || "Falha ao verificar estado de acesso.");
          return;
        }

        const nextState = stateJson.state as AdminState;
        setAdminState(nextState);
        setStateMessage(stateJson.message || "");

        if (nextState === "ready") {
          await loadSnapshotsAndDiffs();
        } else {
          setLoadingSnapshots(false);
          setLoadingDiffs(false);
        }
      } catch (err) {
        setAdminState("error");
        setStateMessage(err instanceof Error ? err.message : "Erro desconhecido");
        setLoadingSnapshots(false);
        setLoadingDiffs(false);
      }
    };

    void init();
  }, []);

  const handleCreateSnapshot = async (data: SnapshotCreatePayload) => {
    setCreatingSnapshot(true);
    setError("");

    try {
      const response = await fetch("/api/admin/snapshots/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Erro ao criar snapshot");
      }

      await loadSnapshotsAndDiffs();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      throw new Error(message);
    } finally {
      setCreatingSnapshot(false);
    }
  };

  const handleCreateDiff = async (data: DiffCreatePayload) => {
    setCreatingDiff(true);
    setError("");

    try {
      const response = await fetch("/api/admin/snapshots/diff/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Erro ao criar diff");
      }

      await loadSnapshotsAndDiffs();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      throw new Error(message);
    } finally {
      setCreatingDiff(false);
    }
  };

  const handleGenerateAutoDiff = async (snapshotId: string) => {
    setError("");
    setFeedback((prev) => ({ ...prev, [snapshotId]: "Gerando auto-diff..." }));

    try {
      const res = await fetch("/api/admin/snapshots/auto-diff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshotId })
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setFeedback((prev) => ({ ...prev, [snapshotId]: `Erro: ${data.message}` }));
      } else {
        const tag = data.status === "skipped" ? "Ignorado" : "OK";
        setFeedback((prev) => ({ ...prev, [snapshotId]: `${tag}: ${data.message}` }));
      }
      await loadSnapshotsAndDiffs();
    } catch (err) {
      setFeedback((prev) => ({ ...prev, [snapshotId]: "Erro de rede" }));
    }
  };

  const [feedback, setFeedback] = useState<Record<string, string>>({});

  return (
    <SiteShell
      title="Administracao de Snapshots"
      subtitle="Crie snapshots materializados e diffs congelados para links publicos estaveis"
    >
      {adminState === "loading" ? (
        <SectionCard title="Verificando acesso" eyebrow="Admin">
          <p>{stateMessage}</p>
        </SectionCard>
      ) : null}

      {adminState === "env-missing" ? (
        <SectionCard title="Supabase nao configurado" eyebrow="Setup necessario">
          <p>{stateMessage}</p>
          <p className="mt-2 text-xs text-zinc-600">Defina as variaveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.</p>
        </SectionCard>
      ) : null}

      {adminState === "not-authenticated" ? (
        <SectionCard title="Login necessario" eyebrow="Acesso">
          <p>{stateMessage}</p>
          <Link href="/login" className="mt-3 inline-block border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]">
            Ir para login
          </Link>
        </SectionCard>
      ) : null}

      {adminState === "forbidden" ? (
        <SectionCard title="Sem permissao" eyebrow="Acesso restrito">
          <p>{stateMessage}</p>
          <p className="mt-2 text-xs text-zinc-600">Solicite role `moderator` ou `admin` para usar este painel.</p>
        </SectionCard>
      ) : null}

      {adminState === "error" ? (
        <SectionCard title="Erro ao carregar painel" eyebrow="Falha">
          <p>{stateMessage}</p>
        </SectionCard>
      ) : null}

      {adminState === "ready" ? (
        <div className="space-y-8">
          {error ? (
            <div className="rounded border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
          ) : null}

          <MaterializedNote type="snapshot" />

          <SectionCard title="Automacao" eyebrow="T12b Snapshot Jobs">
            <p className="text-sm text-zinc-700">
              Para rotina diaria/semanal com anti-duplicacao e trilha de execucao, use o painel de jobs.
            </p>
            <Link
              href="/admin/snapshot-jobs"
              className="mt-3 inline-block border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
            >
              Abrir painel de jobs
            </Link>
          </SectionCard>

          <div className="grid gap-6 lg:grid-cols-2">
            <SnapshotCreateForm kind="transparency" isLoading={creatingSnapshot} onSubmit={handleCreateSnapshot} />
            <SnapshotCreateForm kind="territory" isLoading={creatingSnapshot} onSubmit={handleCreateSnapshot} />
          </div>

          <SnapshotDiffCreateForm snapshots={compatibleForDiff} isLoading={creatingDiff} onSubmit={handleCreateDiff} />

          <SectionCard title="Snapshots existentes" eyebrow="Inventario">
            {loadingSnapshots ? <p className="text-sm text-zinc-600">Carregando snapshots...</p> : (
              <div className="space-y-4">
                {snapshots.length === 0 ? <p className="text-sm text-zinc-600">Nenhum snapshot encontrado.</p> : null}
                {snapshots.map(snapshot => {
                  const hasDiff = diffs.some(d => d.to_snapshot_id === snapshot.id);
                  const href = `/snapshots/${snapshot.kind === "transparency" ? "transparencia" : "territorio"}/${snapshot.id}`;

                  return (
                    <article key={snapshot.id} className="rounded border border-zinc-300 bg-white p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-bold">{snapshot.title || `Snapshot ${snapshot.kind}`}</p>
                          <p className="text-xs font-black uppercase tracking-[0.08em] mt-1 text-zinc-500">
                            {snapshot.kind} | {snapshot.days}d {snapshot.neighborhood ? `| ${snapshot.neighborhood}` : ""}
                          </p>
                          <p className="text-xs text-zinc-700 mt-1">Data base: {new Date(snapshot.snapshot_at).toLocaleString("pt-BR")}</p>
                          {hasDiff ? (
                            <span className="inline-block mt-1 bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Possui diff posterior</span>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link href={href} className="border border-[var(--ink)] bg-[var(--paper)] px-2 py-1 text-xs font-bold uppercase hover:bg-[var(--signal)]">
                          Abrir publico
                        </Link>
                        {!hasDiff ? (
                          <button
                            type="button"
                            onClick={() => handleGenerateAutoDiff(snapshot.id)}
                            className="border border-[var(--ink)] bg-[var(--signal)] px-2 py-1 text-xs font-bold uppercase hover:bg-white"
                          >
                            Tentar Auto-Diff
                          </button>
                        ) : null}
                      </div>
                      {feedback[snapshot.id] ? <p className="mt-2 text-xs font-semibold text-blue-700">{feedback[snapshot.id]}</p> : null}
                    </article>
                  );
                })}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Diffs existentes" eyebrow="Inventario">
            {loadingDiffs ? (
              <p className="text-sm text-zinc-600">Carregando diffs...</p>
            ) : diffs.length === 0 ? (
              <p className="text-sm text-zinc-600">Nenhum diff criado ainda.</p>
            ) : (
              <div className="space-y-2">
                {diffs.map((diff) => (
                  <div key={diff.id} className="flex items-start justify-between gap-2 rounded-lg border border-zinc-200 bg-white p-4">
                    <div>
                      <p className="text-sm font-medium">{diff.title || `Diff ${diff.kind}`}</p>
                      <p className="text-xs text-zinc-600">Criado em {new Date(diff.created_at).toLocaleString("pt-BR")}</p>
                    </div>
                    <Link href={`/snapshots/diffs/${diff.id}`} className="inline-flex items-center rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100">
                      Ver diff
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Historico Auto-Diff" eyebrow="Trilha operacional">
            {loadingRuns ? (
              <p className="text-sm text-zinc-600">Carregando historico...</p>
            ) : runs.length === 0 ? (
              <p className="text-sm text-zinc-600">Nenhuma execucao registrada.</p>
            ) : (
              <div className="space-y-2">
                {runs.map((run) => (
                  <article key={run.id} className="rounded border border-zinc-300 bg-white p-3 text-xs">
                    <p className="font-semibold uppercase tracking-[0.06em]">
                      {run.status} | snapshot: {run.snapshot_id.substring(0, 8)}...
                    </p>
                    <p className="mt-1 text-zinc-700">Origem: {run.source} | Data: {new Date(run.started_at).toLocaleString("pt-BR")}</p>
                    <p className="text-zinc-700">Mensagem: {run.message || "-"}</p>
                    {run.diff_id ? (
                      <Link
                        href={`/snapshots/diffs/${run.diff_id}`}
                        className="mt-2 inline-block border border-[var(--ink)] bg-[var(--paper)] px-2 py-1 text-[11px] font-bold uppercase hover:bg-[var(--signal)]"
                      >
                        Ver diff gerado
                      </Link>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      ) : null}
    </SiteShell>
  );
}
