import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/messages/stats?month=2026-04
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");

  try {
    let sql = `
      SELECT
        DATE(CONVERT_TZ(timestamp, '+00:00', '+07:00')) as date,
        COUNT(DISTINCT contact_jid) as contacts,
        COUNT(*) as messages
      FROM messages
    `;
    const params: string[] = [];

    if (month) {
      sql += ` WHERE DATE_FORMAT(CONVERT_TZ(timestamp, '+00:00', '+07:00'), '%Y-%m') = ?`;
      params.push(month);
    }

    sql += ` GROUP BY DATE(CONVERT_TZ(timestamp, '+00:00', '+07:00')) ORDER BY date`;

    const rows = await query(sql, params);
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
