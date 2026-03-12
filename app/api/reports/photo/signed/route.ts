import { NextResponse } from "next/server";
import { getReportPhotoSignedUrl, getReportPhotoSignedUrlForModerator } from "@/lib/storage/get-report-photo-signed-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";

/**
 * GET /api/reports/photo/signed?reportId=xxx
 * Gera signed URL para foto de report.
 * Publico para reports publicados, moderadores podem ver todos.
 */
export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { ok: false, message: "Supabase nao configurado" },
        { status: 500 },
      );
    }

    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get("reportId");

    if (!reportId) {
      return NextResponse.json(
        { ok: false, message: "reportId obrigatorio" },
        { status: 400 },
      );
    }

    // Buscar report
    const { data: report, error: fetchError } = await supabase
      .from("sidewalk_reports")
      .select("id, status, photo_private_path")
      .eq("id", reportId)
      .single();

    if (fetchError || !report) {
      return NextResponse.json(
        { ok: false, message: "Report nao encontrado" },
        { status: 404 },
      );
    }

    if (!report.photo_private_path) {
      return NextResponse.json(
        { ok: false, message: "Report nao tem foto" },
        { status: 404 },
      );
    }

    // Verificar se user é moderador
    const profile = await getCurrentProfile();
    const isModerator = profile.ok && profile.canModerate;

    let signedResult;

    if (isModerator) {
      // Moderador pode ver qualquer foto
      signedResult = await getReportPhotoSignedUrlForModerator(report.photo_private_path);
    } else {
      // Publico só vê foto se report publicado
      signedResult = await getReportPhotoSignedUrl(
        reportId,
        report.photo_private_path,
        report.status,
      );
    }

    if (!signedResult.ok) {
      return NextResponse.json(signedResult, { status: 403 });
    }

    return NextResponse.json({
      ok: true,
      url: signedResult.url,
      message: signedResult.message,
    });
  } catch (err) {
    console.error("[photo/signed] error:", err);
    return NextResponse.json(
      { ok: false, message: "Erro interno ao gerar signed URL" },
      { status: 500 },
    );
  }
}
