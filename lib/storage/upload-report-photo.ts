import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isStorageConfigured, getStorageBucketSafe } from "@/lib/env";
import type { UploadPhotoResult } from "./storage-types";
import { MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from "./storage-types";

/**
 * Upload de foto privada para bucket.
 * Path formato: reports/{userId}/{reportId}/{timestamp}-{filename}
 * Server-only, exige auth.
 */
export async function uploadReportPhoto(
  file: File,
  userId: string,
  reportId: string,
): Promise<UploadPhotoResult> {
  if (!isStorageConfigured()) {
    return {
      ok: false,
      message: "Storage nao configurado (env ausente)",
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

  // Validar tipo de arquivo
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      ok: false,
      message: `Tipo de arquivo invalido. Permitidos: ${ALLOWED_MIME_TYPES.join(", ")}`,
      reason: "invalid-file",
    };
  }

  // Validar tamanho
  if (file.size > MAX_FILE_SIZE) {
    return {
      ok: false,
      message: `Arquivo muito grande. Maximo: ${MAX_FILE_SIZE / 1024 / 1024} MB`,
      reason: "file-too-large",
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

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return {
        ok: false,
        message: "Autenticacao necessaria e userId deve corresponder",
        reason: "auth-required",
      };
    }

    // Gerar path seguro
    const timestamp = Date.now();
    const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `reports/${userId}/${reportId}/${timestamp}-${safeFilename}`;

    // Upload
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      console.error("[uploadReportPhoto] upload error:", error);
      return {
        ok: false,
        message: `Erro ao fazer upload: ${error.message}`,
        reason: "upload-error",
      };
    }

    return {
      ok: true,
      path: data.path,
      message: "Upload realizado com sucesso",
    };
  } catch (err) {
    console.error("[uploadReportPhoto] error:", err);
    return {
      ok: false,
      message: "Erro interno ao fazer upload",
      reason: "upload-error",
    };
  }
}
