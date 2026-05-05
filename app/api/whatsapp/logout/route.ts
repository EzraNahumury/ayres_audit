import { NextResponse } from "next/server";
import { callWaWorker } from "@/lib/wa-worker-client";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const id = Number(body?.id);
    if (!id || ![1, 2, 3].includes(id)) {
      return NextResponse.json({ error: "id required (1-3)" }, { status: 400 });
    }

    const response = await callWaWorker("/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "logout failed" },
      { status: 500 }
    );
  }
}
