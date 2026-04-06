import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// POST /api/roles/users — create user with role
export async function POST(request: Request) {
  try {
    const { username, password, name, role } = await request.json();
    if (!username || !password || !role) {
      return NextResponse.json({ error: "username, password, role wajib diisi" }, { status: 400 });
    }

    await query(
      "INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)",
      [username, password, name || username, role]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.code === "ER_DUP_ENTRY") return NextResponse.json({ error: "Username sudah ada" }, { status: 409 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
