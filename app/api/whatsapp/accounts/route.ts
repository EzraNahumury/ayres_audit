import { NextResponse } from "next/server";
import { query } from "@/lib/db";

interface AccountRow {
  id: number;
  slug: string;
  name: string;
  phone: string | null;
  status: string;
  connected_at: string | null;
}

export async function GET() {
  try {
    const rows = await query<AccountRow[]>(
      "SELECT id, slug, name, phone, status, connected_at FROM wa_accounts ORDER BY id"
    );
    return NextResponse.json({ accounts: rows });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "fetch failed" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, name } = await request.json();
    const accId = Number(id);
    const newName = String(name || "").trim();

    if (!accId || ![1, 2, 3].includes(accId)) {
      return NextResponse.json({ error: "id required (1-3)" }, { status: 400 });
    }
    if (!newName) {
      return NextResponse.json({ error: "name required" }, { status: 400 });
    }
    if (newName.length > 100) {
      return NextResponse.json({ error: "name too long (max 100)" }, { status: 400 });
    }

    await query("UPDATE wa_accounts SET name = ? WHERE id = ?", [newName, accId]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "update failed" },
      { status: 500 }
    );
  }
}
