import { NextResponse } from "next/server";
import { callWaWorker } from "@/lib/wa-worker-client";

export async function POST(request: Request) {
  try {
    const { jid, message } = await request.json();
    if (!jid || !message) return NextResponse.json({ error: "jid and message required" }, { status: 400 });

    const response = await callWaWorker("/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jid, message }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    console.error("[WA] Send error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "send failed" }, { status: 500 });
  }
}
