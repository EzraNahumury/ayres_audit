import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/agent/chats — list all chat sessions
export async function GET() {
  try {
    const rows = await query("SELECT id, title, created_at, updated_at FROM agent_chats ORDER BY updated_at DESC");
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/agent/chats — create new chat session
export async function POST(request: Request) {
  try {
    const { title } = await request.json();
    const result: any = await query("INSERT INTO agent_chats (title) VALUES (?)", [title || "Chat Baru"]);
    return NextResponse.json({ id: result.insertId, title: title || "Chat Baru" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
