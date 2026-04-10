import { NextResponse } from "next/server";
import { query } from "@/lib/db";

const CS_ROLE_NAME = "CS";

// Ensure the CS role exists with audital_work permission
async function ensureCSRole() {
  const existing = await query<any[]>("SELECT id FROM roles WHERE name = ? LIMIT 1", [CS_ROLE_NAME]);
  let roleId: number;
  if (existing.length === 0) {
    const result: any = await query(
      "INSERT INTO roles (name, description, is_system) VALUES (?, ?, 0)",
      [CS_ROLE_NAME, "Customer Service - menangani chat masuk"]
    );
    roleId = result.insertId;
  } else {
    roleId = existing[0].id;
  }
  // Ensure audital_work permission exists for this role (check first to avoid duplicates)
  const permExists = await query<any[]>(
    "SELECT id FROM role_permissions WHERE role_id = ? AND permission = 'audital_work' LIMIT 1",
    [roleId]
  );
  if (permExists.length === 0) {
    await query(
      "INSERT INTO role_permissions (role_id, permission) VALUES (?, 'audital_work')",
      [roleId]
    );
  }
}

// GET /api/cs-persons — list all CS users
export async function GET() {
  try {
    const persons = await query<any[]>(`
      SELECT u.id, u.name, u.username, u.role, u.is_online,
        COUNT(ca.contact_jid) AS assigned_contacts
      FROM users u
      INNER JOIN roles r ON r.name = u.role
      INNER JOIN role_permissions rp ON rp.role_id = r.id AND rp.permission = 'audital_work'
      LEFT JOIN contact_assignments ca ON ca.user_id = u.id
      GROUP BY u.id, u.name, u.username, u.role, u.is_online
      ORDER BY u.name ASC
    `);

    return NextResponse.json({ persons });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/cs-persons — create a new CS user (role CS auto-created if needed)
export async function POST(request: Request) {
  try {
    const { name, username, password } = await request.json();
    if (!name || !username || !password) {
      return NextResponse.json({ error: "Nama, username, dan password wajib diisi" }, { status: 400 });
    }

    await ensureCSRole();

    await query(
      "INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)",
      [username, password, name, CS_ROLE_NAME]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.code === "ER_DUP_ENTRY") return NextResponse.json({ error: "Username sudah dipakai" }, { status: 409 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
