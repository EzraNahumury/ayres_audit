import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/roles — list all roles with permissions & user count
export async function GET() {
  try {
    const roles: any[] = await query(`
      SELECT r.*,
        (SELECT COUNT(*) FROM users WHERE role = r.name) as user_count
      FROM roles r ORDER BY r.id
    `);

    for (const role of roles) {
      const perms: any[] = await query("SELECT permission FROM role_permissions WHERE role_id = ?", [role.id]);
      role.permissions = perms.map((p: any) => p.permission);
    }

    return NextResponse.json(roles);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/roles — create new role
export async function POST(request: Request) {
  try {
    const { name, description, permissions } = await request.json();
    if (!name) return NextResponse.json({ error: "Nama role wajib diisi" }, { status: 400 });

    const result: any = await query("INSERT INTO roles (name, description) VALUES (?, ?)", [name, description || ""]);
    const roleId = result.insertId;

    if (permissions && Array.isArray(permissions)) {
      for (const perm of permissions) {
        await query("INSERT INTO role_permissions (role_id, permission) VALUES (?, ?)", [roleId, perm]);
      }
    }

    return NextResponse.json({ success: true, id: roleId });
  } catch (err: any) {
    if (err.code === "ER_DUP_ENTRY") return NextResponse.json({ error: "Role sudah ada" }, { status: 409 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
