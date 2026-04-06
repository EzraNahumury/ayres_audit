import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/agent/chats/[id] — get messages for a chat
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const messages = await query("SELECT id, role, content, created_at FROM agent_messages WHERE chat_id = ? ORDER BY id ASC", [id]);
    return NextResponse.json(messages);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/agent/chats/[id] — delete a chat
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await query("DELETE FROM agent_messages WHERE chat_id = ?", [id]);
    await query("DELETE FROM agent_chats WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
