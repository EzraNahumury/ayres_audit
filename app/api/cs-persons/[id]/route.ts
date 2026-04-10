import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// PATCH /api/cs-persons/[id] — toggle online/offline status
export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = Number(id);
    if (!userId) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

    await query("UPDATE users SET is_online = 1 - is_online WHERE id = ?", [userId]);

    const rows = await query<any[]>("SELECT is_online FROM users WHERE id = ? LIMIT 1", [userId]);
    const isOnline = rows[0]?.is_online ?? 0;

    // Record attendance when CS goes online
    if (isOnline === 1) {
      await query(
        "INSERT IGNORE INTO cs_attendance (user_id, date) VALUES (?, CURDATE())",
        [userId]
      );
    }

    return NextResponse.json({ success: true, is_online: isOnline });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/cs-persons/[id] — remove CS user and unassign their contacts
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = Number(id);
    if (!userId) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

    await query("DELETE FROM contact_assignments WHERE user_id = ?", [userId]);
    await query("DELETE FROM users WHERE id = ?", [userId]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
