import { NextResponse } from "next/server";
import { initDatabase } from "@/lib/init-db";

export async function POST() {
  try {
    await initDatabase();
    return NextResponse.json({ success: true, message: "Database & tabel berhasil dibuat" });
  } catch (err: any) {
    console.error("DB init error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
