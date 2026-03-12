import { NextResponse } from "next/server";

import { createPendingReport } from "@/lib/reports/create-report";
import { isValidSidewalkCondition } from "@/lib/domain/sidewalk";

type CreateRequestBody = {
  condition?: string;
  lat?: number;
  lng?: number;
  neighborhood?: string;
  note?: string;
  accuracy_m?: number;
  tags?: string[];
};

export async function POST(request: Request) {
  let body: CreateRequestBody;

  try {
    body = (await request.json()) as CreateRequestBody;
  } catch {
    return NextResponse.json({ ok: false, message: "Payload invalido." }, { status: 400 });
  }

  if (!body.condition || !isValidSidewalkCondition(body.condition)) {
    return NextResponse.json({ ok: false, message: "Condicao invalida." }, { status: 400 });
  }

  if (!Number.isFinite(body.lat) || !Number.isFinite(body.lng)) {
    return NextResponse.json({ ok: false, message: "Latitude e longitude sao obrigatorias." }, { status: 400 });
  }

  const lat = body.lat;
  const lng = body.lng;

  if (typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json({ ok: false, message: "Latitude e longitude invalidas." }, { status: 400 });
  }

  const result = await createPendingReport({
    condition: body.condition,
    lat,
    lng,
    neighborhood: body.neighborhood,
    note: body.note,
    accuracy_m: body.accuracy_m,
    tags: Array.isArray(body.tags) ? body.tags : []
  });

  const status = result.ok ? 200 : result.error === "auth" ? 401 : result.error === "validation" ? 400 : 500;
  return NextResponse.json(result, { status });
}
