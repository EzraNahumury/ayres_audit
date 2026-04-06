import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/messages?jid=628xxx@s.whatsapp.net — ambil chat history per kontak
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jid = searchParams.get("jid");

  if (!jid) {
    return NextResponse.json({ error: "jid parameter required" }, { status: 400 });
  }

  try {
    const rows = await query(
      `SELECT message_id, contact_jid, sender_jid, from_me, message_type, body, timestamp
       FROM messages
       WHERE contact_jid = ?
       ORDER BY timestamp ASC`,
      [jid]
    );
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
