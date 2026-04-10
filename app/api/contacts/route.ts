import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { cookies } from "next/headers";

function parseUser(token: string | undefined) {
  if (!token) return null;
  try {
    return JSON.parse(Buffer.from(token, "base64").toString());
  } catch {
    return null;
  }
}

// PATCH /api/contacts — update contact name
export async function PATCH(request: Request) {
  try {
    const { jid, name } = await request.json();
    if (!jid || !name?.trim()) {
      return NextResponse.json({ error: "jid dan name wajib diisi" }, { status: 400 });
    }
    await query("UPDATE contacts SET name = ? WHERE jid = ?", [name.trim(), jid]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET /api/contacts
// Admin → semua kontak
// CS   → hanya kontak yang di-assign ke mereka
export async function GET() {
  try {
    const cookieStore = await cookies();
    const user = parseUser(cookieStore.get("auth_token")?.value);
    const isAdmin = user?.permissions?.includes("all") ?? false;

    // CS filter: only their assigned contacts
    const whereClause = (!isAdmin && user?.id)
      ? `WHERE ca.user_id = ${Number(user.id)}`
      : "";

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
        (SELECT COUNT(*) FROM messages WHERE contact_jid = c.jid) AS total_messages,
        ca.user_id AS assigned_cs_id,
        u.name AS assigned_cs_name
      FROM contacts c
      LEFT JOIN lid_mapping lm ON lm.lid = REPLACE(c.jid, '@lid', '')
      LEFT JOIN messages m_last ON m_last.id = (
        SELECT id FROM messages WHERE contact_jid = c.jid ORDER BY timestamp DESC LIMIT 1
      )
      LEFT JOIN contact_assignments ca ON ca.contact_jid = c.jid
      LEFT JOIN users u ON u.id = ca.user_id
      ${whereClause}
      ORDER BY m_last.timestamp DESC
    `);

    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
