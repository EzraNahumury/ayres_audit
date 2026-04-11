import { NextResponse } from "next/server";
import { query } from "@/lib/db";

async function resolveContactJids(jid: string) {
  const normalizedPhone = jid.replace("@s.whatsapp.net", "").replace("@lid", "");
  const variants = new Set<string>([jid]);

  const contactRows = await query<Array<{ jid: string }>>(
    "SELECT jid FROM contacts WHERE jid = ? OR phone = ?",
    [jid, normalizedPhone]
  );

  for (const row of contactRows) {
    variants.add(row.jid);
  }

  if (jid.endsWith("@lid")) {
    const lid = jid.replace("@lid", "");
    const mappingRows = await query<Array<{ phone: string }>>(
      "SELECT phone FROM lid_mapping WHERE lid = ? AND phone != '' LIMIT 1",
      [lid]
    );

    if (mappingRows[0]?.phone) {
      variants.add(`${mappingRows[0].phone}@s.whatsapp.net`);
    }
  }

  if (jid.endsWith("@s.whatsapp.net")) {
    const mappingRows = await query<Array<{ lid: string }>>(
      "SELECT lid FROM lid_mapping WHERE phone = ?",
      [normalizedPhone]
    );

    for (const row of mappingRows) {
      variants.add(`${row.lid}@lid`);
    }
  }

  return Array.from(variants);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jid = searchParams.get("jid");

  if (!jid) {
    return NextResponse.json({ error: "jid parameter required" }, { status: 400 });
  }

  try {
    const contactJids = await resolveContactJids(jid);
    const placeholders = contactJids.map(() => "?").join(", ");

    const rows = await query(
      `SELECT message_id, contact_jid, sender_jid, from_me, message_type, body, timestamp
       FROM messages
       WHERE contact_jid IN (${placeholders})
       ORDER BY timestamp ASC`,
      contactJids
    );

    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
