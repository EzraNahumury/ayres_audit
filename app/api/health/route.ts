import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

// GET /api/health — keep-alive endpoint for UptimeRobot / Hostinger health checks.
// Returns 200 when the process is up and MySQL is reachable, 503 otherwise.
export async function GET() {
  const startedAt = Date.now();
  try {
    const conn = await getPool().getConnection();
    try {
      await conn.ping();
    } finally {
      conn.release();
    }
    return NextResponse.json({
      ok: true,
      uptime: Math.round(process.uptime()),
      db: "ok",
      latencyMs: Date.now() - startedAt,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, db: "error", error: err.message ?? String(err) },
      { status: 503 }
    );
  }
}

export const dynamic = "force-dynamic";
