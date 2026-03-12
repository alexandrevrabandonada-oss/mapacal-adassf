import { NextResponse } from "next/server";

import { getTimelineSeries } from "@/lib/reports/get-timeline-series";

function normalizeBucket(bucket: string | null): "day" | "week" {
  return bucket === "week" ? "week" : "day";
}

function toCsvCell(value: string | number) {
  const text = String(value);
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replace(/\"/g, '""')}"`;
  }
  return text;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const daysParam = searchParams.get("days");
    const neighborhood = searchParams.get("neighborhood") || undefined;
    const bucket = normalizeBucket(searchParams.get("bucket"));

    const days = daysParam ? parseInt(daysParam, 10) : 90;

    const result = await getTimelineSeries(days, bucket, neighborhood);

    if (!result.ok || result.reason === "env-missing") {
      return NextResponse.json(
        { ok: false, message: result.message || "Export timeline indisponivel" },
        { status: 503 }
      );
    }

    if (result.reason === "rpc-missing") {
      return NextResponse.json(
        { ok: false, message: "RPC nao disponivel. Aplique T12_timeline_hotspots.sql no Supabase SQL Editor." },
        { status: 500 }
      );
    }

    const headers = [
      "bucket_start",
      "published_count",
      "verified_count",
      "blocked_count",
      "bad_count",
      "good_count",
      "with_photo_count"
    ];

    const lines = [headers.join(",")];

    for (const row of result.items) {
      lines.push(
        [
          toCsvCell(row.bucket_start),
          toCsvCell(row.published_count),
          toCsvCell(row.verified_count),
          toCsvCell(row.blocked_count),
          toCsvCell(row.bad_count),
          toCsvCell(row.good_count),
          toCsvCell(row.with_photo_count)
        ].join(",")
      );
    }

    const csv = lines.join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="timeline-${days}d-${bucket}.csv"`
      }
    });
  } catch {
    return NextResponse.json({ ok: false, message: "Erro interno" }, { status: 500 });
  }
}
