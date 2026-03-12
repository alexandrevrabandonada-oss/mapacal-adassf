import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";

import { isSupabaseConfigured } from "@/lib/env";
import {
  isValidSidewalkCondition,
  isValidSidewalkTag,
  type SidewalkCondition,
  type SidewalkTagSlug
} from "@/lib/domain/sidewalk";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type CreateReportInput = {
  condition: SidewalkCondition;
  lat: number;
  lng: number;
  neighborhood?: string;
  note?: string;
  accuracy_m?: number;
  tags?: string[];
};

export type CreateReportResult = {
  ok: boolean;
  message: string;
  reportId?: string;
  error?: "env" | "auth" | "validation" | "db";
};

function normalizeTags(tags: string[] | undefined): SidewalkTagSlug[] {
  if (!tags || tags.length === 0) {
    return [];
  }

  const uniqueTags = Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));
  return uniqueTags.filter((tag): tag is SidewalkTagSlug => isValidSidewalkTag(tag));
}

function mapDbError(error: PostgrestError): string {
  if (error.code === "23503") {
    return "Seu perfil ainda nao foi inicializado. Faca login novamente e tente de novo.";
  }
  if (error.code === "42P01") {
    return "Estrutura do banco ainda nao aplicada. Rode os SQLs T02 e T03 no Supabase.";
  }
  return "Falha ao salvar registro no banco. Tente novamente em instantes.";
}

export async function createPendingReport(input: CreateReportInput): Promise<CreateReportResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error: "env",
      message: "Supabase nao configurado. Defina variaveis de ambiente e tente novamente."
    };
  }

  if (!isValidSidewalkCondition(input.condition)) {
    return {
      ok: false,
      error: "validation",
      message: "Condicao invalida."
    };
  }

  if (!Number.isFinite(input.lat) || input.lat < -90 || input.lat > 90) {
    return {
      ok: false,
      error: "validation",
      message: "Latitude invalida."
    };
  }

  if (!Number.isFinite(input.lng) || input.lng < -180 || input.lng > 180) {
    return {
      ok: false,
      error: "validation",
      message: "Longitude invalida."
    };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      error: "env",
      message: "Supabase indisponivel no servidor."
    };
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      error: "auth",
      message: "Voce precisa estar autenticado para enviar um registro."
    };
  }

  const payload: Database["public"]["Tables"]["sidewalk_reports"]["Insert"] = {
    created_by: user.id,
    status: "pending",
    condition: input.condition,
    lat: input.lat,
    lng: input.lng,
    neighborhood: input.neighborhood?.trim() || null,
    note: input.note?.trim() || null,
    accuracy_m: Number.isFinite(input.accuracy_m) ? input.accuracy_m ?? null : null
  };

  const { data: report, error: reportError } = await supabase
    .from("sidewalk_reports")
    .insert(payload)
    .select("id")
    .single();

  if (reportError || !report) {
    return {
      ok: false,
      error: "db",
      message: reportError ? mapDbError(reportError) : "Falha ao criar registro."
    };
  }

  const normalizedTags = normalizeTags(input.tags);

  if (normalizedTags.length > 0) {
    const rows: Database["public"]["Tables"]["sidewalk_report_tags"]["Insert"][] = normalizedTags.map((tag) => ({
      report_id: report.id,
      tag_slug: tag
    }));

    const { error: tagError } = await supabase.from("sidewalk_report_tags").insert(rows);

    if (tagError) {
      return {
        ok: false,
        error: "db",
        reportId: report.id,
        message: "Registro criado, mas nao foi possivel salvar tags. Verifique se o SQL base foi aplicado."
      };
    }
  }

  return {
    ok: true,
    reportId: report.id,
    message: "Registro enviado para moderacao"
  };
}
