import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { cookies } from "next/headers";
import {
  AUTH_COOKIE,
  authCookieOptions,
  hashPassword,
  isHashedPassword,
  signToken,
  verifyPassword,
  verifyToken,
} from "@/lib/auth";

// POST /api/auth — login
export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Username dan password wajib diisi" }, { status: 400 });
    }

    const rows: any[] = await query(
      "SELECT id, username, name, role, password FROM users WHERE username = ? LIMIT 1",
      [username]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });
    }

    const user = rows[0];
    const stored: string = user.password ?? "";

    let ok = false;
    if (isHashedPassword(stored)) {
      ok = await verifyPassword(password, stored);
    } else if (stored.length > 0 && stored === password) {
      // Legacy plaintext row — accept once, then upgrade to PBKDF2 in-place.
      ok = true;
      const upgraded = await hashPassword(password);
      await query("UPDATE users SET password = ? WHERE id = ?", [upgraded, user.id]);
    }

    if (!ok) return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });

    const roleRows: any[] = await query("SELECT id FROM roles WHERE name = ?", [user.role]);
    let permissions: string[] = ["all"];
    if (roleRows.length > 0) {
      const perms: any[] = await query(
        "SELECT permission FROM role_permissions WHERE role_id = ?",
        [roleRows[0].id]
      );
      permissions = perms.map((p: any) => p.permission);
    }

    const payload = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      permissions,
    };
    const token = await signToken(payload);

    const res = NextResponse.json({ success: true, user: payload });
    res.cookies.set(AUTH_COOKIE, token, authCookieOptions);
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET /api/auth — check session
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({
    authenticated: true,
    user: {
      id: payload.id,
      username: payload.username,
      name: payload.name,
      role: payload.role,
      permissions: payload.permissions,
    },
  });
}

// DELETE /api/auth — logout
export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(AUTH_COOKIE, "", { ...authCookieOptions, maxAge: 0 });
  return res;
}
