import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isStorageConfigured, getStorageBucketSafe } from "@/lib/env";
import type { SignedUrlResult } from "./storage-types";
import { SIGNED_URL_EXPIRY_SECONDS } from "./storage-types";

/**
 * Gera signed URL para foto de report.
 * Somente para reports published OU para moderadores (exigir check externo).
 * Server-only.
 */
export async function getReportPhotoSignedUrl(
  reportId: string,
  photoPath: string,
  reportStatus: string,
): Promise<SignedUrlResult> {
  if (!isStorageConfigured()) {
    return {
      ok: false,
      message: "Storage nao configurado",
      reason: "env-missing",
    };
  }

  const bucket = getStorageBucketSafe();
  if (!bucket) {
    return {
      ok: false,
      message: "Bucket nao configurado",
      reason: "bucket-missing",
    };
  }

  if (!photoPath) {
    return {
      ok: false,
      message: "Report nao tem foto",
      reason: "no-photo",
    };
  }

  // Validar que report está published (ou permitir moderadores externamente)
  if (reportStatus !== "published") {
    return {
      ok: false,
      message: "Foto disponivel apenas para reports publicados",
      reason: "not-published",
    };
  }

  try {
    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      return {
        ok: false,
        message: "Cliente Supabase nao disponivel",
        reason: "env-missing",
      };
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(photoPath, SIGNED_URL_EXPIRY_SECONDS);

    if (error) {
      console.error("[getReportPhotoSignedUrl] sign error:", error);
      return {
        ok: false,
        message: `Erro ao gerar signed URL: ${error.message}`,
        reason: "sign-error",
      };
    }

    if (!data || !data.signedUrl) {
      return {
        ok: false,
        message: "Signed URL nao gerada",
        reason: "sign-error",
      };
    }

    return {
      ok: true,
      url: data.signedUrl,
      message: "Signed URL gerada com sucesso",
    };
  } catch (err) {
    console.error("[getReportPhotoSignedUrl] error:", err);
    return {
      ok: false,
      message: "Erro interno ao gerar signed URL",
      reason: "sign-error",
    };
  }
}

/**
 * Versão para moderadores: permite signed URL mesmo para reports não publicados.
 * Exige validação externa de permissão de moderador.
 */
export async function getReportPhotoSignedUrlForModerator(
  photoPath: string,
): Promise<SignedUrlResult> {
  if (!isStorageConfigured()) {
    return {
      ok: false,
      message: "Storage nao configurado",
      reason: "env-missing",
    };
  }

  const bucket = getStorageBucketSafe();
  if (!bucket) {
    return {
      ok: false,
      message: "Bucket nao configurado",
      reason: "bucket-missing",
    };
  }

  if (!photoPath) {
    return {
      ok: false,
      message: "Foto nao disponivel",
      reason: "no-photo",
    };
  }

  try {
    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      return {
        ok: false,
        message: "Cliente Supabase nao disponivel",
        reason: "env-missing",
      };
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(photoPath, SIGNED_URL_EXPIRY_SECONDS);

    if (error) {
      console.error("[getReportPhotoSignedUrlForModerator] sign error:", error);
      return {
        ok: false,
        message: `Erro ao gerar signed URL: ${error.message}`,
        reason: "sign-error",
      };
    }

    if (!data || !data.signedUrl) {
      return {
        ok: false,
        message: "Signed URL nao gerada",
        reason: "sign-error",
      };
    }

    return {
      ok: true,
      url: data.signedUrl,
      message: "Signed URL gerada com sucesso",
    };
  } catch (err) {
    console.error("[getReportPhotoSignedUrlForModerator] error:", err);
    return {
      ok: false,
      message: "Erro interno ao gerar signed URL",
      reason: "sign-error",
    };
  }
}
