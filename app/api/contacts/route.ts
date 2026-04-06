import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const rows = await query(`
      SELECT
        c.jid,
        CASE
          WHEN c.jid LIKE '%@lid' THEN COALESCE(lm.phone, c.phone)
          ELSE c.phone
        END AS phone,
        COALESCE(c.name, lm.name) AS name,
        c.created_at AS first_chat_at,
        m_last.body AS last_message,
        m_last.timestamp AS last_message_at,
        m_last.from_me AS last_from_me,
        (SELECT COUNT(*) FROM messages WHERE contact_jid = c.jid) AS total_messages
      FROM contacts c
      LEFT JOIN lid_mapping lm ON lm.lid = REPLACE(c.jid, '@lid', '')
      LEFT JOIN messages m_last ON m_last.id = (
        SELECT id FROM messages WHERE contact_jid = c.jid ORDER BY timestamp DESC LIMIT 1
      )
      ORDER BY m_last.timestamp DESC
    `);
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
