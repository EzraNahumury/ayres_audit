import { query } from "./db";

interface MessageData {
  messageId: string;
  contactJid: string;
  senderJid: string;
  fromMe: boolean;
  messageType: string;
  body: string | null;
  timestamp: number;
  pushName?: string;
}

function sanitizeContactName(name?: string | null) {
  const normalized = name?.trim() || null;
  if (!normalized) return null;

  const blockedNames = new Set([
    "Ayres Apparel Meta Ads",
  ]);

  return blockedNames.has(normalized) ? null : normalized;
}

function normalizeJid(jid: string) {
  const [user = "", server = ""] = jid.split("@");
  const normalizedUser = user.split(":")[0];
  return server ? `${normalizedUser}@${server}` : normalizedUser;
}

function normalizeTimestamp(timestamp: number | string | { low?: number; high?: number; toNumber?: () => number; toString?: () => string }) {
  if (typeof timestamp === "number" && Number.isFinite(timestamp)) return timestamp;

  if (typeof timestamp === "string") {
    const parsed = Number(timestamp);
    return Number.isFinite(parsed) ? parsed : Math.floor(Date.now() / 1000);
  }

  if (timestamp && typeof timestamp === "object") {
    if (typeof timestamp.toNumber === "function") {
      const parsed = timestamp.toNumber();
      if (Number.isFinite(parsed)) return parsed;
    }

    if (typeof timestamp.low === "number") {
      return timestamp.low;
    }

    if (typeof timestamp.toString === "function") {
      const parsed = Number(timestamp.toString());
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return Math.floor(Date.now() / 1000);
}

export async function saveMessage(data: MessageData) {
  const contactJid = normalizeJid(data.contactJid);
  const senderJid = normalizeJid(data.senderJid);

  // Skip group chats
  if (contactJid.endsWith("@g.us")) return;

  // Extract phone number from JID
  const phone = contactJid
    .replace("@s.whatsapp.net", "")
    .replace("@lid", "");

  // Upsert contact
  await query(
    `INSERT INTO contacts (jid, phone, name) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       name = COALESCE(VALUES(name), name),
       updated_at = NOW()`,
    [contactJid, phone, sanitizeContactName(data.pushName)]
  );

  // Auto-assign new contact to least-loaded CS (only once per contact)
  const existing = await query<any[]>(
    "SELECT id FROM contact_assignments WHERE contact_jid = ? LIMIT 1",
    [contactJid]
  );
  if (existing.length === 0) {
    const csUsers = await query<any[]>(`
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

  // Insert message (ignore duplicate)
  const ts = new Date(normalizeTimestamp(data.timestamp) * 1000);

  await query(
    `INSERT IGNORE INTO messages (message_id, contact_jid, sender_jid, from_me, message_type, body, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.messageId, contactJid, senderJid, data.fromMe ? 1 : 0, data.messageType, data.body, ts]
  );
}
