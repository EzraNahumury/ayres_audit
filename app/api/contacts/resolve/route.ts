import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// POST /api/contacts/resolve — resolve all LID contacts to phone numbers
// Uses the WA socket to call onWhatsApp for known phone numbers
export async function POST() {
  const g = globalThis as any;
  const state = g["__ayres_wa_state__"];
  const sock = state?.socket;

  if (!sock || state?.status !== "connected") {
    return NextResponse.json({ error: "WhatsApp not connected" }, { status: 503 });
  }

  try {
    // Get all LID contacts that don't have phone mapping yet
    const lidContacts: any[] = await query(
      "SELECT c.jid, c.phone, c.name FROM contacts c WHERE c.jid LIKE '%@lid' AND NOT EXISTS (SELECT 1 FROM lid_mapping lm WHERE lm.lid = REPLACE(c.jid, '@lid', '') AND lm.phone != '')"
    );

    let resolved = 0;

    for (const contact of lidContacts) {
      const lid = contact.jid.replace("@lid", "");

      // Try to use store's lid-phone mapping if available
      try {
        // Baileys v6 sometimes has lidTagMap or similar
        const store = sock.store;
        if (store?.contacts) {
          for (const [key, val] of Object.entries(store.contacts) as any) {
            if (val?.lid?.includes(lid) && key.includes("@s.whatsapp.net")) {
              const phone = key.replace("@s.whatsapp.net", "").split(":")[0];
              await query(
                "INSERT INTO lid_mapping (lid, phone, name) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE phone = VALUES(phone)",
                [lid, phone, contact.name]
              );
              // Update contacts table too
              await query("UPDATE contacts SET phone = ? WHERE jid = ?", [phone, contact.jid]);
              resolved++;
              break;
            }
          }
        }
      } catch { /* ignore */ }
    }

    return NextResponse.json({ resolved, total: lidContacts.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET /api/contacts/resolve?phone=6282338142821&lid=240110348013766
// Manual mapping
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");
  const lid = searchParams.get("lid");

  if (!phone || !lid) {
    return NextResponse.json({ error: "phone and lid required" }, { status: 400 });
  }

  try {
    await query(
      "INSERT INTO lid_mapping (lid, phone) VALUES (?, ?) ON DUPLICATE KEY UPDATE phone = VALUES(phone)",
      [lid, phone]
    );
    // Also update contacts table
    await query("UPDATE contacts SET phone = ? WHERE jid = ?", [phone, lid + "@lid"]);

    return NextResponse.json({ success: true, mapped: `${lid} → ${phone}` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
