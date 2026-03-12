"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { SectionCard } from "@/components/section-card";
import { SiteShell } from "@/components/site-shell";

type AdminState = "loading" | "env-missing" | "not-authenticated" | "forbidden" | "ready" | "error";

type SnapshotJobItem = {
  id: string;
  kind: "transparency" | "territory";
  frequency: "daily" | "weekly";
  days: number;
  neighborhood: string | null;
  is_enabled: boolean;
  last_run_at: string | null;
  last_snapshot_id: string | null;
};

type SnapshotJobRunItem = {
  id: string;
  job_id: string;
  started_at: string;
  finished_at: string | null;
  status: "running" | "success" | "skipped" | "error";
  message: string | null;
  snapshot_id: string | null;
};

export default function SnapshotJobsAdminPage() {
  const [adminState, setAdminState] = useState<AdminState>("loading");
  const [stateMessage, setStateMessage] = useState("Verificando acesso...");

  const [jobs, setJobs] = useState<SnapshotJobItem[]>([]);
  const [runs, setRuns] = useState<SnapshotJobRunItem[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [runningAll, setRunningAll] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  const jobMap = useMemo(() => {
    const map = new Map<string, SnapshotJobItem>();
    for (const job of jobs) {
      map.set(job.id, job);
    }
    return map;
  }, [jobs]);

  async function loadJobsAndRuns() {
    setLoadingJobs(true);
    setLoadingRuns(true);

    const [jobsRes, runsRes] = await Promise.all([
      fetch("/api/admin/snapshot-jobs/list", { cache: "no-store" }),
      fetch("/api/admin/snapshot-jobs/runs?limit=50", { cache: "no-store" })
    ]);

    const jobsJson = await jobsRes.json();
    const runsJson = await runsRes.json();

    setJobs(Array.isArray(jobsJson.items) ? jobsJson.items : []);
    setRuns(Array.isArray(runsJson.items) ? runsJson.items : []);

    setLoadingJobs(false);
    setLoadingRuns(false);
  }

  useEffect(() => {
    const init = async () => {
      try {
        const stateRes = await fetch("/api/admin/snapshots/state", { cache: "no-store" });
        const stateJson = await stateRes.json();

        if (!stateJson.ok) {
          setAdminState("error");
          setStateMessage(stateJson.message || "Falha ao verificar acesso.");
          return;
        }

        const rawState = stateJson.state as AdminState;
        setAdminState(rawState);
        setStateMessage(stateJson.message || "");

        if (rawState === "ready") {
          await loadJobsAndRuns();
        }
      } catch {
        setAdminState("error");
        setStateMessage("Erro ao inicializar painel de automacao.");
      }
    };

    void init();
  }, []);

  async function handleRunJob(jobId: string) {
    setRunningJobId(jobId);
    setFeedback((prev) => ({ ...prev, [jobId]: "" }));

    try {
      const res = await fetch("/api/admin/snapshot-jobs/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId })
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setFeedback((prev) => ({ ...prev, [jobId]: `Erro: ${data.message || "falha na execucao"}` }));
      } else {
        const tag = data.status === "skipped" ? "Skip" : "OK";
        setFeedback((prev) => ({ ...prev, [jobId]: `${tag}: ${data.message || "execucao concluida"}` }));
      }

      await loadJobsAndRuns();
    } catch {
      setFeedback((prev) => ({ ...prev, [jobId]: "Erro de rede na execucao do job" }));
    } finally {
      setRunningJobId(null);
    }
  }

  async function handleRunAllEligible() {
    setRunningAll(true);
    setFeedback((prev) => ({ ...prev, all: "Executando lote..." }));
    try {
      const res = await fetch("/api/admin/snapshot-jobs/run-all", {
        method: "POST"
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setFeedback((prev) => ({ ...prev, all: `Erro: ${data.message || "falha na execucao"}` }));
      } else {
        setFeedback((prev) => ({ ...prev, all: `OK: ${data.message}` }));
      }

      await loadJobsAndRuns();
    } catch {
      setFeedback((prev) => ({ ...prev, all: "Erro de rede" }));
    } finally {
      setRunningAll(false);
    }
  }

  return (
    <SiteShell
      title="Automacao de snapshots"
      subtitle="Rotina civico-operacional para memoria seriada diaria/semanal dos paineis publicos"
    >
      {adminState === "loading" ? (
        <SectionCard title="Verificando acesso" eyebrow="Admin">
          <p>{stateMessage}</p>
        </SectionCard>
      ) : null}

      {adminState === "env-missing" ? (
        <SectionCard title="Supabase nao configurado" eyebrow="Setup necessario">
          <p>{stateMessage}</p>
        </SectionCard>
      ) : null}

      {adminState === "not-authenticated" ? (
        <SectionCard title="Login necessario" eyebrow="Acesso">
          <p>{stateMessage}</p>
          <Link
            href="/login"
            className="mt-3 inline-block border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
          >
            Ir para login
          </Link>
        </SectionCard>
      ) : null}

      {adminState === "forbidden" ? (
        <SectionCard title="Sem permissao" eyebrow="Acesso restrito">
          <p>{stateMessage}</p>
          <p className="mt-2 text-xs text-zinc-600">Somente moderator/admin podem operar jobs de snapshots.</p>
        </SectionCard>
      ) : null}

      {adminState === "error" ? (
        <SectionCard title="Falha operacional" eyebrow="Erro">
          <p>{stateMessage}</p>
        </SectionCard>
      ) : null}

      {adminState === "ready" ? (
        <div className="space-y-6">
          <SectionCard title="Modo de uso" eyebrow="Manual e agendavel">
            <p className="text-sm text-zinc-700">
              Este painel permite rodar jobs manualmente e auditar execucoes. Agendamento externo (cron/plataforma)
              pode chamar a mesma logica sem mudar o modelo de dados.
            </p>

            <div className="mt-4 rounded bg-zinc-100 p-3 text-sm">
              <h4 className="font-bold uppercase text-zinc-800">Agendamento Externo via Cron / Servidor</h4>
              <p className="mt-1 text-zinc-700">Para automatizar este fluxo, configure um processo (Github Actions, cron job, serviço na nuvem) para enviar um POST ao endpoint seguro.</p>
              <ul className="mt-2 list-disc pl-5 text-zinc-600">
                <li><strong>URL:</strong> <code className="rounded bg-white px-1">POST /api/cron/snapshot-jobs</code></li>
                <li><strong>Header:</strong> <code className="rounded bg-white px-1">x-cron-secret</code> = <em>(Definido como SNAPSHOT_CRON_SECRET)</em></li>
                <li><strong>Payload opcional:</strong> <code className="rounded bg-white px-1">{`{ "dryRun": true, "jobId": "..." }`}</code></li>
              </ul>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/admin/snapshots"
                className="border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
              >
                Criacao manual de snapshots
              </Link>
              <Link
                href="/snapshots/materializados/transparencia"
                className="border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
              >
                Ver snapshots publicos
              </Link>
            </div>
          </SectionCard>

          <SectionCard title="Jobs configurados" eyebrow="Daily / Weekly">
            {loadingJobs ? (
              <p className="text-sm text-zinc-600">Carregando jobs...</p>
            ) : jobs.length === 0 ? (
              <p className="text-sm text-zinc-600">Nenhum job encontrado.</p>
            ) : (
              <div className="space-y-4">
                <div className="rounded border border-zinc-500 bg-zinc-50 p-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider">Acoes em lote</h4>
                  <p className="text-xs text-zinc-600 mt-1 mb-3">Encontra todos os jobs ativos que ainda nao executaram com sucesso no periodo (dia/semana) e dipara-os.</p>
                  <button
                    type="button"
                    onClick={() => void handleRunAllEligible()}
                    disabled={runningAll}
                    className="border-2 border-[var(--ink)] bg-[var(--signal)] px-3 py-1 text-xs font-bold uppercase hover:bg-white disabled:opacity-50"
                  >
                    {runningAll ? "Processando..." : "Rodar todos elegiveis"}
                  </button>
                  {feedback.all ? <p className="mt-2 text-xs font-semibold">{feedback.all}</p> : null}
                </div>

                <div className="space-y-3">
                  {jobs.map((job) => {
                    const snapshotHref = job.last_snapshot_id
                      ? `/snapshots/${job.kind === "transparency" ? "transparencia" : "territorio"}/${job.last_snapshot_id}`
                      : null;

                    return (
                      <article key={job.id} className="rounded border border-zinc-300 bg-white p-3">
                        <p className="text-xs font-black uppercase tracking-[0.08em]">
                          {job.kind} | {job.frequency} | {job.days}d | {job.is_enabled ? "ativo" : "inativo"}
                        </p>
                        <p className="mt-1 text-xs text-zinc-700">
                          Bairro: {job.neighborhood || "(todos)"}
                        </p>
                        <p className="mt-1 text-xs text-zinc-700">
                          Ultimo run: {job.last_run_at ? new Date(job.last_run_at).toLocaleString("pt-BR") : "nunca"}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void handleRunJob(job.id)}
                            disabled={runningJobId === job.id || !job.is_enabled}
                            className="border-2 border-[var(--ink)] bg-[var(--signal)] px-3 py-1 text-xs font-bold uppercase hover:bg-white disabled:opacity-50"
                          >
                            {runningJobId === job.id ? "Executando..." : "Rodar job"}
                          </button>

                          {snapshotHref ? (
                            <Link
                              href={snapshotHref}
                              className="border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-1 text-xs font-bold uppercase hover:bg-[var(--signal)]"
                            >
                              Ultimo snapshot
                            </Link>
                          ) : null}
                        </div>

                        {feedback[job.id] ? <p className="mt-2 text-xs font-semibold">{feedback[job.id]}</p> : null}
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Historico recente" eyebrow="Trilha operacional">
            {loadingRuns ? (
              <p className="text-sm text-zinc-600">Carregando historico...</p>
            ) : runs.length === 0 ? (
              <p className="text-sm text-zinc-600">Nenhuma execucao registrada.</p>
            ) : (
              <div className="space-y-2">
                {runs.map((run) => {
                  const runJob = jobMap.get(run.job_id);
                  const snapshotLink = run.snapshot_id && runJob
                    ? `/snapshots/${runJob.kind === "transparency" ? "transparencia" : "territorio"}/${run.snapshot_id}`
                    : null;

                  return (
                    <article key={run.id} className="rounded border border-zinc-300 bg-white p-3 text-xs">
                      <p className="font-semibold uppercase tracking-[0.06em]">
                        {run.status} | {runJob ? `${runJob.kind}/${runJob.frequency}/${runJob.days}d` : run.job_id}
                      </p>
                      <p className="mt-1 text-zinc-700">Inicio: {new Date(run.started_at).toLocaleString("pt-BR")}</p>
                      <p className="text-zinc-700">Fim: {run.finished_at ? new Date(run.finished_at).toLocaleString("pt-BR") : "-"}</p>
                      <p className="text-zinc-700">Mensagem: {run.message || "-"}</p>
                      {snapshotLink ? (
                        <Link
                          href={snapshotLink}
                          className="mt-2 inline-block border border-[var(--ink)] bg-[var(--paper)] px-2 py-1 text-[11px] font-bold uppercase hover:bg-[var(--signal)]"
                        >
                          Abrir snapshot gerado
                        </Link>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>
      ) : null}
    </SiteShell>
  );
}
