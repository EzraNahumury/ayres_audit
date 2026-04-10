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

export async function saveMessage(data: MessageData) {
  // Skip group chats
  if (data.contactJid.endsWith("@g.us")) return;

  // Extract phone number from JID
  const phone = data.contactJid
    .replace("@s.whatsapp.net", "")
    .replace("@lid", "");

  // Upsert contact
  await query(
    `INSERT INTO contacts (jid, phone, name) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       name = COALESCE(VALUES(name), name),
       updated_at = NOW()`,
    [data.contactJid, phone, data.pushName || null]
  );

  // Auto-assign new contact to least-loaded CS (only once per contact)
  const existing = await query<any[]>(
    "SELECT id FROM contact_assignments WHERE contact_jid = ? LIMIT 1",
    [data.contactJid]
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
        [data.contactJid, csUsers[0].id]
      );
    }
  }

  // Insert message (ignore duplicate)
  const ts = new Date(data.timestamp * 1000);

  await query(
    `INSERT IGNORE INTO messages (message_id, contact_jid, sender_jid, from_me, message_type, body, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.messageId, data.contactJid, data.senderJid, data.fromMe ? 1 : 0, data.messageType, data.body, ts]
  );
}
