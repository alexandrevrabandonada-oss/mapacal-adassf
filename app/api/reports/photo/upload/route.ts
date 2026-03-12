import { NextResponse } from "next/server";
import { uploadReportPhoto } from "@/lib/storage/upload-report-photo";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/reports/photo/upload
 * Upload de foto privada para report existente.
 * Exige auth, multipart/form-data com "file", "reportId".
 * Atualiza photo_private_path do report.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { ok: false, message: "Supabase nao configurado" },
        { status: 500 },
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, message: "Autenticacao necessaria" },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const reportId = formData.get("reportId") as string | null;

    if (!file) {
      return NextResponse.json(
        { ok: false, message: "Arquivo obrigatorio" },
        { status: 400 },
      );
    }

    if (!reportId) {
      return NextResponse.json(
        { ok: false, message: "reportId obrigatorio" },
        { status: 400 },
      );
    }

    // Verificar que report existe e pertence ao user
    const { data: report, error: fetchError } = await supabase
      .from("sidewalk_reports")
      .select("id, user_id")
      .eq("id", reportId)
      .single();

    if (fetchError || !report) {
      return NextResponse.json(
        { ok: false, message: "Report nao encontrado" },
        { status: 404 },
      );
    }

    if (report.user_id !== user.id) {
      return NextResponse.json(
        { ok: false, message: "Report nao pertence ao usuario" },
        { status: 403 },
      );
    }

    // Upload
    const uploadResult = await uploadReportPhoto(file, user.id, reportId);

    if (!uploadResult.ok) {
      return NextResponse.json(uploadResult, { status: 400 });
    }

    // Atualizar photo_private_path do report
    const { error: updateError } = await supabase
      .from("sidewalk_reports")
      .update({ photo_private_path: uploadResult.path })
      .eq("id", reportId);

    if (updateError) {
      console.error("[photo/upload] update error:", updateError);
      return NextResponse.json(
        { ok: false, message: "Erro ao atualizar report com photo path" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Foto enviada com sucesso",
      path: uploadResult.path,
    });
  } catch (err) {
    console.error("[photo/upload] error:", err);
    return NextResponse.json(
      { ok: false, message: "Erro interno ao processar upload" },
      { status: 500 },
    );
  }
}
