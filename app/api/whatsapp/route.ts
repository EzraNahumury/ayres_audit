import { NextResponse } from "next/server";
import path from "path";
import { saveMessage } from "@/lib/save-message";
import { waState } from "@/lib/wa-state";

const SESSION_DIR = path.join(process.cwd(), "wa_sessions");

// ---------------------------------------------------------------------------
// Extract text body from message
// ---------------------------------------------------------------------------
function extractBody(msg: any): { body: string | null; type: string } {
  const m = msg.message;
  if (!m) return { body: null, type: "unknown" };

  if (m.conversation) return { body: m.conversation, type: "text" };
  if (m.extendedTextMessage?.text) return { body: m.extendedTextMessage.text, type: "text" };
  if (m.imageMessage) return { body: m.imageMessage.caption || "[Foto]", type: "image" };
  if (m.videoMessage) return { body: m.videoMessage.caption || "[Video]", type: "video" };
  if (m.documentMessage) return { body: m.documentMessage.fileName || "[Dokumen]", type: "document" };
  if (m.audioMessage) return { body: "[Audio]", type: "audio" };
  if (m.stickerMessage) return { body: "[Sticker]", type: "sticker" };
  if (m.contactMessage) return { body: m.contactMessage.displayName || "[Kontak]", type: "contact" };
  if (m.locationMessage) return { body: `[Lokasi] ${m.locationMessage.degreesLatitude},${m.locationMessage.degreesLongitude}`, type: "location" };

  const wrapped =
    m.viewOnceMessage?.message ||
    m.viewOnceMessageV2?.message ||
    m.ephemeralMessage?.message ||
    m.documentWithCaptionMessage?.message ||
    m.editedMessage?.message?.protocolMessage?.editedMessage ||
    null;
  if (wrapped) return extractBody({ message: wrapped });

  if (m.protocolMessage || m.senderKeyDistributionMessage) return { body: null, type: "protocol" };
  if (m.reactionMessage) return { body: m.reactionMessage.text || null, type: "reaction" };
  if (m.buttonsResponseMessage) return { body: m.buttonsResponseMessage.selectedDisplayText || null, type: "text" };
  if (m.listResponseMessage) return { body: m.listResponseMessage.title || null, type: "text" };
  if (m.templateButtonReplyMessage) return { body: m.templateButtonReplyMessage.selectedDisplayText || null, type: "text" };

  // Fallback: coba ambil text dari messageContextInfo (sering muncul di Baileys v6)
  if (m.messageContextInfo && Object.keys(m).length <= 2) return { body: null, type: "protocol" };

  return { body: null, type: "unknown" };
}

// ---------------------------------------------------------------------------
// Start Baileys connection
// ---------------------------------------------------------------------------
async function startConnection() {
  if (waState.connecting) return;
  waState.connecting = true;
  waState.qr = null;
  waState.status = "waiting";

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

    // In-memory store for contact/LID tracking
    const { makeInMemoryStore } = baileys;
    const store = makeInMemoryStore({ logger });

    const sock = makeWASocket({
      version,
      auth: authState,
      printQRInTerminal: false,
      logger,
      browser: ["Ayres Audit", "Chrome", "4.0.0"],
      connectTimeoutMs: 60000,
      qrTimeout: 60000,
      defaultQueryTimeoutMs: 60000,
      retryRequestDelayMs: 2000,
      syncFullHistory: true,
    });

    // Bind store to socket events
    store.bind(sock.ev);
    waState.socket = sock;
    waState.store = store;

    // ----- LID ↔ Phone mapping: capture from ALL events -----
    const saveLidMapping = async (lid: string, phone: string, name?: string | null) => {
      if (!lid || !phone) return;
      const cleanLid = lid.replace("@lid", "").split(":")[0];
      const cleanPhone = phone.replace("@s.whatsapp.net", "").split(":")[0];
      if (!cleanPhone || cleanPhone.length < 8) return;
      try {
        await query(
          `INSERT INTO lid_mapping (lid, phone, name) VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE phone = VALUES(phone), name = COALESCE(VALUES(name), name)`,
          [cleanLid, cleanPhone, name || null]
        );
        console.log(`[LID] Mapped: ${cleanLid} → ${cleanPhone} (${name || ""})`);
      } catch { /* ignore */ }
    };

    // Listen to ALL contact-related events for LID mapping
    for (const event of ["contacts.upsert", "contacts.update"] as const) {
      sock.ev.on(event, async (contacts: any[]) => {
        for (const c of contacts) {
          const id = c.id || "";
          const lid = c.lid || "";
          const name = c.notify || c.verifiedName || c.name || null;
          // Silent — only log if mapping found

          if (lid && id.endsWith("@s.whatsapp.net")) {
            await saveLidMapping(lid, id, name);
          }
          if (id.endsWith("@s.whatsapp.net") && lid) {
            await saveLidMapping(lid, id, name);
          }
        }
      });
    }

    // Also check messaging-history for phone numbers
    sock.ev.on("messaging-history.set" as any, async (data: any) => {
      console.log(`[HISTORY] messaging-history.set received`);
      const contacts = data?.contacts || [];
      for (const c of contacts) {
        const id = c.id || "";
        const lid = c.lid || "";
        const name = c.notify || c.name || null;
        if (lid && id.endsWith("@s.whatsapp.net")) {
          await saveLidMapping(lid, id, name);
        }
      }
      // Also check messages in history for phone JIDs
      const messages = data?.messages || [];
      for (const m of messages) {
        const jid = m?.key?.remoteJid || "";
        if (jid.endsWith("@s.whatsapp.net")) {
          const phone = jid.split(":")[0].replace("@s.whatsapp.net", "");
          // Try to find matching LID from store
          const storeContact = store?.contacts?.[jid];
          if (storeContact?.lid) {
            await saveLidMapping(storeContact.lid, jid, storeContact.notify);
          }
        }
      }
    });

    // Catch unhandled Baileys promise rejections
    process.removeAllListeners("unhandledRejection");
    process.on("unhandledRejection", (err: any) => {
      const msg = err?.message || err?.output?.payload?.message || "";
      if (msg.includes("Timed Out") || msg.includes("Connection Closed") || err?.output?.statusCode === 408 || err?.output?.statusCode === 428) {
        return; // Ignore, auto-reconnect will handle it
      }
      console.error("[WA] Unhandled:", msg);
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, qr, lastDisconnect } = update;

      if (qr) {
        try {
          waState.qr = await QRCode.toDataURL(qr, { width: 300, margin: 2 });
          waState.status = "waiting";
        } catch { /* ignore */ }
      }

      if (connection === "open") {
        waState.status = "connected";
        waState.qr = null;
        waState.connecting = false;
        console.log("[WA] Connected — chat listener active");

        // Try to find LID→phone mappings from store
        setTimeout(async () => {
          if (store?.contacts) {
            for (const [key, val] of Object.entries(store.contacts) as any) {
              if (val?.lid && key.endsWith("@s.whatsapp.net")) {
                await saveLidMapping(val.lid, key, val?.notify || val?.name);
              }
            }
          }
        }, 5000);
      }

      if (connection === "close") {
        waState.qr = null;
        waState.connecting = false;
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode ?? 0;

        if (statusCode === DisconnectReason.loggedOut) {
          waState.status = "disconnected";
          waState.socket = null;
          try {
            const fs = await import("fs");
            fs.rmSync(SESSION_DIR, { recursive: true, force: true });
          } catch { /* ignore */ }
        } else {
          waState.status = "disconnected";
          waState.socket = null;
          setTimeout(() => startConnection(), 5000);
        }
      }
    });

    // ----- LID to phone resolver (from DB mapping only) -----
    async function resolveLid(lidJid: string): Promise<string | null> {
      const lid = lidJid.replace("@lid", "").split(":")[0];
      try {
        const rows: any[] = await query("SELECT phone FROM lid_mapping WHERE lid = ? AND phone != '' LIMIT 1", [lid]);
        if (rows.length > 0 && rows[0].phone) return rows[0].phone;
      } catch { /* ignore */ }
      return null;
    }

    // ----- SAVE ALL MESSAGES -----
    sock.ev.on("messages.upsert", async ({ messages: msgs, type }) => {
      for (const msg of msgs) {
        if (!msg.message) continue;
        if (msg.key.remoteJid === "status@broadcast") continue;
        if (msg.key.remoteJid?.endsWith("@g.us")) continue;

        const remoteJid = msg.key.remoteJid || "";
        const fromMe = msg.key.fromMe || false;
        const senderJid = fromMe ? (sock.user?.id || "") : remoteJid;
        const { body, type: msgType } = extractBody(msg);

        if (msgType === "protocol") continue;
        if (msgType === "unknown" && !body) continue;

        const ts = msg.messageTimestamp as number;

        // Resolve LID to real phone number
        let contactJid = remoteJid;
        let phone = "";

        if (remoteJid.endsWith("@lid")) {
          const resolved = await resolveLid(remoteJid);
          if (resolved) {
            contactJid = resolved + "@s.whatsapp.net";
            phone = resolved;
            console.log(`[LID] Resolved ${remoteJid} → ${phone}`);
          } else {
            // Store with LID as phone for now — will be updated when mapping is available
            phone = remoteJid.replace("@lid", "");
          }
        } else {
          phone = remoteJid.replace("@s.whatsapp.net", "").split(":")[0];
        }

        try {
          await saveMessage({
            messageId: msg.key.id || `${Date.now()}`,
            contactJid,
            senderJid,
            fromMe,
            messageType: msgType,
            body,
            timestamp: ts,
            pushName: msg.pushName || undefined,
          });
          console.log(`[DB] Saved: ${fromMe ? "→" : "←"} ${phone} | ${msgType} | ${body?.substring(0, 50) || "(media)"}`);
        } catch (err) {
          console.error("[DB] Save error:", err);
        }
      }
    });

  } catch (err) {
    console.error("Baileys start error:", err);
    waState.connecting = false;
    waState.status = "disconnected";
  }
}

// Auto-start if session exists
async function autoStart() {
  if (waState.initialized || waState.connecting || waState.status === "connected") return;
  const fs = await import("fs");
  if (fs.existsSync(SESSION_DIR)) {
    waState.initialized = true;
    await startConnection();
  }
}

// GET
export async function GET() {
  await autoStart();
  return NextResponse.json({ qr: waState.qr, status: waState.status });
}

// POST
export async function POST() {
  if (waState.status === "connected") {
    return NextResponse.json({ qr: null, status: "connected" });
  }

  if (waState.socket) {
    try { waState.socket.ws?.close(); waState.socket = null; } catch { waState.socket = null; }
  }

  waState.connecting = false;
  waState.initialized = true;
  await startConnection();
  await new Promise((r) => setTimeout(r, 3000));

  return NextResponse.json({ qr: waState.qr, status: waState.status });
}
