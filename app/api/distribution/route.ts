import { NextResponse } from "next/server";
import { query } from "@/lib/db";

function getTodayJakarta() {
  const now = new Date();
  const jakarta = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  return `${jakarta.getFullYear()}-${String(jakarta.getMonth() + 1).padStart(2, "0")}-${String(jakarta.getDate()).padStart(2, "0")}`;
}

type CsUser = {
  id: number;
  name: string;
  username: string;
  is_online?: number;
};

function sanitizeDisplayName(name: string | null) {
  const normalized = name?.trim() || null;
  if (!normalized) return null;

  if (normalized === "Ayres Apparel Meta Ads") {
    return null;
  }

  return normalized;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || getTodayJakarta();

    const csUsers = await query<CsUser[]>(
      `
      SELECT DISTINCT u.id, u.name, u.username, u.is_online
      FROM users u
      INNER JOIN roles r ON r.name = u.role
      INNER JOIN role_permissions rp ON rp.role_id = r.id AND rp.permission = 'audital_work'
      LEFT JOIN cs_attendance ca_log ON ca_log.user_id = u.id AND ca_log.date = ?
      WHERE (? = ? AND u.is_online = 1) OR (? <> ? AND ca_log.user_id IS NOT NULL)
      ORDER BY u.name ASC
      `,
      [date, date, getTodayJakarta(), date, getTodayJakarta()]
    );

    const result = await Promise.all(
      csUsers.map(async (cs) => {
        const contacts = await query<any[]>(
          `
          SELECT
            picked.jid,
            picked.phone,
            picked.name,
            picked.assigned_at,
            picked.last_message_at,
            picked.total_messages
          FROM (
            SELECT
              c.phone AS group_phone,
              c.jid,
              CASE
                WHEN c.jid LIKE '%@lid' THEN COALESCE(lm.phone, c.phone)
                ELSE c.phone
              END AS phone,
              COALESCE(c.name, lm.name) AS name,
              ca.assigned_at,
              MAX(m.timestamp) AS last_message_at,
              COUNT(m.id) AS total_messages,
              ROW_NUMBER() OVER (
                PARTITION BY c.phone
                ORDER BY
                  CASE WHEN c.jid LIKE '%@s.whatsapp.net' THEN 0 ELSE 1 END,
                  MAX(m.timestamp) DESC,
                  c.id DESC
              ) AS rn
            FROM contact_assignments ca
            INNER JOIN contacts c ON c.jid = ca.contact_jid
            LEFT JOIN lid_mapping lm ON lm.lid = REPLACE(c.jid, '@lid', '')
            INNER JOIN contacts c_all ON c_all.phone = c.phone
            INNER JOIN messages m ON m.contact_jid = c_all.jid
            WHERE ca.user_id = ?
              AND DATE(CONVERT_TZ(m.timestamp, '+00:00', '+07:00')) = ?
            GROUP BY c.phone, c.jid, phone, name, ca.assigned_at, c.id
          ) picked
          WHERE picked.rn = 1
          ORDER BY picked.last_message_at DESC
          `,
          [cs.id, date]
        );

        return {
          ...cs,
          contacts: contacts.map((contact) => ({
            ...contact,
            name: sanitizeDisplayName(contact.name),
          })),
          contact_count: contacts.length,
        };
      })
    );

    return NextResponse.json({ cs_agents: result, filtered_date: date });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const unassigned = await query<any[]>(
      `
      SELECT c.jid
      FROM contacts c
      LEFT JOIN contact_assignments ca ON ca.contact_jid = c.jid
      WHERE ca.user_id IS NULL
      ORDER BY c.created_at ASC
      `
    );

    if (unassigned.length === 0) {
      return NextResponse.json({ assigned: 0 });
    }

    let assigned = 0;
    for (const contact of unassigned) {
      const csUsers = await query<any[]>(
        `
        SELECT DISTINCT u.id, COUNT(ca.contact_jid) AS load_count
        FROM users u
        INNER JOIN roles r ON r.name = u.role
        INNER JOIN role_permissions rp ON rp.role_id = r.id AND rp.permission = 'audital_work'
        LEFT JOIN contact_assignments ca ON ca.user_id = u.id
        WHERE u.is_online = 1
        GROUP BY u.id
        ORDER BY load_count ASC
        LIMIT 1
        `
      );

      if (csUsers.length > 0) {
        await query(
          "INSERT IGNORE INTO contact_assignments (contact_jid, user_id) VALUES (?, ?)",
          [contact.jid, csUsers[0].id]
        );
        assigned++;
      }
    }

    return NextResponse.json({ assigned });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
