import { NextResponse } from "next/server";
import { callWaWorker } from "@/lib/wa-worker-client";

export async function POST() {
  try {
    const response = await callWaWorker("/logout", { method: "POST" });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "logout failed" }, { status: 500 });
  }
}
