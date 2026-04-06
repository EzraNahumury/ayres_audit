"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  MoreVertical,
  CheckCheck,
  FileText,
  Pin,
  Volume2,
} from "lucide-react";

interface Contact {
  id: string;
  name: string;
  phone: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
}

interface Message {
  id: string;
  text: string;
  time: string;
  fromMe: boolean;
  status: "sent" | "delivered" | "read";
  type: "text" | "pdf" | "link";
  fileName?: string;
  fileSize?: string;
  date?: string;
}

const mockContacts: Contact[] = [
  { id: "1", name: "Mikhael", phone: "+62 812-3456-7890", lastMessage: "Auto Audit adalah Agentic AI yang ada di Whatsapp untuk Analisa...", lastMessageTime: "06:46", unread: 0 },
  { id: "2", name: "ASTON NUSANTARA FARM ( Rafi )", phone: "+62 813-9249-3171", lastMessage: "Auto Audit adalah Agentic AI yang ada di Whatsapp untuk Analisa...", lastMessageTime: "Yesterday", unread: 0 },
  { id: "3", name: "Ketut", phone: "+62 857-1234-5678", lastMessage: "Ketut", lastMessageTime: "Yesterday", unread: 0 },
  { id: "4", name: "+62 857-5933-7637", phone: "+62 857-5933-7637", lastMessage: "Muhlis", lastMessageTime: "Yesterday", unread: 0 },
  { id: "5", name: "+62 852-6602-5003", phone: "+62 852-6602-5003", lastMessage: "Bagaimana kak? Mau kita jadwalkan kapan kak live demonya?", lastMessageTime: "Yesterday", unread: 0 },
  { id: "6", name: "M. Faiz Ulil Albab", phone: "+62 813-9249-3171", lastMessage: "https://app-autoaudit.ordoagentic.ai/try-now/self-registration", lastMessageTime: "Yesterday", unread: 0 },
  { id: "7", name: "Bachtiar dj", phone: "+62 821-5678-1234", lastMessage: "Sampai jumpa hari senin ya kak", lastMessageTime: "Yesterday", unread: 0 },
  { id: "8", name: "Mohamad Rezza", phone: "+62 856-7890-1234", lastMessage: "Salam kenal kak Reza", lastMessageTime: "Yesterday", unread: 0 },
  { id: "9", name: "paradise group", phone: "+62 812-9876-5432", lastMessage: "Mau kita jadwalkan kapan kak?", lastMessageTime: "Yesterday", unread: 0 },
];

const mockMessages: Message[] = [
  { id: "1", text: "https://meet.google.com/snm-hgmd-omm", time: "09:39", fromMe: false, status: "read", type: "link", date: "4 Apr 2026" },
  { id: "2", text: "https://meet.google.com/ivo-vfch-xfn", time: "13:04", fromMe: true, status: "read", type: "link" },
  { id: "3", text: "https://meet.google.com/ivo-vfch-xfn", time: "13:05", fromMe: true, status: "read", type: "link" },
  { id: "4", text: "[AutoAudit] - WEBINAR 2026.pdf", time: "13:47", fromMe: false, status: "read", type: "pdf", fileName: "[AutoAudit] - WEBINAR 2026.pdf", fileSize: "2.6 MB" },
  { id: "5", text: "GOPROPERTY1-030426.pdf", time: "12:59", fromMe: false, status: "read", type: "pdf", fileName: "GOPROPERTY1-030426.pdf", fileSize: "192 KB", date: "5 Apr 2026" },
  { id: "6", text: "Halo kak, terima kasih sudah menghubungi Ayres! Di Ayres kami mengutamakan Deadline Aman dan pengembangan pola khusus melalui Pattern Lab supaya jersey benar-benar menunjang performa atlet.", time: "15:30", fromMe: true, status: "read", type: "text" },
  { id: "7", text: "https://app-autoaudit.ordoagentic.ai/try-now/self-registration", time: "17:16", fromMe: false, status: "read", type: "link" },
];

export default function ChatDetailPage() {
  const [selectedContact, setSelectedContact] = useState<Contact>(mockContacts[1]);
  const [searchChat, setSearchChat] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "analytics">("chat");

  const filteredContacts = mockContacts.filter(
    (c) => c.name.toLowerCase().includes(searchChat.toLowerCase()) || c.phone.includes(searchChat)
  );

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Top Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/dashboard/sales" style={{ padding: 4, borderRadius: 8, display: "flex" }}>
            <ArrowLeft style={{ width: 20, height: 20, color: "#6b7280" }} />
          </Link>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Sales Faiz - Detail</div>
            <div style={{ fontSize: 12, color: "#3b82f6" }}>
              Menampilkan semua pesan (179 chat, 2,669 pesan) &middot; 164 contacts
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#10b981" }}>31ms</span>
          </div>
          <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "4px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#9ca3af" }}>Sisa Saldo</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>7,511,760 <span style={{ fontSize: 10, fontWeight: 400, color: "#9ca3af" }}>tokens</span></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 12px" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#dbeafe", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>A</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>Ayres Admin</div>
              <div style={{ fontSize: 10, color: "#9ca3af" }}>admin@ayres.id</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 20px", display: "flex", gap: 0, flexShrink: 0 }}>
        {["chat", "analytics"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as "chat" | "analytics")}
            style={{
              padding: "10px 16px",
              fontSize: 14,
              fontWeight: 500,
              border: "none",
              background: "none",
              cursor: "pointer",
              borderBottom: activeTab === tab ? "2px solid #3b82f6" : "2px solid transparent",
              color: activeTab === tab ? "#3b82f6" : "#9ca3af",
            }}
          >
            {tab === "chat" ? "Chat Details" : "Analytics"}
          </button>
        ))}
      </div>

      {activeTab === "chat" ? (
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Contact List */}
          <div style={{ width: 350, borderRight: "1px solid #e5e7eb", background: "#fff", display: "flex", flexDirection: "column", flexShrink: 0 }}>
            <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>
              <div style={{ position: "relative" }}>
                <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#9ca3af" }} />
                <input
                  type="text"
                  placeholder="Search chat"
                  value={searchChat}
                  onChange={(e) => setSearchChat(e.target.value)}
                  style={{ width: "100%", paddingLeft: 40, paddingRight: 16, paddingTop: 8, paddingBottom: 8, border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none" }}
                />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    textAlign: "left",
                    border: "none",
                    cursor: "pointer",
                    borderBottom: "1px solid #f3f4f6",
                    background: selectedContact.id === contact.id ? "#eff6ff" : "#fff",
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "#6b7280", flexShrink: 0 }}>
                    {contact.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>{contact.name}</span>
                      <span style={{ fontSize: 11, color: "#9ca3af", flexShrink: 0 }}>{contact.lastMessageTime}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                      <CheckCheck style={{ width: 14, height: 14, color: "#3b82f6", flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{contact.lastMessage}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            {/* Chat Header */}
            <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "#6b7280" }}>
                  {selectedContact.name[0]}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{selectedContact.name}</div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>{selectedContact.phone}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {[Search, Pin, Volume2, MoreVertical].map((Icon, i) => (
                  <button key={i} style={{ padding: 8, background: "none", border: "none", cursor: "pointer", borderRadius: 8 }}>
                    <Icon style={{ width: 16, height: 16, color: "#6b7280" }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: 16, background: "#efeae2" }}>
              {mockMessages.map((msg, i) => {
                const showDate = msg.date && (i === 0 || mockMessages[i - 1].date !== msg.date);
                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div style={{ display: "flex", justifyContent: "center", margin: "16px 0" }}>
                        <span style={{ background: "rgba(255,255,255,0.9)", padding: "4px 16px", borderRadius: 8, fontSize: 12, color: "#6b7280", boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>{msg.date}</span>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: msg.fromMe ? "flex-end" : "flex-start", marginBottom: 4 }}>
                      <div style={{
                        maxWidth: "60%",
                        borderRadius: 8,
                        padding: "6px 12px",
                        boxShadow: "0 1px 1px rgba(0,0,0,0.06)",
                        background: msg.fromMe ? "#dcf8c6" : "#fff",
                      }}>
                        {msg.type === "pdf" ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.5)", borderRadius: 8, padding: 8, border: "1px solid #e5e7eb" }}>
                            <div style={{ width: 36, height: 36, background: "#fee2e2", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <FileText style={{ width: 16, height: 16, color: "#ef4444" }} />
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{msg.fileName}</div>
                              <div style={{ fontSize: 11, color: "#9ca3af" }}>{msg.fileSize} &middot; PDF</div>
                            </div>
                          </div>
                        ) : msg.type === "link" ? (
                          <div style={{ fontSize: 13, color: "#3b82f6", wordBreak: "break-all", textDecoration: "underline" }}>{msg.text}</div>
                        ) : (
                          <div style={{ fontSize: 13, color: "#111827", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{msg.text}</div>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: msg.fromMe ? "flex-end" : "flex-start", marginTop: 2 }}>
                          <span style={{ fontSize: 10, color: "#9ca3af" }}>{msg.time}</span>
                          {msg.fromMe && <CheckCheck style={{ width: 14, height: 14, color: msg.status === "read" ? "#3b82f6" : "#9ca3af" }} />}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom action buttons */}
            <div style={{ background: "#fff", borderTop: "1px solid #e5e7eb", padding: "8px 16px", display: "flex", justifyContent: "flex-end", gap: 8, flexShrink: 0 }}>
              {[Search, { icon: "edit" }, MoreVertical].map((_, i) => (
                <button key={i} style={{ width: 40, height: 40, borderRadius: "50%", background: "#f3f4f6", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Search style={{ width: 18, height: 18, color: "#6b7280" }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Analytics Tab */
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
            {[
              { label: "Total Chats", value: "179", color: "#3b82f6" },
              { label: "Total Pesan", value: "2,669", color: "#10b981" },
              { label: "Total Kontak", value: "164", color: "#f59e0b" },
              { label: "Avg Response", value: "2.1 min", color: "#10b981" },
            ].map((s) => (
              <div key={s.label} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 20 }}>
                <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            {[
              { label: "Hot Leads", value: 23, bg: "#fef2f2", border: "#fecaca", color: "#dc2626" },
              { label: "Warm Leads", value: 45, bg: "#fffbeb", border: "#fde68a", color: "#d97706" },
              { label: "Cold Leads", value: 96, bg: "#eff6ff", border: "#bfdbfe", color: "#2563eb" },
            ].map((l) => (
              <div key={l.label} style={{ background: l.bg, borderRadius: 12, border: `1px solid ${l.border}`, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: l.color }}>{l.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: l.color, marginTop: 4 }}>{l.value}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 16 }}>SOP Compliance Score</div>
            {[
              { sop: "SOP 1 - Respon Pesan", score: 90, color: "#10b981" },
              { sop: "SOP 2 - Penanganan Komplain", score: 85, color: "#3b82f6" },
              { sop: "SOP 3 - Survei Kepuasan", score: 78, color: "#f59e0b" },
            ].map((item) => (
              <div key={item.sop} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>{item.sop}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{item.score}%</span>
                </div>
                <div style={{ width: "100%", background: "#f3f4f6", borderRadius: 999, height: 8 }}>
                  <div style={{ width: `${item.score}%`, background: item.color, borderRadius: 999, height: 8 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
