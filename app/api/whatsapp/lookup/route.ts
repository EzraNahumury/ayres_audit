import { NextResponse } from "next/server";
import { getWaState } from "@/lib/wa-state";

// GET /api/whatsapp/lookup?phone=6282338142821 — check onWhatsApp
// GET /api/whatsapp/lookup?dump=1 — dump all store contacts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");
  const dump = searchParams.get("dump");

  const state = getWaState();
  if (!state.socket || state.status !== "connected") {
    return NextResponse.json({ error: "not connected" }, { status: 503 });
  }

  // Dump all contacts from store
  if (dump) {
    const contacts = state.store?.contacts || {};
    const list = Object.entries(contacts).map(([key, val]: any) => ({
      id: key,
      lid: val?.lid || null,
      notify: val?.notify || null,
      name: val?.name || null,
      verifiedName: val?.verifiedName || null,
    }));
    return NextResponse.json({ total: list.length, contacts: list });
  }

  // Lookup phone
  if (phone) {
    try {
      const result = await state.socket.onWhatsApp(phone);
      return NextResponse.json({ input: phone, result });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "pass phone or dump=1" }, { status: 400 });
}
