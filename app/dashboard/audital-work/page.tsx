"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  BarChart3,
  Search,
  MessageSquare,
  Send,
  Paperclip,
  Smile,
  CheckCheck,
  Phone,
  MoreVertical,
  ArrowDown,
} from "lucide-react";

interface Contact {
  jid: string;
  phone: string;
  name: string | null;
  last_message: string | null;
  last_message_at: string | null;
  total_messages: number;
  assigned_cs_id: number | null;
  assigned_cs_name: string | null;
}

interface CurrentUser {
  id: number;
  name: string;
  permissions: string[];
}

interface Message {
  message_id: string;
  contact_jid: string;
  from_me: number;
  message_type: string;
  body: string | null;
  timestamp: string;
}

interface WAStatus {
  status: "waiting" | "connected" | "disconnected";
}

export default function AuditalWorkPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [waConnected, setWaConnected] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const prevMsgCountRef = useRef(0);

  // Scroll to bottom
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
  };

  // Detect if scrolled up
  const handleScroll = () => {
    const el = chatContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setShowScrollBtn(!isNearBottom);
  };

  // Check WA status
  const checkWA = useCallback(async () => {
    try {
      const r = await fetch("/api/whatsapp");
      const data: WAStatus = await r.json();
      setWaConnected(data.status === "connected");
    } catch { /* ignore */ }
  }, []);

  // Load contacts
  const loadContacts = useCallback(async () => {
    try {
      const r = await fetch("/api/contacts");
      const data = await r.json();
      if (Array.isArray(data)) setContacts(data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  // Load messages
  const loadMessages = useCallback(async (jid: string, isAutoRefresh = false) => {
    try {
      const r = await fetch(`/api/messages?jid=${encodeURIComponent(jid)}`);
      const data = await r.json();
      if (Array.isArray(data)) {
        const hasNew = data.length > prevMsgCountRef.current;
        prevMsgCountRef.current = data.length;
        setMessages(data);

        // Auto-scroll only if new messages arrived and user is near bottom
        if (hasNew) {
          const el = chatContainerRef.current;
          const isNearBottom = !el || el.scrollHeight - el.scrollTop - el.clientHeight < 150;
          if (!isAutoRefresh || isNearBottom) {
            setTimeout(() => scrollToBottom(!isAutoRefresh), 50);
          }
        }
      }
    } catch { /* ignore */ }
  }, []);

  // Check if current user can reply to selected contact
  const canReply = (contact: Contact | null) => {
    if (!contact || !currentUser) return false;
    if (currentUser.permissions.includes("all")) return true;
    return contact.assigned_cs_id === currentUser.id;
  };

  // Initial load
  useEffect(() => {
    fetch("/api/auth").then(r => r.json()).then(d => {
      if (d.user) setCurrentUser(d.user);
    }).catch(() => {});
    checkWA();
    loadContacts();
  }, [checkWA, loadContacts]);

  // Select contact
  const handleSelect = (c: Contact) => {
    setSelected(c);
    setInput("");
    prevMsgCountRef.current = 0;
    loadMessages(c.jid, false);
  };

  // Realtime polling — contacts every 5s, messages every 2s
  useEffect(() => {
    const contactIv = setInterval(() => loadContacts(), 5000);
    const waIv = setInterval(() => checkWA(), 10000);
    return () => { clearInterval(contactIv); clearInterval(waIv); };
  }, [loadContacts, checkWA]);

  useEffect(() => {
    if (!selected) return;
    const msgIv = setInterval(() => loadMessages(selected.jid, true), 2000);
    return () => clearInterval(msgIv);
  }, [selected, loadMessages]);

  // Send message
  const handleSend = async () => {
    if (!input.trim() || !selected || sending) return;
    const text = input.trim();
    setSending(true);
    setInput("");

    try {
      await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jid: selected.jid, message: text }),
      });
      // Quick refresh
      setTimeout(() => loadMessages(selected.jid, false), 800);
      setTimeout(() => loadContacts(), 1000);
    } catch { /* ignore */ }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Filter contacts
  const filtered = contacts.filter((c) => {
    const q = searchQ.toLowerCase();
    return (c.name || "").toLowerCase().includes(q) || c.phone.toLowerCase().includes(q) || (c.last_message || "").toLowerCase().includes(q);
  });

  // Format helpers
  const formatTime = (ts: string | null) => {
    if (!ts) return "";
    return new Date(ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (ts: string) => {
    const d = new Date(ts);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Hari Ini";
    if (d.toDateString() === yesterday.toDateString()) return "Kemarin";
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
  };

  const formatContactTime = (ts: string | null) => {
    if (!ts) return "";
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return formatTime(ts);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Kemarin";
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "2-digit" });
  };

  const displayName = (c: Contact) => c.name || c.phone;

  const getDateLabel = (ts: string, prevTs?: string) => {
    const d = formatDate(ts);
    const pd = prevTs ? formatDate(prevTs) : null;
    return d !== pd ? d : null;
  };

  // --- Loading state ---
  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #e5e7eb", borderTop: "3px solid #3b82f6", borderRadius: "50%", margin: "0 auto 12px", animation: "wa-spin 0.8s linear infinite" }} />
          <p style={{ fontSize: 14, color: "#6b7280" }}>Memuat data...</p>
          <style>{`@keyframes wa-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // --- Empty / not connected ---
  if (contacts.length === 0) {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "12px 20px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <BarChart3 style={{ width: 20, height: 20, color: "#111827" }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Audital Work</span>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f2f5" }}>
          <div style={{ textAlign: "center", maxWidth: 400 }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <MessageSquare style={{ width: 32, height: 32, color: "#9ca3af" }} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>Belum ada data</h2>
            <p style={{ fontSize: 14, color: "#6b7280", margin: 0, lineHeight: 1.6 }}>
              Hubungkan WhatsApp terlebih dahulu di menu <strong>Connect WhatsApp</strong>. Setelah terhubung, seluruh history chat akan otomatis tersimpan.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- Main UI ---
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BarChart3 style={{ width: 20, height: 20, color: "#111827" }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Audital Work</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 999, background: waConnected ? "#dcfce7" : "#fef2f2", fontSize: 12, fontWeight: 600, color: waConnected ? "#16a34a" : "#ef4444" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: waConnected ? "#16a34a" : "#ef4444" }} />
            {waConnected ? "WhatsApp Connected" : "Disconnected"}
          </div>
          <span style={{ fontSize: 13, color: "#6b7280" }}>
            {contacts.length} kontak &middot; {contacts.reduce((a, c) => a + c.total_messages, 0)} pesan
          </span>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Contact List */}
        <div style={{ width: 340, borderRight: "1px solid #e5e7eb", background: "#fff", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          {/* Search */}
          <div style={{ padding: "8px 12px", background: "#f0f2f5" }}>
            <div style={{ position: "relative" }}>
              <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#9ca3af" }} />
              <input
                type="text"
                placeholder="Cari atau mulai chat baru"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                style={{ width: "100%", paddingLeft: 38, paddingRight: 16, paddingTop: 8, paddingBottom: 8, border: "none", borderRadius: 8, fontSize: 13, outline: "none", background: "#fff" }}
              />
            </div>
          </div>

          {/* Contact Items */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filtered.map((c) => {
              const isSelected = selected?.jid === c.jid;
              return (
                <button
                  key={c.jid}
                  onClick={() => handleSelect(c)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 16px", textAlign: "left", border: "none",
                    borderBottom: "1px solid #f3f4f6", cursor: "pointer",
                    background: isSelected ? "#f0f2f5" : "#fff",
                  }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#dfe5e7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 600, color: "#fff", flexShrink: 0, backgroundImage: "linear-gradient(135deg, #00a884, #25d366)" }}>
                    {(c.name || c.phone)[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 15, fontWeight: 500, color: "#111b21", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>
                        {displayName(c)}
                      </span>
                      <span style={{ fontSize: 12, color: "#667781", flexShrink: 0 }}>
                        {formatContactTime(c.last_message_at)}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                      <CheckCheck style={{ width: 16, height: 16, color: "#53bdeb", flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: "#667781", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                        {c.last_message || "—"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat Area */}
        {selected ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            {/* Chat Header */}
            <div style={{ background: "#f0f2f5", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 600, color: "#fff", backgroundImage: "linear-gradient(135deg, #00a884, #25d366)" }}>
                  {(selected.name || selected.phone)[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#111b21" }}>{displayName(selected)}</div>
                  <div style={{ fontSize: 12, color: "#667781" }}>{selected.phone}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[Search, Phone, MoreVertical].map((Icon, i) => (
                  <button key={i} style={{ padding: 8, background: "none", border: "none", cursor: "pointer", borderRadius: "50%" }}>
                    <Icon style={{ width: 20, height: 20, color: "#54656f" }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div
              ref={chatContainerRef}
              onScroll={handleScroll}
              style={{
                flex: 1, overflowY: "auto", padding: "8px 60px", position: "relative",
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Cg fill='%23d1d7db' fill-opacity='0.08'%3E%3Cpath d='M200 0c-22 0-40 18-40 40s18 40 40 40 40-18 40-40-18-40-40-40zm0 320c-22 0-40 18-40 40s18 40 40 40 40-18 40-40-18-40-40-40zm160-160c-22 0-40 18-40 40s18 40 40 40 40-18 40-40-18-40-40-40zM40 160c-22 0-40 18-40 40s18 40 40 40 40-18 40-40-18-40-40-40z'/%3E%3C/g%3E%3C/svg%3E\")",
                backgroundColor: "#efeae2",
              }}
            >
              {messages.length === 0 ? (
                <div style={{ textAlign: "center", marginTop: 60 }}>
                  <div style={{ background: "#fcf4cb", display: "inline-block", padding: "8px 16px", borderRadius: 8, fontSize: 13, color: "#54656f" }}>
                    Pesan terenkripsi end-to-end. History chat tersimpan di database.
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const dateLabel = getDateLabel(msg.timestamp, i > 0 ? messages[i - 1].timestamp : undefined);
                  return (
                    <div key={msg.message_id}>
                      {dateLabel && (
                        <div style={{ display: "flex", justifyContent: "center", margin: "12px 0" }}>
                          <span style={{ background: "#fff", padding: "5px 12px", borderRadius: 8, fontSize: 12, color: "#54656f", boxShadow: "0 1px 1px rgba(0,0,0,0.06)", fontWeight: 500 }}>
                            {dateLabel}
                          </span>
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: msg.from_me ? "flex-end" : "flex-start", marginBottom: 2 }}>
                        <div style={{
                          maxWidth: "55%", borderRadius: 8, padding: "6px 8px 4px",
                          boxShadow: "0 1px 0.5px rgba(0,0,0,0.13)",
                          background: msg.from_me ? "#d9fdd3" : "#fff",
                          borderTopLeftRadius: msg.from_me ? 8 : 0,
                          borderTopRightRadius: msg.from_me ? 0 : 8,
                        }}>
                          <span style={{ fontSize: 14, color: "#111b21", whiteSpace: "pre-wrap", lineHeight: 1.45, wordBreak: "break-word" }}>
                            {msg.body || `[${msg.message_type}]`}
                          </span>
                          <span style={{ float: "right", marginLeft: 8, marginTop: 2, display: "inline-flex", alignItems: "center", gap: 3 }}>
                            <span style={{ fontSize: 11, color: "#667781" }}>{formatTime(msg.timestamp)}</span>
                            {msg.from_me ? (
                              <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
                                <path d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.011-2.169a.46.46 0 0 0-.329-.147.457.457 0 0 0-.334.134.477.477 0 0 0-.103.678l2.245 2.87c.164.208.443.326.678.163l6.755-8.316a.453.453 0 0 0-.026-.625z" fill="#53bdeb"/>
                                <path d="M14.757.653a.457.457 0 0 0-.305-.102.493.493 0 0 0-.38.178l-6.19 7.636-1.166-1.258-.463.571 1.36 1.74c.163.208.442.326.677.163l6.755-8.316a.477.477 0 0 0 .103-.337.477.477 0 0 0-.13-.288z" fill="#53bdeb"/>
                              </svg>
                            ) : null}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />

              {/* Scroll to bottom button */}
              {showScrollBtn && (
                <button
                  onClick={() => scrollToBottom()}
                  style={{
                    position: "sticky", bottom: 8, left: "50%", transform: "translateX(-50%)",
                    width: 40, height: 40, borderRadius: "50%", background: "#fff",
                    border: "none", boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <ArrowDown style={{ width: 20, height: 20, color: "#54656f" }} />
                </button>
              )}
            </div>

            {/* Input Area */}
            {canReply(selected) ? (
              <div style={{ background: "#f0f2f5", padding: "6px 16px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <button style={{ padding: 8, background: "none", border: "none", cursor: "pointer" }}>
                  <Smile style={{ width: 24, height: 24, color: "#54656f" }} />
                </button>
                <button style={{ padding: 8, background: "none", border: "none", cursor: "pointer" }}>
                  <Paperclip style={{ width: 24, height: 24, color: "#54656f", transform: "rotate(45deg)" }} />
                </button>
                <input
                  type="text"
                  placeholder="Ketik pesan"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={!waConnected}
                  style={{
                    flex: 1, padding: "9px 12px", border: "none", borderRadius: 8,
                    fontSize: 15, outline: "none", background: "#fff",
                    color: "#111b21",
                    opacity: waConnected ? 1 : 0.5,
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending || !waConnected}
                  style={{ padding: 8, background: "none", border: "none", cursor: input.trim() && !sending && waConnected ? "pointer" : "default" }}
                >
                  <Send style={{ width: 24, height: 24, color: input.trim() && waConnected ? "#00a884" : "#8696a0" }} />
                </button>
              </div>
            ) : (
              <div style={{ background: "#f0f2f5", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexShrink: 0, borderTop: "1px solid #e5e7eb" }}>
                <div style={{ fontSize: 13, color: "#667781", display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#667781" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Ditangani oleh <strong style={{ color: "#374151" }}>{selected?.assigned_cs_name || "CS lain"}</strong> &mdash; Anda tidak dapat membalas percakapan ini
                </div>
              </div>
            )}
          </div>
        ) : (
          /* No contact selected */
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f2f5", borderBottom: "6px solid #00a884" }}>
            <div style={{ textAlign: "center", maxWidth: 500 }}>
              <div style={{ width: 320, height: 200, margin: "0 auto 28px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="250" height="200" viewBox="0 0 250 200" fill="none">
                  <rect x="25" y="30" width="200" height="140" rx="12" fill="#dbeafe" opacity="0.5"/>
                  <rect x="50" y="55" width="100" height="12" rx="6" fill="#bfdbfe"/>
                  <rect x="50" y="75" width="140" height="8" rx="4" fill="#dbeafe"/>
                  <rect x="50" y="90" width="120" height="8" rx="4" fill="#dbeafe"/>
                  <rect x="50" y="110" width="80" height="30" rx="8" fill="#d9fdd3"/>
                  <rect x="140" y="110" width="60" height="30" rx="8" fill="#fff" stroke="#e5e7eb"/>
                  <circle cx="200" cy="50" r="20" fill="#25d366" opacity="0.3"/>
                  <circle cx="200" cy="50" r="12" fill="#25d366" opacity="0.5"/>
                </svg>
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 300, color: "#41525d", margin: "0 0 12px" }}>Ayres Audit WhatsApp</h2>
              <p style={{ fontSize: 14, color: "#667781", margin: "0 0 32px", lineHeight: 1.6 }}>
                Kirim dan terima pesan WhatsApp. Seluruh percakapan tersimpan otomatis untuk keperluan audit dan analisa AI.
              </p>
              <div style={{ height: 1, background: "#e5e7eb", margin: "0 40px" }} />
              <p style={{ fontSize: 13, color: "#8696a0", marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="#8696a0"><path d="M8 1a7 7 0 107 7A7 7 0 008 1zm0 12.5A5.5 5.5 0 1113.5 8 5.51 5.51 0 018 13.5zM8 4a.75.75 0 00-.75.75v3.5a.75.75 0 00.37.65l2.5 1.5a.75.75 0 10.76-1.3L8.75 7.85V4.75A.75.75 0 008 4z"/></svg>
                Pesan realtime &mdash; auto refresh setiap 2 detik
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
