import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// PUT /api/roles/[id] — update role
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { name, description, permissions } = await request.json();
    await query("UPDATE roles SET name = ?, description = ? WHERE id = ? AND is_system = 0", [name, description, id]);

    // Replace permissions
    await query("DELETE FROM role_permissions WHERE role_id = ?", [id]);
    if (permissions && Array.isArray(permissions)) {
      for (const perm of permissions) {
        await query("INSERT INTO role_permissions (role_id, permission) VALUES (?, ?)", [id, perm]);
      }
    }

    // Update users with this role
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/roles/[id] — delete role
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    // Don't delete system roles
    const roles: any[] = await query("SELECT is_system, name FROM roles WHERE id = ?", [id]);
    if (roles[0]?.is_system) return NextResponse.json({ error: "Tidak bisa menghapus role sistem" }, { status: 403 });

    // Move users to Super Admin before deleting
    await query("UPDATE users SET role = 'Super Admin' WHERE role = ?", [roles[0]?.name]);
    await query("DELETE FROM role_permissions WHERE role_id = ?", [id]);
    await query("DELETE FROM roles WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
