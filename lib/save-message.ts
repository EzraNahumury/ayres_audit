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

  // Insert message (ignore duplicate)
  const ts = new Date(data.timestamp * 1000);

  await query(
    `INSERT IGNORE INTO messages (message_id, contact_jid, sender_jid, from_me, message_type, body, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.messageId, data.contactJid, data.senderJid, data.fromMe ? 1 : 0, data.messageType, data.body, ts]
  );
}
