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

function sanitizeDisplayName(name: string | null) {
  const normalized = name?.trim() || null;
  if (!normalized) return null;

  if (normalized === "Ayres Apparel Meta Ads") {
    return null;
  }

  return normalized;
}

// PATCH /api/contacts - update contact name
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

type ContactRow = {
  jid: string;
  phone: string;
  name: string | null;
  first_chat_at: string | null;
  assigned_cs_id: number | null;
  assigned_cs_name: string | null;
};

type MessageStatRow = {
  contact_jid: string;
  total_messages: number;
  last_message: string | null;
  last_message_at: string | null;
  last_from_me: number;
};

export async function GET() {
  try {
    const cookieStore = await cookies();
    const user = parseUser(cookieStore.get("auth_token")?.value);
    const isAdmin = user?.permissions?.includes("all") ?? false;

    const contacts = await query<ContactRow[]>(
      `
      SELECT
        c.jid,
        CASE
          WHEN c.jid LIKE '%@lid' THEN COALESCE(lm.phone, c.phone)
          ELSE c.phone
        END AS phone,
        COALESCE(c.name, lm.name) AS name,
        c.created_at AS first_chat_at,
        ca.user_id AS assigned_cs_id,
        u.name AS assigned_cs_name
      FROM contacts c
      LEFT JOIN lid_mapping lm ON lm.lid = REPLACE(c.jid, '@lid', '')
      LEFT JOIN contact_assignments ca ON ca.contact_jid = c.jid
      LEFT JOIN users u ON u.id = ca.user_id
      ${(!isAdmin && user?.id) ? "WHERE ca.user_id = ?" : ""}
      ORDER BY c.created_at DESC
      `,
      (!isAdmin && user?.id) ? [Number(user.id)] : []
    );

    const stats = await query<MessageStatRow[]>(
      `
      SELECT
        m.contact_jid,
        COUNT(*) AS total_messages,
        SUBSTRING_INDEX(GROUP_CONCAT(m.body ORDER BY m.timestamp DESC SEPARATOR '\u0001'), '\u0001', 1) AS last_message,
        MAX(m.timestamp) AS last_message_at,
        SUBSTRING_INDEX(GROUP_CONCAT(m.from_me ORDER BY m.timestamp DESC SEPARATOR ','), ',', 1) AS last_from_me
      FROM messages m
      GROUP BY m.contact_jid
      `
    );

    const statMap = new Map<string, MessageStatRow>();
    for (const stat of stats) {
      statMap.set(stat.contact_jid, {
        ...stat,
        total_messages: Number(stat.total_messages || 0),
        last_from_me: Number(stat.last_from_me || 0),
      });
    }

    const grouped = new Map<string, {
      jid: string;
      phone: string;
      name: string | null;
      first_chat_at: string | null;
      last_message: string | null;
      last_message_at: string | null;
      last_from_me: number;
      total_messages: number;
      assigned_cs_id: number | null;
      assigned_cs_name: string | null;
    }>();

    for (const contact of contacts) {
      const key = contact.phone || contact.jid;
      const stat = statMap.get(contact.jid);
      const existing = grouped.get(key);

      if (!existing) {
        grouped.set(key, {
          jid: contact.jid.endsWith("@s.whatsapp.net") ? contact.jid : contact.jid,
          phone: contact.phone,
          name: sanitizeDisplayName(contact.name),
          first_chat_at: contact.first_chat_at,
          last_message: stat?.last_message || null,
          last_message_at: stat?.last_message_at || null,
          last_from_me: stat?.last_from_me || 0,
          total_messages: stat?.total_messages || 0,
          assigned_cs_id: contact.assigned_cs_id,
          assigned_cs_name: contact.assigned_cs_name,
        });
        continue;
      }

      if (contact.jid.endsWith("@s.whatsapp.net")) {
        existing.jid = contact.jid;
      }
      if (!existing.name && sanitizeDisplayName(contact.name)) {
        existing.name = sanitizeDisplayName(contact.name);
      }
      if (!existing.assigned_cs_id && contact.assigned_cs_id) {
        existing.assigned_cs_id = contact.assigned_cs_id;
        existing.assigned_cs_name = contact.assigned_cs_name;
      }
      if (!existing.first_chat_at || (contact.first_chat_at && contact.first_chat_at < existing.first_chat_at)) {
        existing.first_chat_at = contact.first_chat_at;
      }
      existing.total_messages += stat?.total_messages || 0;
      if (
        stat?.last_message_at &&
        (!existing.last_message_at || new Date(stat.last_message_at).getTime() > new Date(existing.last_message_at).getTime())
      ) {
        existing.last_message = stat.last_message;
        existing.last_message_at = stat.last_message_at;
        existing.last_from_me = stat.last_from_me;
      }
    }

    const rows = Array.from(grouped.values()).sort((a, b) => {
      const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return tb - ta;
    });

    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
