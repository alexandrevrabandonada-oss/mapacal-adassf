import { NextResponse } from "next/server";

import { findNearbyPublishedReports } from "@/lib/reports/find-nearby";

type NearbyRequestBody = {
  lat?: number;
  lng?: number;
  meters?: number;
};

export async function POST(request: Request) {
  let body: NearbyRequestBody;

  try {
    body = (await request.json()) as NearbyRequestBody;
  } catch {
    return NextResponse.json({ ok: false, reports: [], message: "Payload invalido." }, { status: 400 });
  }

  if (!Number.isFinite(body.lat) || !Number.isFinite(body.lng)) {
    return NextResponse.json(
      { ok: false, reports: [], reason: "validation", message: "Latitude e longitude sao obrigatorias." },
      { status: 400 }
    );
  }

  const lat = body.lat;
  const lng = body.lng;

  if (typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json(
      { ok: false, reports: [], reason: "validation", message: "Latitude e longitude invalidas." },
      { status: 400 }
    );
  }

  const result = await findNearbyPublishedReports(lat, lng, body.meters ?? 25);
  const status = result.ok ? 200 : 500;

  return NextResponse.json(result, { status });
}
