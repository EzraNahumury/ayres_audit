import { NextResponse } from "next/server";
import { callWaWorker } from "@/lib/wa-worker-client";

export async function GET() {
  try {
    const response = await callWaWorker("/status");
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "worker unavailable" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const response = await callWaWorker("/connect", { method: "POST" });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "worker unavailable" }, { status: 500 });
  }
}
