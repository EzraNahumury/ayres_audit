import { NextResponse } from "next/server";
import { getWaState } from "@/lib/wa-state";
import path from "path";

export async function POST() {
  const state = getWaState();

  if (state.socket) {
    try { state.socket.ws?.close(); } catch { /* ignore */ }
    state.socket = null;
  }

  state.status = "disconnected";
  state.qr = null;
  state.connecting = false;
  state.initialized = false;
  state.store = null;

  try {
    const fs = await import("fs");
    fs.rmSync(path.join(process.cwd(), "wa_sessions"), { recursive: true, force: true });
  } catch { /* ignore */ }

  return NextResponse.json({ success: true });
}
