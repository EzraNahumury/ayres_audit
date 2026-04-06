import { NextResponse } from "next/server";
import { getWaState } from "@/lib/wa-state";

export async function POST(request: Request) {
  try {
    const { jid, message } = await request.json();
    if (!jid || !message) return NextResponse.json({ error: "jid and message required" }, { status: 400 });

    const state = getWaState();
    if (state.status !== "connected" || !state.socket) {
      return NextResponse.json({ error: "WhatsApp not connected" }, { status: 503 });
    }

    await state.socket.sendMessage(jid, { text: message });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[WA] Send error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
