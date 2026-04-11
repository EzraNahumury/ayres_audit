const http = require("http");
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const baileys = require("@whiskeysockets/baileys");
const QRCode = require("qrcode");
const P = require("pino");

const makeWASocket = baileys.default;
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeInMemoryStore } = baileys;

const PORT = Number(process.env.WA_WORKER_PORT || 3311);
const HOST = "127.0.0.1";
const SESSION_DIR = path.join(process.cwd(), "wa_sessions");
const LOG_FILE = path.join(SESSION_DIR, "worker.log");

fs.mkdirSync(SESSION_DIR, { recursive: true });

const state = {
  qr: null,
  status: "disconnected",
  socket: null,
  store: null,
  connecting: false,
  initialized: false,
};

let pool;

function log(...args) {
  const line = `[${new Date().toISOString()}] ${args.map((arg) => {
    if (arg instanceof Error) return `${arg.name}: ${arg.message}\n${arg.stack || ""}`;
    return typeof arg === "string" ? arg : JSON.stringify(arg);
  }).join(" ")}\n`;

  try {
    fs.appendFileSync(LOG_FILE, line);
  } catch {}

  console.log(...args);
}

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASS || "",
      database: process.env.DB_NAME || "ayres_audit",
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return pool;
}

async function query(sql, params) {
  const db = getPool();
  const [rows] = await db.execute(sql, params);
  return rows;
}

function normalizeJid(jid) {
  const [user = "", server = ""] = String(jid || "").split("@");
  const normalizedUser = user.split(":")[0];
  return server ? `${normalizedUser}@${server}` : normalizedUser;
}

function sanitizeContactName(name) {
  const normalized = typeof name === "string" ? name.trim() : "";
  if (!normalized) return null;

  const blockedNames = new Set([
    "Ayres Apparel Meta Ads",
  ]);

  return blockedNames.has(normalized) ? null : normalized;
}

function getMessageTimestampSeconds(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value?.toNumber === "function") return value.toNumber();
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  const fallback = Number(value?.toString?.());
  if (Number.isFinite(fallback)) return fallback;
  return Math.floor(Date.now() / 1000);
}

function extractBody(msg) {
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
  if (m.messageContextInfo) return { body: null, type: "protocol" };

  return { body: null, type: "unknown" };
}

async function saveMessage(data) {
  const contactJid = normalizeJid(data.contactJid);
  const senderJid = normalizeJid(data.senderJid);

  if (!contactJid || contactJid.endsWith("@g.us")) return;

  const phone = contactJid.replace("@s.whatsapp.net", "").replace("@lid", "");

  await query(
    `INSERT INTO contacts (jid, phone, name) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       name = COALESCE(VALUES(name), name),
       updated_at = NOW()`,
    [contactJid, phone, sanitizeContactName(data.pushName)]
  );

  const existing = await query(
    "SELECT id FROM contact_assignments WHERE contact_jid = ? LIMIT 1",
    [contactJid]
  );

  if (existing.length === 0) {
    const csUsers = await query(`
      SELECT u.id, COUNT(ca.contact_jid) AS load_count
      FROM users u
      INNER JOIN roles r ON r.name = u.role
      INNER JOIN role_permissions rp ON rp.role_id = r.id AND rp.permission = 'audital_work'
      LEFT JOIN contact_assignments ca ON ca.user_id = u.id
      WHERE u.is_online = 1
      GROUP BY u.id
      ORDER BY load_count ASC
      LIMIT 1
    `);

    if (csUsers.length > 0) {
      await query(
        "INSERT IGNORE INTO contact_assignments (contact_jid, user_id) VALUES (?, ?)",
        [contactJid, csUsers[0].id]
      );
    }
  }

  await query(
    `INSERT IGNORE INTO messages (message_id, contact_jid, sender_jid, from_me, message_type, body, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.messageId,
      contactJid,
      senderJid,
      data.fromMe ? 1 : 0,
      data.messageType,
      data.body,
      new Date(getMessageTimestampSeconds(data.timestamp) * 1000),
    ]
  );
}

async function saveLidMapping(lid, phone, name) {
  if (!lid || !phone) return;

  const cleanLid = String(lid).replace("@lid", "").split(":")[0];
  const cleanPhone = String(phone).replace("@s.whatsapp.net", "").split(":")[0];
  if (!cleanPhone || cleanPhone.length < 8) return;

  await query(
    `INSERT INTO lid_mapping (lid, phone, name) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE phone = VALUES(phone), name = COALESCE(VALUES(name), name)`,
    [cleanLid, cleanPhone, name || null]
  );
}

async function resolveLid(lidJid) {
  const lid = String(lidJid).replace("@lid", "").split(":")[0];
  const rows = await query("SELECT phone FROM lid_mapping WHERE lid = ? AND phone != '' LIMIT 1", [lid]);
  if (rows.length > 0 && rows[0].phone) return rows[0].phone;
  return null;
}

async function stopSocket(removeSession) {
  if (state.socket) {
    try {
      await state.socket.logout?.();
    } catch {}
    try {
      state.socket.ws?.close();
    } catch {}
  }

  state.socket = null;
  state.store = null;
  state.qr = null;
  state.status = "disconnected";
  state.connecting = false;
  state.initialized = false;

  if (removeSession) {
    try {
      fs.rmSync(SESSION_DIR, { recursive: true, force: true });
      fs.mkdirSync(SESSION_DIR, { recursive: true });
    } catch {}
  }
}

async function startConnection() {
  if (state.connecting || state.socket) return;

  state.connecting = true;
  state.qr = null;
  state.status = "waiting";

  try {
    const logger = (P.default || P)({ level: "silent" });
    const { version } = await fetchLatestBaileysVersion();
    const auth = await useMultiFileAuthState(SESSION_DIR);
    const store = makeInMemoryStore({ logger });

    const sock = makeWASocket({
      version,
      auth: auth.state,
      printQRInTerminal: false,
      logger,
      browser: ["Ayres Audit", "Chrome", "4.0.0"],
      connectTimeoutMs: 60000,
      qrTimeout: 60000,
      defaultQueryTimeoutMs: 60000,
      retryRequestDelayMs: 2000,
      syncFullHistory: true,
    });

    store.bind(sock.ev);

    state.socket = sock;
    state.store = store;
    state.initialized = true;

    sock.ev.on("creds.update", auth.saveCreds);

    for (const event of ["contacts.upsert", "contacts.update"]) {
      sock.ev.on(event, async (contacts) => {
        for (const c of contacts || []) {
          try {
            if (c?.lid && c?.id?.endsWith("@s.whatsapp.net")) {
              await saveLidMapping(c.lid, c.id, c.notify || c.verifiedName || c.name || null);
            }
          } catch (err) {
            log("[LID] map error", err);
          }
        }
      });
    }

    sock.ev.on("messaging-history.set", async (data) => {
      for (const c of data?.contacts || []) {
        try {
          if (c?.lid && c?.id?.endsWith("@s.whatsapp.net")) {
            await saveLidMapping(c.lid, c.id, c.notify || c.name || null);
          }
        } catch (err) {
          log("[HISTORY] contact map error", err);
        }
      }
    });

    sock.ev.on("connection.update", async (update) => {
      const { connection, qr, lastDisconnect } = update;

      if (qr) {
        try {
          state.qr = await QRCode.toDataURL(qr, { width: 300, margin: 2 });
          state.status = "waiting";
        } catch (err) {
          log("[WA] QR error", err);
        }
      }

      if (connection === "open") {
        state.status = "connected";
        state.qr = null;
        state.connecting = false;
        log("[WA] connected");
      }

      if (connection === "close") {
        const statusCode = lastDisconnect?.error?.output?.statusCode ?? 0;
        log("[WA] closed", statusCode);
        state.socket = null;
        state.store = null;
        state.qr = null;
        state.connecting = false;
        state.status = "disconnected";

        if (statusCode === DisconnectReason.loggedOut) {
          await stopSocket(true);
        } else {
          setTimeout(() => {
            startConnection().catch((err) => log("[WA] reconnect error", err));
          }, 5000);
        }
      }
    });

    sock.ev.on("messages.upsert", async ({ messages: msgs, type }) => {
      log("[EVENT] messages.upsert", { count: msgs?.length || 0, type });

      for (const msg of msgs || []) {
        try {
          if (!msg?.message || !msg?.key?.remoteJid) continue;
          if (msg.key.remoteJid === "status@broadcast") continue;
          if (msg.key.remoteJid.endsWith("@g.us")) continue;

          const remoteJid = normalizeJid(msg.key.remoteJid);
          const fromMe = Boolean(msg.key.fromMe);
          const senderJid = normalizeJid(fromMe ? (sock.user?.id || "") : remoteJid);
          const parsed = extractBody(msg);

          if (parsed.type === "protocol") continue;
          if (parsed.type === "unknown" && !parsed.body) {
            log("[SKIP] unknown message", { fromMe, key: msg.key });
            continue;
          }

          let contactJid = remoteJid;
          if (remoteJid.endsWith("@lid")) {
            const resolved = await resolveLid(remoteJid);
            if (resolved) {
              contactJid = `${resolved}@s.whatsapp.net`;
            }
          }

          await saveMessage({
            messageId: msg.key.id || `${remoteJid}-${Date.now()}`,
            contactJid,
            senderJid,
            fromMe,
            messageType: parsed.type,
            body: parsed.body,
            timestamp: msg.messageTimestamp,
            pushName: msg.pushName || undefined,
          });

          log("[DB] saved", {
            contactJid,
            fromMe,
            messageType: parsed.type,
            body: parsed.body,
          });
        } catch (err) {
          log("[DB] save error", err);
        }
      }
    });
  } catch (err) {
    state.connecting = false;
    state.status = "disconnected";
    state.socket = null;
    state.store = null;
    log("[WA] start error", err);
  }
}

async function autoStart() {
  if (state.initialized || state.connecting || state.socket) return;
  if (fs.existsSync(SESSION_DIR) && fs.readdirSync(SESSION_DIR).length > 0) {
    await startConnection();
  }
}

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${HOST}:${PORT}`);

    if (req.method === "GET" && url.pathname === "/status") {
      await autoStart();
      return sendJson(res, 200, { qr: state.qr, status: state.status });
    }

    if (req.method === "POST" && url.pathname === "/connect") {
      await startConnection();
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return sendJson(res, 200, { qr: state.qr, status: state.status });
    }

    if (req.method === "POST" && url.pathname === "/send") {
      const body = await readJson(req);
      const jid = body?.jid;
      const message = body?.message;

      if (!jid || !message) return sendJson(res, 400, { error: "jid and message required" });
      if (!state.socket || state.status !== "connected") return sendJson(res, 503, { error: "WhatsApp not connected" });

      const sent = await state.socket.sendMessage(jid, { text: message });
      await saveMessage({
        messageId: sent?.key?.id || `${Date.now()}`,
        contactJid: jid,
        senderJid: state.socket.user?.id || "",
        fromMe: true,
        messageType: "text",
        body: message,
        timestamp: sent?.messageTimestamp || Math.floor(Date.now() / 1000),
      });

      return sendJson(res, 200, { success: true });
    }

    if (req.method === "GET" && url.pathname === "/lookup") {
      if (!state.socket || state.status !== "connected") return sendJson(res, 503, { error: "not connected" });

      if (url.searchParams.get("dump")) {
        const contacts = state.store?.contacts || {};
        const list = Object.entries(contacts).map(([key, val]) => ({
          id: key,
          lid: val?.lid || null,
          notify: val?.notify || null,
          name: val?.name || null,
          verifiedName: val?.verifiedName || null,
        }));
        return sendJson(res, 200, { total: list.length, contacts: list });
      }

      const phone = url.searchParams.get("phone");
      if (!phone) return sendJson(res, 400, { error: "pass phone or dump=1" });

      const result = await state.socket.onWhatsApp(phone);
      return sendJson(res, 200, { input: phone, result });
    }

    if (req.method === "POST" && url.pathname === "/logout") {
      await stopSocket(true);
      return sendJson(res, 200, { success: true });
    }

    return sendJson(res, 404, { error: "not found" });
  } catch (err) {
    log("[WORKER] request error", err);
    return sendJson(res, 500, { error: err.message || "internal error" });
  }
});

process.on("unhandledRejection", (err) => log("[PROCESS] unhandledRejection", err));
process.on("uncaughtException", (err) => log("[PROCESS] uncaughtException", err));

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    process.exit(0);
  }

  log("[WORKER] server error", err);
  process.exit(1);
});

server.listen(PORT, HOST, async () => {
  log(`[WORKER] listening on http://${HOST}:${PORT}`);
  await autoStart();
});
