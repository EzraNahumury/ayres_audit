import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/distribution?date=YYYY-MM-DD — list CS with their assigned contacts
// If date provided: show CS online on that date + contacts assigned that day
// If no date: show current state (all CS + total contacts)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date"); // e.g. "2026-04-10"

    let csUsers: any[];

    if (date) {
      // CS who were online on that specific date (from attendance log)
      csUsers = await query<any[]>(`
        SELECT DISTINCT u.id, u.name, u.username
        FROM users u
        INNER JOIN cs_attendance ca_log ON ca_log.user_id = u.id AND ca_log.date = ?
        ORDER BY u.name ASC
      `, [date]);
    } else {
      // All CS agents
      csUsers = await query<any[]>(`
        SELECT DISTINCT u.id, u.name, u.username, u.is_online
        FROM users u
        INNER JOIN roles r ON r.name = u.role
        INNER JOIN role_permissions rp ON rp.role_id = r.id AND rp.permission = 'audital_work'
        ORDER BY u.name ASC
      `);
    }

    const result = await Promise.all(
      csUsers.map(async (cs) => {
        let contacts: any[];

        if (date) {
          // Contacts assigned to this CS on that specific date
          contacts = await query<any[]>(`
            SELECT
              c.jid,
              CASE WHEN c.jid LIKE '%@lid' THEN COALESCE(lm.phone, c.phone) ELSE c.phone END AS phone,
              COALESCE(c.name, lm.name) AS name,
              ca.assigned_at,
              (SELECT COUNT(*) FROM messages WHERE contact_jid = c.jid) AS total_messages
            FROM contact_assignments ca
            INNER JOIN contacts c ON c.jid = ca.contact_jid
            LEFT JOIN lid_mapping lm ON lm.lid = REPLACE(c.jid, '@lid', '')
            WHERE ca.user_id = ? AND DATE(ca.assigned_at) = ?
            ORDER BY ca.assigned_at DESC
          `, [cs.id, date]);
        } else {
          // All contacts assigned to this CS
          contacts = await query<any[]>(`
            SELECT
              c.jid,
              CASE WHEN c.jid LIKE '%@lid' THEN COALESCE(lm.phone, c.phone) ELSE c.phone END AS phone,
              COALESCE(c.name, lm.name) AS name,
              m_last.timestamp AS last_message_at,
              (SELECT COUNT(*) FROM messages WHERE contact_jid = c.jid) AS total_messages
            FROM contact_assignments ca
            INNER JOIN contacts c ON c.jid = ca.contact_jid
            LEFT JOIN lid_mapping lm ON lm.lid = REPLACE(c.jid, '@lid', '')
            LEFT JOIN messages m_last ON m_last.id = (
              SELECT id FROM messages WHERE contact_jid = c.jid ORDER BY timestamp DESC LIMIT 1
            )
            WHERE ca.user_id = ?
            ORDER BY m_last.timestamp DESC
          `, [cs.id]);
        }

        return { ...cs, contacts, contact_count: contacts.length };
      })
    );

    return NextResponse.json({ cs_agents: result, filtered_date: date });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/distribution — auto-distribute all unassigned contacts to CS (least-loaded first)
export async function POST() {
  try {
    const unassigned = await query<any[]>(`
      SELECT c.jid FROM contacts c
      LEFT JOIN contact_assignments ca ON ca.contact_jid = c.jid
      WHERE ca.user_id IS NULL
      ORDER BY c.created_at ASC
    `);

    if (unassigned.length === 0) {
      return NextResponse.json({ assigned: 0 });
    }

    let assigned = 0;
    for (const contact of unassigned) {
      const csUsers = await query<any[]>(`
        SELECT DISTINCT u.id, COUNT(ca.contact_jid) AS load_count
        FROM users u
        INNER JOIN roles r ON r.name = u.role
        INNER JOIN role_permissions rp ON rp.role_id = r.id AND rp.permission = 'audital_work'
        LEFT JOIN contact_assignments ca ON ca.user_id = u.id
        WHERE u.is_online = 1
        GROUP BY u.id
        ORDER BY load_count ASC
        LIMIT 1
      `);

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
