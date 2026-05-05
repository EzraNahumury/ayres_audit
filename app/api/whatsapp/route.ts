import { NextResponse } from "next/server";
import { callWaWorker } from "@/lib/wa-worker-client";
import { query } from "@/lib/db";

interface AccountSnapshot {
  id: number;
  slug: string;
  status: string;
  phone: string | null;
  qr: string | null;
}

interface AccountRow {
  id: number;
  slug: string;
  name: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const qs = id ? `?id=${encodeURIComponent(id)}` : "";

    const response = await callWaWorker(`/status${qs}`);
    const data = await response.json();

    const labels = await query<AccountRow[]>("SELECT id, slug, name FROM wa_accounts ORDER BY id");
    const labelMap = new Map(labels.map((row) => [row.id, row.name]));

    if (id) {
      return NextResponse.json(
        { ...data, name: labelMap.get(Number(id)) || null },
        { status: response.status }
      );
    }

    const accounts = (data?.accounts || []).map((acc: AccountSnapshot) => ({
      ...acc,
      name: labelMap.get(acc.id) || `WA ${acc.id}`,
    }));
    return NextResponse.json({ accounts }, { status: response.status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "worker unavailable" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const id = Number(body?.id);
    if (!id || ![1, 2, 3].includes(id)) {
      return NextResponse.json({ error: "id required (1-3)" }, { status: 400 });
    }

    const response = await callWaWorker("/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "worker unavailable" },
      { status: 500 }
    );
  }
}
