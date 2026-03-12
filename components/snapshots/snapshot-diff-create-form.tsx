"use client";

import { useState } from "react";
import { SectionCard } from "@/components/section-card";
import { PublicSnapshotListItem } from "@/lib/snapshots/list-public-snapshots";

type Props = {
  snapshots: PublicSnapshotListItem[];
  isLoading?: boolean;
  onSubmit: (data: {
    fromSnapshotId: string;
    toSnapshotId: string;
    title?: string | null;
  }) => Promise<void>;
};

export function SnapshotDiffCreateForm({ snapshots, isLoading = false, onSubmit }: Props) {
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filter para mostrar apenas snapshots do mesmo kind
  const fromSnapshot = fromId ? snapshots.find((s) => s.id === fromId) : null;
  const compatibleSnapshots = fromSnapshot
    ? snapshots.filter((s) => s.kind === fromSnapshot.kind && s.id !== fromId)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!fromId || !toId) {
      setError("Selecione dois snapshots diferentes");
      return;
    }

    if (fromId === toId) {
      setError("Snapshots nao podem ser iguais");
      return;
    }

    try {
      await onSubmit({
        fromSnapshotId: fromId,
        toSnapshotId: toId,
        title: title || null
      });

      setSuccess("Diff criado com sucesso!");
      setFromId("");
      setToId("");
      setTitle("");
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar diff");
    }
  };

  return (
    <SectionCard title="Novo Diff (Comparacao Congelada)" eyebrow="Criar">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Snapshot A (de)
          </label>
          <select
            value={fromId}
            onChange={(e) => setFromId(e.target.value)}
            disabled={isLoading}
            className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm disabled:bg-zinc-100"
          >
            <option value="">Selecione um snapshot...</option>
            {snapshots.map((s) => (
              <option key={s.id} value={s.id}>
                {s.kind} - {s.days}d - {s.title ? `"${s.title}"` : "(sem titulo)"}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Snapshot B (para)
          </label>
          <select
            value={toId}
            onChange={(e) => setToId(e.target.value)}
            disabled={isLoading || !fromId}
            className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm disabled:bg-zinc-100"
          >
            <option value="">
              {!fromId ? "Primeiro selecione Snapshot A" : "Selecione snapshot compativel..."}
            </option>
            {compatibleSnapshots.map((s) => (
              <option key={s.id} value={s.id}>
                {s.kind} - {s.days}d - {s.title ? `"${s.title}"` : "(sem titulo)"}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Titulo do Diff (opcional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isLoading}
            placeholder="Ex: Comparacao antes-depois da mobilizacao"
            className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm disabled:bg-zinc-100"
          />
        </div>

        {error && (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !fromId || !toId}
          className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-zinc-300"
        >
          {isLoading ? "Criando..." : "Criar Diff"}
        </button>
      </form>
    </SectionCard>
  );
}
