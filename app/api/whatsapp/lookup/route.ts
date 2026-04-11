import { NextResponse } from "next/server";
import { callWaWorker } from "@/lib/wa-worker-client";

// GET /api/whatsapp/lookup?phone=6282338142821 — check onWhatsApp
// GET /api/whatsapp/lookup?dump=1 — dump all store contacts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");
  const dump = searchParams.get("dump");

  try {
    const qs = dump ? "?dump=1" : phone ? `?phone=${encodeURIComponent(phone)}` : "";
    const response = await callWaWorker(`/lookup${qs}`);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "lookup failed" }, { status: 500 });
  }
}
