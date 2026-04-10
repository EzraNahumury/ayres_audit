"use client";

import { useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight, MessageSquare, Edit, Check, X } from "lucide-react";

interface Customer {
  jid: string;
  phone: string;
  name: string | null;
  last_message: string | null;
  last_message_at: string | null;
  first_chat_at: string | null;
  total_messages: number;
}

export default function SalesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingJid, setEditingJid] = useState<string | null>(null);
  const [editPhone, setEditPhone] = useState("");
  const [editingNameJid, setEditingNameJid] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  const loadCustomers = () => {
    fetch("/api/contacts")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCustomers(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadCustomers(); }, []);

  // Check if phone is a LID (not a real number)
  const isLid = (c: Customer) => c.jid.endsWith("@lid") && (c.phone.length > 15 || !/^62\d+$/.test(c.phone));

  // Save name
  const handleSaveName = async (c: Customer) => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/contacts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jid: c.jid, name: editName.trim() }),
      });
      setEditingNameJid(null);
      setEditName("");
      loadCustomers();
    } catch { /* ignore */ }
    setSaving(false);
  };

  // Save phone mapping
  const handleSavePhone = async (c: Customer) => {
    if (!editPhone.trim()) return;
    setSaving(true);
    const lid = c.jid.replace("@lid", "");
    let phone = editPhone.trim().replace(/\D/g, "");
    // Convert 08xxx to 628xxx
    if (phone.startsWith("0")) phone = "62" + phone.substring(1);

    try {
      await fetch(`/api/contacts/resolve?phone=${phone}&lid=${lid}`);
      setEditingJid(null);
      setEditPhone("");
      loadCustomers();
    } catch { /* ignore */ }
    setSaving(false);
  };

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return (c.name || "").toLowerCase().includes(q) || c.phone.includes(q) || (c.last_message || "").toLowerCase().includes(q);
  });

  const formatDate = (ts: string | null) => {
    if (!ts) return "-";
    return new Date(ts).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const formatPhone = (phone: string) => {
    if (!phone || phone.length > 15) return phone;
    // Format: +62 xxx-xxxx-xxxx
    if (phone.startsWith("62") && phone.length >= 10) {
      return `+${phone.slice(0, 2)} ${phone.slice(2, 5)}-${phone.slice(5, 9)}-${phone.slice(9)}`;
    }
    return phone;
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>Data Customer</h1>
        <span style={{ fontSize: 13, color: "#6b7280" }}>{customers.length} customer</span>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ position: "relative", maxWidth: 400 }}>
          <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#9ca3af" }} />
          <input
            type="text" placeholder="Cari nomor atau nama..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", paddingLeft: 40, paddingRight: 16, paddingTop: 8, paddingBottom: 8, border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", background: "#fff" }}
          />
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>Memuat data...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
            {customers.length === 0 ? "Belum ada data customer. Hubungkan WhatsApp terlebih dahulu." : "Tidak ditemukan."}
          </div>
        ) : (
          <>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", width: 50 }}>No</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" }}>Customer</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" }}>Nomor</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" }}>Chat Terakhir</th>
                  <th style={{ textAlign: "center", padding: "12px 16px", fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" }}>Total Pesan</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" }}>Waktu Chat Pertama</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.jid} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "12px 16px", fontSize: 14, color: "#6b7280" }}>{i + 1}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "#fff", backgroundImage: "linear-gradient(135deg, #00a884, #25d366)", flexShrink: 0 }}>
                          {(c.name || c.phone)[0].toUpperCase()}
                        </div>
                        {editingNameJid === c.jid ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <input
                              type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(c); if (e.key === "Escape") { setEditingNameJid(null); setEditName(""); } }}
                              autoFocus
                              style={{ width: 160, padding: "4px 8px", border: "1px solid #3b82f6", borderRadius: 4, fontSize: 13, outline: "none" }}
                            />
                            <button onClick={() => handleSaveName(c)} disabled={saving}
                              style={{ padding: 4, background: "#dcfce7", border: "none", borderRadius: 4, cursor: "pointer", display: "flex" }}>
                              <Check style={{ width: 14, height: 14, color: "#16a34a" }} />
                            </button>
                            <button onClick={() => { setEditingNameJid(null); setEditName(""); }}
                              style={{ padding: 4, background: "#fef2f2", border: "none", borderRadius: 4, cursor: "pointer", display: "flex" }}>
                              <X style={{ width: 14, height: 14, color: "#ef4444" }} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>{c.name || <span style={{ color: "#9ca3af", fontStyle: "italic" }}>Belum ada nama</span>}</span>
                            <button onClick={() => { setEditingNameJid(c.jid); setEditName(c.name || ""); }}
                              style={{ padding: 3, background: "none", border: "none", cursor: "pointer", display: "flex", opacity: 0.4 }}
                              title="Edit nama"
                            >
                              <Edit style={{ width: 13, height: 13, color: "#6b7280" }} />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {editingJid === c.jid ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <input
                            type="text" placeholder="08xxx / 628xxx" value={editPhone} onChange={(e) => setEditPhone(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSavePhone(c)}
                            autoFocus
                            style={{ width: 160, padding: "4px 8px", border: "1px solid #3b82f6", borderRadius: 4, fontSize: 13, outline: "none" }}
                          />
                          <button onClick={() => handleSavePhone(c)} disabled={saving}
                            style={{ padding: 4, background: "#dcfce7", border: "none", borderRadius: 4, cursor: "pointer", display: "flex" }}>
                            <Check style={{ width: 14, height: 14, color: "#16a34a" }} />
                          </button>
                          <button onClick={() => { setEditingJid(null); setEditPhone(""); }}
                            style={{ padding: 4, background: "#fef2f2", border: "none", borderRadius: 4, cursor: "pointer", display: "flex" }}>
                            <X style={{ width: 14, height: 14, color: "#ef4444" }} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {isLid(c) ? (
                            <>
                              <span style={{ fontSize: 12, color: "#ef4444", background: "#fef2f2", padding: "2px 8px", borderRadius: 4, fontWeight: 500 }}>Nomor belum diset</span>
                              <button onClick={() => { setEditingJid(c.jid); setEditPhone(""); }}
                                style={{ padding: 4, background: "#eff6ff", border: "none", borderRadius: 4, cursor: "pointer", display: "flex" }}>
                                <Edit style={{ width: 14, height: 14, color: "#3b82f6" }} />
                              </button>
                            </>
                          ) : (
                            <>
                              <span style={{ fontSize: 14, color: "#111827", fontFamily: "monospace" }}>{formatPhone(c.phone)}</span>
                              {c.jid.endsWith("@lid") && (
                                <button onClick={() => { setEditingJid(c.jid); setEditPhone(c.phone); }}
                                  style={{ padding: 4, background: "none", border: "none", cursor: "pointer", display: "flex" }}>
                                  <Edit style={{ width: 12, height: 12, color: "#9ca3af" }} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#6b7280", maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.last_message || "-"}</td>
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#f3f4f6", borderRadius: 999, padding: "2px 10px", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>
                        <MessageSquare style={{ width: 12, height: 12 }} />
                        {c.total_messages}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#6b7280" }}>{formatDate(c.first_chat_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: "1px solid #e5e7eb" }}>
              <span style={{ fontSize: 14, color: "#6b7280" }}>{filtered.length} customer</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button style={{ padding: 4, border: "1px solid #e5e7eb", borderRadius: 4, background: "none", cursor: "pointer" }}><ChevronLeft style={{ width: 16, height: 16, color: "#9ca3af" }} /></button>
                <span style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, background: "#3b82f6", color: "#fff", fontSize: 14, fontWeight: 500 }}>1</span>
                <button style={{ padding: 4, border: "1px solid #e5e7eb", borderRadius: 4, background: "none", cursor: "pointer" }}><ChevronRight style={{ width: 16, height: 16, color: "#9ca3af" }} /></button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
