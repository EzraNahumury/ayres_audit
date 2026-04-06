import { NextResponse } from "next/server";
import path from "path";

// ---------------------------------------------------------------------------
// In-memory state
// ---------------------------------------------------------------------------
type WAStatus = "waiting" | "connected" | "disconnected";

interface WAState {
  qr: string | null;
  status: WAStatus;
  socket: ReturnType<typeof import("@whiskeysockets/baileys").default> | null;
  connecting: boolean;
}

const state: WAState = {
  qr: null,
  status: "disconnected",
  socket: null,
  connecting: false,
};

const SESSION_DIR = path.join(process.cwd(), "wa_sessions");

// ---------------------------------------------------------------------------
// Start Baileys connection
// ---------------------------------------------------------------------------
async function startConnection() {
  if (state.connecting) return;
  state.connecting = true;
  state.qr = null;
  state.status = "waiting";

  try {
    const baileys = await import("@whiskeysockets/baileys");
    const makeWASocket = baileys.default;
    const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = baileys;
    const QRCode = await import("qrcode");
    const P = await import("pino");
    const pino = P.default || P;

    const logger = pino({ level: "silent" });
    const { version } = await fetchLatestBaileysVersion();
    const { state: authState, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

    const sock = makeWASocket({
      version,
      auth: authState,
      printQRInTerminal: false,
      logger,
      browser: ["Ayres Audit", "Chrome", "4.0.0"],
      connectTimeoutMs: 60000,
      qrTimeout: 60000,
    });

    state.socket = sock;

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, qr, lastDisconnect } = update;

      if (qr) {
        try {
          state.qr = await QRCode.toDataURL(qr, { width: 300, margin: 2 });
          state.status = "waiting";
        } catch {
          // ignore
        }
      }

      if (connection === "open") {
        state.status = "connected";
        state.qr = null;
        state.connecting = false;
      }

      if (connection === "close") {
        state.qr = null;
        state.connecting = false;

        const statusCode =
          (lastDisconnect?.error as any)?.output?.statusCode ?? 0;

        if (statusCode === DisconnectReason.loggedOut) {
          // Logged out — clean session
          state.status = "disconnected";
          state.socket = null;
          try {
            const fs = await import("fs");
            fs.rmSync(SESSION_DIR, { recursive: true, force: true });
          } catch { /* ignore */ }
        } else {
          // Connection lost — reconnect
          state.status = "disconnected";
          state.socket = null;
          setTimeout(() => startConnection(), 5000);
        }
      }
    });
  } catch (err) {
    console.error("Baileys start error:", err);
    state.connecting = false;
    state.status = "disconnected";
  }
}

// ---------------------------------------------------------------------------
// GET — return current QR + status
// ---------------------------------------------------------------------------
export async function GET() {
  return NextResponse.json({ qr: state.qr, status: state.status });
}

// ---------------------------------------------------------------------------
// POST — initiate connection
// ---------------------------------------------------------------------------
export async function POST() {
  if (state.status === "connected") {
    return NextResponse.json({ qr: null, status: "connected" });
  }

  // Close old socket
  if (state.socket) {
    try {
      state.socket.end(undefined);
    } catch { /* ignore */ }
    state.socket = null;
  }

  state.connecting = false;
  await startConnection();

  // Wait for first QR
  await new Promise((r) => setTimeout(r, 3000));

  return NextResponse.json({ qr: state.qr, status: state.status });
}
