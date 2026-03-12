"use client";

import { useState } from "react";
import { SectionCard } from "@/components/section-card";

type Props = {
  kind: "transparency" | "territory";
  isLoading?: boolean;
  onSubmit: (data: {
    kind: "transparency" | "territory";
    days: number;
    neighborhood?: string | null;
    title?: string | null;
  }) => Promise<void>;
};

export function SnapshotCreateForm({ kind, isLoading = false, onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [days, setDays] = useState("30");
  const [neighborhood, setNeighborhood] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const daysOptions = kind === "transparency" ? [7, 30, 90, 365] : [7, 30, 90, 365];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await onSubmit({
        kind,
        days: parseInt(days, 10),
        neighborhood: neighborhood || null,
        title: title || null
      });

      setSuccess("Snapshot criado com sucesso!");
      setTitle("");
      setDays("30");
      setNeighborhood("");
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar snapshot");
    }
  };

  return (
    <SectionCard
      title={kind === "transparency" ? "Novo Snapshot: Transparencia" : "Novo Snapshot: Territorio"}
      eyebrow="Criar"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Periodo (dias)
            </label>
            <select
              value={days}
              onChange={(e) => setDays(e.target.value)}
              disabled={isLoading}
              className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm disabled:bg-zinc-100"
            >
              {daysOptions.map((d) => (
                <option key={d} value={d}>
                  Ultimos {d} dias
                </option>
              ))}
            </select>
          </div>

          {kind === "territory" && (
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Bairro (opcional, todos se vazio)
              </label>
              <input
                type="text"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                disabled={isLoading}
                placeholder="Ex: Centro"
                className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm disabled:bg-zinc-100"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Titulo (opcional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isLoading}
            placeholder="Ex: Avaliacao de marco de 2025"
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
          disabled={isLoading}
          className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-zinc-300"
        >
          {isLoading ? "Criando..." : "Criar Snapshot"}
        </button>
      </form>
    </SectionCard>
  );
}
