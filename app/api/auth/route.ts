import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { cookies } from "next/headers";

// POST /api/auth — login
export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) return NextResponse.json({ error: "Username dan password wajib diisi" }, { status: 400 });

    const rows: any[] = await query(
      "SELECT id, username, name, role FROM users WHERE username = ? AND password = ? LIMIT 1",
      [username, password]
    );

    if (rows.length === 0) return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });

    const user = rows[0];

    // Get permissions for user's role
    const roleRows: any[] = await query("SELECT id FROM roles WHERE name = ?", [user.role]);
    let permissions: string[] = ["all"]; // default
    if (roleRows.length > 0) {
      const perms: any[] = await query("SELECT permission FROM role_permissions WHERE role_id = ?", [roleRows[0].id]);
      permissions = perms.map((p: any) => p.permission);
    }

    const tokenData = { id: user.id, username: user.username, name: user.name, role: user.role, permissions };
    const token = Buffer.from(JSON.stringify(tokenData)).toString("base64");

    const res = NextResponse.json({ success: true, user: tokenData });
    res.cookies.set("auth_token", token, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 7 });
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET /api/auth — check session
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return NextResponse.json({ authenticated: false }, { status: 401 });

  try {
    const user = JSON.parse(Buffer.from(token, "base64").toString());
    return NextResponse.json({ authenticated: true, user });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

// DELETE /api/auth — logout
export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set("auth_token", "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
