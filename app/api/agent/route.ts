import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// Build knowledge base from DB
async function getKnowledgeBase(): Promise<string> {
  const parts: string[] = [];

  // 1. All contacts + stats
  try {
    const contacts: any[] = await query(`
      SELECT
        c.phone,
        COALESCE(c.name, lm.name, 'Unknown') AS name,
        (SELECT COUNT(*) FROM messages WHERE contact_jid = c.jid) AS total_messages,
        (SELECT MIN(timestamp) FROM messages WHERE contact_jid = c.jid) AS first_chat,
        (SELECT MAX(timestamp) FROM messages WHERE contact_jid = c.jid) AS last_chat
      FROM contacts c
      LEFT JOIN lid_mapping lm ON lm.lid = REPLACE(c.jid, '@lid', '')
      ORDER BY last_chat DESC
    `);

    if (contacts.length > 0) {
      parts.push(`=== DATA CUSTOMER (${contacts.length} kontak) ===`);
      for (const c of contacts) {
        parts.push(`- ${c.name} (${c.phone}): ${c.total_messages} pesan, chat pertama: ${c.first_chat || '-'}, chat terakhir: ${c.last_chat || '-'}`);
      }
    }
  } catch { /* ignore */ }

  // 2. Recent messages (last 100)
  try {
    const messages: any[] = await query(`
      SELECT
        m.contact_jid,
        COALESCE(c.name, lm.name, c.phone) AS contact_name,
        m.from_me,
        m.body,
        m.message_type,
        m.timestamp
      FROM messages m
      LEFT JOIN contacts c ON c.jid = m.contact_jid
      LEFT JOIN lid_mapping lm ON lm.lid = REPLACE(m.contact_jid, '@lid', '')
      WHERE m.body IS NOT NULL AND m.body != ''
      ORDER BY m.timestamp DESC
      LIMIT 100
    `);

    if (messages.length > 0) {
      // Group by contact
      const grouped: Record<string, any[]> = {};
      for (const m of messages) {
        const key = m.contact_name || m.contact_jid;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(m);
      }

      parts.push(`\n=== RIWAYAT CHAT TERBARU ===`);
      for (const [name, msgs] of Object.entries(grouped)) {
        parts.push(`\n--- Chat dengan ${name} ---`);
        // Show in chronological order
        for (const m of msgs.reverse()) {
          const sender = m.from_me ? "CS Ayres" : name;
          const time = new Date(m.timestamp).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
          parts.push(`[${time}] ${sender}: ${m.body}`);
        }
      }
    }
  } catch { /* ignore */ }

  // 3. Lead analysis if any
  try {
    const leads: any[] = await query(`SELECT * FROM lead_analysis ORDER BY updated_at DESC LIMIT 20`);
    if (leads.length > 0) {
      parts.push(`\n=== HASIL ANALISA LEAD ===`);
      for (const l of leads) {
        parts.push(`- ${l.contact_jid}: ${l.category} | ${l.summary || ''}`);
      }
    }
  } catch { /* ignore */ }

  // 4. CS agents + their assigned contacts
  try {
    const csAgents: any[] = await query(`
      SELECT DISTINCT u.id, u.name, u.username, u.is_online,
        COUNT(ca.contact_jid) AS total_assigned
      FROM users u
      INNER JOIN roles r ON r.name = u.role
      INNER JOIN role_permissions rp ON rp.role_id = r.id AND rp.permission = 'audital_work'
      LEFT JOIN contact_assignments ca ON ca.user_id = u.id
      GROUP BY u.id, u.name, u.username, u.is_online
      ORDER BY u.name ASC
    `);

    if (csAgents.length > 0) {
      parts.push(`\n=== DATA CS AGENT (${csAgents.length} CS) ===`);
      for (const cs of csAgents) {
        const status = cs.is_online ? "Online" : "Offline";
        parts.push(`- ${cs.name} (@${cs.username}): status=${status}, menangani ${cs.total_assigned} customer`);
      }
    }
  } catch { /* ignore */ }

  // 5. Contact assignments (who handles which customer)
  try {
    const assignments: any[] = await query(`
      SELECT
        COALESCE(c.name, lm.name, c.phone) AS customer_name,
        c.phone,
        u.name AS cs_name,
        ca.assigned_at
      FROM contact_assignments ca
      INNER JOIN contacts c ON c.jid = ca.contact_jid
      LEFT JOIN lid_mapping lm ON lm.lid = REPLACE(c.jid, '@lid', '')
      INNER JOIN users u ON u.id = ca.user_id
      ORDER BY ca.assigned_at DESC
    `);

    if (assignments.length > 0) {
      parts.push(`\n=== PEMBAGIAN CUSTOMER KE CS ===`);
      for (const a of assignments) {
        const tgl = new Date(a.assigned_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
        parts.push(`- ${a.customer_name} (${a.phone}) → ditangani oleh: ${a.cs_name} (sejak ${tgl})`);
      }
    }
  } catch { /* ignore */ }

  return parts.join("\n");
}

// POST /api/agent — send prompt to Ollama AI with DB knowledge
export async function POST(request: Request) {
  try {
    const { messages, chatId } = await request.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages array required" }, { status: 400 });
    }

    // Save user message to DB if chatId provided
    const lastUserMsg = messages.filter((m: any) => m.role === "user").pop();
    let activeChatId = chatId;

    if (lastUserMsg) {
      if (!activeChatId) {
        // Create new chat session with first message as title
        const title = lastUserMsg.content.substring(0, 80);
        const result: any = await query("INSERT INTO agent_chats (title) VALUES (?)", [title]);
        activeChatId = result.insertId;
      }
      await query("INSERT INTO agent_messages (chat_id, role, content) VALUES (?, 'user', ?)", [activeChatId, lastUserMsg.content]);
      await query("UPDATE agent_chats SET updated_at = NOW() WHERE id = ?", [activeChatId]);
    }

    const host = process.env.OLLAMA_HOST || "https://ollama.com";
    const model = process.env.OLLAMA_MODEL || "gpt-oss:120b-cloud";
    const apiKey = process.env.OLLAMA_API_KEY || "";

    // Get knowledge base from DB
    const kb = await getKnowledgeBase();

    const systemPrompt = `Kamu adalah Ayres Agent, asisten AI untuk analisa customer service dan audit WhatsApp milik Ayres Apparel (brand jersey/sportswear).

Tugas utamamu:
1. Menganalisa percakapan WhatsApp customer untuk klasifikasi leads (Hot/Warm/Cold)
2. Mengevaluasi kinerja CS berdasarkan SOP Ayres (respon time, script, timeline, kompensasi)
3. Memberikan insight dan rekomendasi follow-up
4. Menjawab pertanyaan tentang data customer

Klasifikasi Lead:
- HOT: Sudah tanya harga/size/stok detail, ada urgency, repeat customer, respon cepat
- WARM: Tanya umum (model/bahan), masih bandingkan, belum urgent
- COLD: Baru lihat-lihat, slow/no response, belum ada kebutuhan

SOP CS Ayres:
- Respon WA < 5 menit
- Wajib sampaikan "Deadline Aman" & "Pattern Lab" di awal
- Edukasi timeline 21 hari kerja setelah 3 syarat (DP 70%, proofing ACC, data fix)
- Tanggal selesai harus tertulis, bukan "sekitar"
- Sampaikan komitmen kompensasi keterlambatan
- Tidak boleh over-promise

PENTING - FORMAT JAWABAN:
- Jika menampilkan data dalam bentuk tabel, gunakan format DAFTAR BERNOMOR, BUKAN tabel markdown.
- Contoh format yang benar:
  1. Ezra K Nahumury - 6282338142821 - Hot Lead
  2. Jne Ambarrukmo - 155039897276607 - Cold Lead
- Gunakan bold (**teks**) untuk penekanan.
- Gunakan bullet points (- item) untuk list.
- JANGAN gunakan format | tabel | markdown |.

Berikut adalah data terkini dari database:

${kb}

Jawab dalam bahasa Indonesia, ringkas, dan berikan insight yang actionable.`;

    // Build final messages with system prompt
    const finalMessages = [
      { role: "system", content: systemPrompt },
      ...messages.filter((m: any) => m.role !== "system"),
    ];

    const res = await fetch(`${host}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        model,
        messages: finalMessages,
        stream: false,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[AGENT] Ollama error:", res.status, text);
      return NextResponse.json({ error: `Ollama error: ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const reply = data.message?.content || data.response || "";

    // Save assistant reply to DB
    if (activeChatId && reply) {
      await query("INSERT INTO agent_messages (chat_id, role, content) VALUES (?, 'assistant', ?)", [activeChatId, reply]);
      await query("UPDATE agent_chats SET updated_at = NOW() WHERE id = ?", [activeChatId]);
    }

    return NextResponse.json({ reply, chatId: activeChatId });
  } catch (err: any) {
    console.error("[AGENT] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
