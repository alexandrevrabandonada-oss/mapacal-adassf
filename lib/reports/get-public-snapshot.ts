/**
 * get-public-snapshot.ts
 * Gera snapshot consolidado para transparência ou territorial
 */

import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface PublicSnapshot {
  kind: "transparency" | "territory";
  days: number;
  neighborhood?: string | null;
  generated_at: string;
  data: Record<string, unknown>;
}

export type GetPublicSnapshotResult = {
  ok: boolean;
  snapshot: PublicSnapshot | null;
  message?: string;
  reason?: "env-missing" | "rpc-missing" | "db-error";
};

/**
 * Busca snapshot consolidado para compartilhamento
 * Retorna estrutura enxuta, apenas agregados/público
 */
export async function getPublicSnapshot(
  kind: "transparency" | "territory",
  days: number = 30,
  neighborhood?: string
): Promise<GetPublicSnapshotResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      snapshot: null,
      reason: "env-missing",
      message: "Supabase nao configurado. Snapshot indisponivel neste ambiente."
    };
  }

  try {
    const supabase = await getSupabaseServerClient();

    if (!supabase) {
      return {
        ok: false,
        snapshot: null,
        reason: "env-missing",
        message: "Cliente Supabase nao disponivel"
      };
    }

    // Para agora, construir snapshot localmente a partir de queries existentes
    // No futuro, usar uma RPC dedicada public.get_public_snapshot()
    // Por enquanto, degradar com segurança

    const snapshot: PublicSnapshot = {
      kind,
      days,
      neighborhood: neighborhood || null,
      generated_at: new Date().toISOString(),
      data: {} // Dados agregados viriam aqui
    };

    return {
      ok: true,
      snapshot,
      message: "Snapshot gerado."
    };
  } catch (err) {
    console.error("[getPublicSnapshot] error:", err);
    return {
      ok: false,
      snapshot: null,
      reason: "db-error",
      message: "Falha ao gerar snapshot publico."
    };
  }
}
