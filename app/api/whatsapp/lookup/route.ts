import { NextResponse } from "next/server";
import { callWaWorker } from "@/lib/wa-worker-client";

// GET /api/whatsapp/lookup?id=1&phone=6282338142821 — onWhatsApp check via account 1
// GET /api/whatsapp/lookup?id=1&dump=1 — dump store contacts of account 1
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  const phone = searchParams.get("phone");
  const dump = searchParams.get("dump");

  if (!id || ![1, 2, 3].includes(id)) {
    return NextResponse.json({ error: "id required (1-3)" }, { status: 400 });
  }

  try {
    const params = new URLSearchParams({ id: String(id) });
    if (dump) params.set("dump", "1");
    if (phone) params.set("phone", phone);

    const response = await callWaWorker(`/lookup?${params.toString()}`);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "lookup failed" },
      { status: 500 }
    );
  }
}
