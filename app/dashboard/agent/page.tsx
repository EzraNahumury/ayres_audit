"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Sparkles, User, Trash2, Plus, MessageSquare, Clock, Download, Filter, X, ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import ChatCalendar from "@/app/components/ChatCalendar";
import jsPDF from "jspdf";

function exportPdf(content: string) {
  const doc = new jsPDF();
  const margin = 20;
  const maxW = doc.internal.pageSize.getWidth() - margin * 2;
  const pageH = doc.internal.pageSize.getHeight() - margin;
  let y = margin;

  function checkPage(need: number) {
    if (y + need > pageH) { doc.addPage(); y = margin; }
  }

  function writeLine(text: string, opts?: { bold?: boolean; size?: number; color?: number[]; indent?: number }) {
    const sz = opts?.size || 11;
    const indent = opts?.indent || 0;
    doc.setFontSize(sz);
    doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
    doc.setTextColor(...(opts?.color || [30, 30, 30]) as [number, number, number]);
    const lines = doc.splitTextToSize(text, maxW - indent);
    for (const line of lines) {
      checkPage(sz * 0.5);
      doc.text(line, margin + indent, y);
      y += sz * 0.5 + 1.5;
    }
  }

  // Header
  doc.setFillColor(139, 92, 246);
  doc.roundedRect(margin, y - 4, 10, 10, 2, 2, "F");
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("A", margin + 3.2, y + 3);
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(16);
  doc.text("Ayres Agent Report", margin + 14, y + 3);
  y += 12;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 150, 150);
  doc.text(new Date().toLocaleString("id-ID"), margin, y);
  y += 8;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, margin + maxW, y);
  y += 10;

  // Parse content line by line
  const raw = content.replace(/\r\n/g, "\n");
  const lines = raw.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    // Empty line = spacing
    if (!trimmed) { y += 4; continue; }

    // Horizontal rule
    if (/^[-—]{3,}$/.test(trimmed)) {
      checkPage(8);
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y, margin + maxW, y);
      y += 8;
      continue;
    }

    // Heading ### or ##  or #
    if (trimmed.startsWith("### ")) {
      writeLine(trimmed.replace(/^###\s*/, ""), { bold: true, size: 12 });
      y += 2;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      writeLine(trimmed.replace(/^##\s*/, ""), { bold: true, size: 13 });
      y += 2;
      continue;
    }
    if (trimmed.startsWith("# ")) {
      writeLine(trimmed.replace(/^#\s*/, ""), { bold: true, size: 14 });
      y += 2;
      continue;
    }

    // Clean markdown formatting from text
    let clean = trimmed
      .replace(/\*\*(.+?)\*\*/g, "$1")  // bold
      .replace(/\*(.+?)\*/g, "$1")      // italic
      .replace(/`(.+?)`/g, "$1");       // code

    // Bullet point
    if (clean.startsWith("- ") || clean.startsWith("* ")) {
      const text = clean.replace(/^[-*]\s*/, "");
      checkPage(6);
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
      doc.text("\u2022", margin + 4, y);
      const wrapped = doc.splitTextToSize(text, maxW - 12);
      for (const w of wrapped) {
        checkPage(6);
        doc.text(w, margin + 10, y);
        y += 6;
      }
      continue;
    }

    // Numbered list
    const numMatch = clean.match(/^(\d+)\.\s*(.*)/);
    if (numMatch) {
      checkPage(6);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(`${numMatch[1]}.`, margin + 2, y);
      doc.setFont("helvetica", "normal");
      const wrapped = doc.splitTextToSize(numMatch[2], maxW - 14);
      for (const w of wrapped) {
        checkPage(6);
        doc.text(w, margin + 12, y);
        y += 6;
      }
      continue;
    }

    // Regular text
    writeLine(clean);
  }

  doc.save(`ayres-report-${Date.now()}.pdf`);
}

interface ChatSession { id: number; title: string; created_at: string; updated_at: string; }
interface Message { role: "user" | "assistant"; content: string; }
interface ContactOption { jid: string; phone: string; name: string | null; }

export default function AgentPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter state
  const [showFilter, setShowFilter] = useState(false);
  const [filterChatType, setFilterChatType] = useState<"all" | "private" | "group">("all");
  const [filterContact, setFilterContact] = useState<string>("all");
  const [filterDateType, setFilterDateType] = useState<"all" | "range">("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [contactOptions, setContactOptions] = useState<ContactOption[]>([]);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [contactTab, setContactTab] = useState<"all" | "bookmark" | "notbookmark">("all");
  const [bookmarkedContacts, setBookmarkedContacts] = useState<string[]>([]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);

  // Load contacts for filter dropdown
  useEffect(() => {
    fetch("/api/contacts").then(r => r.json()).then(data => {
      if (Array.isArray(data)) setContactOptions(data);
    }).catch(() => {});
  }, []);

  // Load sessions
  const loadSessions = useCallback(async () => {
    try {
      const r = await fetch("/api/agent/chats");
      const data = await r.json();
      if (Array.isArray(data)) setSessions(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  // Load messages for a session
  const loadChat = async (id: number) => {
    setActiveChat(id);
    try {
      const r = await fetch(`/api/agent/chats/${id}`);
      const data = await r.json();
      if (Array.isArray(data)) setMessages(data.map((m: any) => ({ role: m.role, content: m.content })));
    } catch { /* ignore */ }
  };

  // New chat
  const handleNewChat = () => {
    setActiveChat(null);
    setMessages([]);
    setInput("");
  };

  // Delete chat
  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`/api/agent/chats/${id}`, { method: "DELETE" });
    if (activeChat === id) handleNewChat();
    loadSessions();
  };

  // Build filter context string
  const getFilterContext = () => {
    const parts: string[] = [];
    if (filterChatType !== "all") parts.push(`Jenis chat: ${filterChatType === "private" ? "Private Chat saja" : "Group Chat saja"}`);
    if (selectedContacts.length > 0) {
      const names = selectedContacts.map(jid => {
        const c = contactOptions.find(c => c.jid === jid);
        return c?.name || c?.phone || jid;
      });
      parts.push(`Fokus pada percakapan dengan: ${names.join(", ")}`);
    }
    if (filterDateType === "range" && filterDateFrom && filterDateTo) {
      parts.push(`Periode: ${filterDateFrom} sampai ${filterDateTo}`);
    }
    return parts.length > 0 ? `\n\n[FILTER AKTIF: ${parts.join(", ")}]` : "";
  };

  // Send message
  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userContent = input.trim() + getFilterContext();
    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m, i) => i === newMessages.length - 1 && m.role === "user" ? { ...m, content: userContent } : m),
          chatId: activeChat,
          filter: { chatType: filterChatType, contact: filterContact, dateFrom: filterDateFrom, dateTo: filterDateTo },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages([...newMessages, { role: "assistant", content: data.reply }]);
        if (data.chatId && !activeChat) setActiveChat(data.chatId);
        loadSessions();
      } else {
        const err = await res.json();
        setMessages([...newMessages, { role: "assistant", content: `Error: ${err.error || "Gagal menghubungi AI"}` }]);
      }
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Error: Tidak dapat terhubung ke server AI" }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Kemarin";
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
  };

  return (
    <div style={{ height: "100vh", display: "flex", overflow: "hidden" }}>
      {/* Sidebar — Chat History */}
      <div style={{ width: 280, borderRight: "1px solid #e5e7eb", background: "#f9fafb", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {/* New Chat Button */}
        <div style={{ padding: 12 }}>
          <button onClick={handleNewChat} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 16px", border: "1px solid #e5e7eb", borderRadius: 10, background: "#fff", fontSize: 14, fontWeight: 600, color: "#111827", cursor: "pointer" }}>
            <Plus style={{ width: 16, height: 16 }} /> Chat Baru
          </button>
        </div>

        {/* Sessions List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 8px" }}>
          {sessions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 16px", color: "#9ca3af", fontSize: 13 }}>
              <Clock style={{ width: 24, height: 24, margin: "0 auto 8px", color: "#d1d5db" }} />
              Belum ada riwayat chat
            </div>
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => loadChat(s.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: activeChat === s.id ? "#e5e7eb" : "transparent",
                  marginBottom: 2, textAlign: "left",
                }}
              >
                <MessageSquare style={{ width: 16, height: 16, color: "#9ca3af", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{formatTime(s.updated_at)}</div>
                </div>
                <button onClick={(e) => handleDelete(s.id, e)} style={{ padding: 4, background: "none", border: "none", cursor: "pointer", borderRadius: 4, opacity: 0.4 }}>
                  <Trash2 style={{ width: 14, height: 14, color: "#ef4444" }} />
                </button>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
        {/* Header */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles style={{ width: 18, height: 18, color: "#fff" }} />
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Ayres Agent</span>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>AI Assistant</span>
          </div>
          <button onClick={() => setShowFilter(!showFilter)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
            border: showFilter ? "1px solid #8b5cf6" : "1px solid #e5e7eb",
            borderRadius: 8, background: showFilter ? "#f5f3ff" : "#fff",
            fontSize: 13, fontWeight: 500, color: showFilter ? "#7c3aed" : "#6b7280", cursor: "pointer",
          }}>
            <Filter style={{ width: 14, height: 14 }} />
            Filter
            {(filterContact !== "all" || filterDateType !== "all" || filterChatType !== "all") && (
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#8b5cf6" }} />
            )}
          </button>
        </div>

        {/* Filter Panel — Popup */}
        {showFilter && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 90, paddingTop: 80 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", width: 700, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Terapkan Filter</div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>Sesuaikan dengan data yang ingin kamu audit</div>
              </div>
              <button onClick={() => setShowFilter(false)} style={{ padding: 4, background: "none", border: "none", cursor: "pointer" }}>
                <X style={{ width: 16, height: 16, color: "#9ca3af" }} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              {/* Chat Type */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Jenis chat yang mau audit</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {([["all", "Semua"], ["private", "Only Private Chat"], ["group", "Only Group Chat"]] as const).map(([val, label]) => (
                    <label key={val} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151", cursor: "pointer" }}>
                      <input type="radio" name="chatType" checked={filterChatType === val} onChange={() => setFilterChatType(val)}
                        style={{ accentColor: "#8b5cf6" }} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Contact Picker */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Audit Percakapan Tertentu</div>
                <button onClick={() => setShowContactPicker(true)} style={{
                  width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8,
                  fontSize: 13, background: "#fff", color: selectedContacts.length > 0 ? "#111827" : "#9ca3af",
                  cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span>{selectedContacts.length > 0 ? `${selectedContacts.length} kontak dipilih` : "Semua percakapan"}</span>
                  <span style={{ fontSize: 11, color: "#8b5cf6", fontWeight: 600 }}>Select</span>
                </button>
              </div>

              {/* Date Range */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Range Tanggal audit</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {([["all", "Semua Tanggal"], ["range", "Range Tanggal Tertentu"]] as const).map(([val, label]) => (
                    <label key={val} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151", cursor: "pointer" }}>
                      <input type="radio" name="dateType" checked={filterDateType === val} onChange={() => setFilterDateType(val)}
                        style={{ accentColor: "#8b5cf6" }} />
                      {label}
                    </label>
                  ))}
                  {filterDateType === "range" && (
                    <div style={{ marginTop: 8 }}>
                      <ChatCalendar onSelectRange={(from, to) => { setFilterDateFrom(from); setFilterDateTo(to); }} />
                      {filterDateFrom && filterDateTo && (
                        <div style={{ marginTop: 6, fontSize: 12, color: "#3b82f6", fontWeight: 500 }}>
                          {filterDateFrom} — {filterDateTo}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          </div>
        )}

        {/* Contact Picker Modal */}
        {showContactPicker && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div style={{ background: "#fff", borderRadius: 12, width: 440, maxHeight: 520, display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
              {/* Modal Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Audit Percakapan Tertentu</span>
                <button onClick={() => setShowContactPicker(false)} style={{ padding: 4, background: "none", border: "none", cursor: "pointer" }}>
                  <X style={{ width: 18, height: 18, color: "#9ca3af" }} />
                </button>
              </div>

              {/* Search */}
              <div style={{ padding: "12px 20px", borderBottom: "1px solid #e5e7eb" }}>
                <div style={{ position: "relative" }}>
                  <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#9ca3af" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  <input type="text" placeholder="Cari nama kontak..." value={contactSearch} onChange={(e) => setContactSearch(e.target.value)}
                    style={{ width: "100%", paddingLeft: 38, paddingRight: 16, paddingTop: 8, paddingBottom: 8, border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, outline: "none" }} />
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 8, padding: "8px 20px" }}>
                {([["all", "All"], ["bookmark", "Bookmark"], ["notbookmark", "Not Bookmark"]] as const).map(([val, label]) => (
                  <button key={val} onClick={() => setContactTab(val)}
                    style={{
                      padding: "5px 14px", borderRadius: 999, fontSize: 13, fontWeight: 500, border: "none", cursor: "pointer",
                      background: contactTab === val ? "#3b82f6" : "#f3f4f6",
                      color: contactTab === val ? "#fff" : "#6b7280",
                    }}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Contact List */}
              <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px" }}>
                {contactOptions
                  .filter(c => {
                    const matchSearch = (c.name || c.phone).toLowerCase().includes(contactSearch.toLowerCase());
                    const isBookmarked = bookmarkedContacts.includes(c.jid);
                    if (contactTab === "bookmark") return matchSearch && isBookmarked;
                    if (contactTab === "notbookmark") return matchSearch && !isBookmarked;
                    return matchSearch;
                  })
                  .map((c) => {
                    const checked = selectedContacts.includes(c.jid);
                    const isBookmarked = bookmarkedContacts.includes(c.jid);
                    return (
                      <div key={c.jid} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 8px", borderRadius: 8, background: checked ? "#f5f3ff" : "transparent" }}>
                        <input type="checkbox" checked={checked}
                          onChange={() => setSelectedContacts(prev => checked ? prev.filter(j => j !== c.jid) : [...prev, c.jid])}
                          style={{ accentColor: "#8b5cf6", width: 16, height: 16, flexShrink: 0, cursor: "pointer" }} />
                        <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundImage: "linear-gradient(135deg, #00a884, #25d366)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "#fff", flexShrink: 0 }}>
                          {(c.name || c.phone)[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => setSelectedContacts(prev => checked ? prev.filter(j => j !== c.jid) : [...prev, c.jid])}>
                          <div style={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>{c.name || "Unknown"}</div>
                          <div style={{ fontSize: 12, color: "#9ca3af" }}>{c.phone}</div>
                        </div>
                        <button onClick={() => setBookmarkedContacts(prev => isBookmarked ? prev.filter(j => j !== c.jid) : [...prev, c.jid])}
                          style={{ padding: 4, background: "none", border: "none", cursor: "pointer" }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill={isBookmarked ? "#3b82f6" : "none"} stroke={isBookmarked ? "#3b82f6" : "#d1d5db"} strokeWidth="2">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
              </div>

              {/* Footer */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderTop: "1px solid #e5e7eb" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#6b7280" }}>
                  {selectedContacts.length} kontak dipilih
                  <button onClick={() => setSelectedContacts(contactOptions.map(c => c.jid))} style={{ fontSize: 13, color: "#3b82f6", background: "none", border: "none", cursor: "pointer", fontWeight: 500, textDecoration: "underline" }}>Pilih Semua</button>
                  {selectedContacts.length > 0 && (
                    <button onClick={() => setSelectedContacts([])} style={{ fontSize: 13, color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>Reset</button>
                  )}
                </div>
                <button onClick={() => { setFilterContact(selectedContacts.length > 0 ? selectedContacts.join(",") : "all"); setShowContactPicker(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", background: "#8b5cf6", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>
                  Terapkan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", background: "#fafafa" }}>
          {messages.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", padding: 40 }}>
              <div style={{ textAlign: "center", maxWidth: 480 }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: "linear-gradient(135deg, #8b5cf6, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 8px 30px rgba(139,92,246,0.3)" }}>
                  <Sparkles style={{ width: 32, height: 32, color: "#fff" }} />
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>Ayres Agent</h2>
                <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, margin: "0 0 24px" }}>
                  AI assistant untuk analisa customer, audit CS, dan insight bisnis dari data WhatsApp.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                  {["Analisa leads dari chat terbaru", "Evaluasi kinerja CS berdasarkan SOP", "Berikan rekomendasi follow-up", "Buat ringkasan percakapan customer"].map((s, i) => (
                    <button key={i} onClick={() => setInput(s)} style={{ padding: "8px 14px", border: "1px solid #e5e7eb", borderRadius: 999, background: "#fff", fontSize: 13, color: "#6b7280", cursor: "pointer" }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: 768, margin: "0 auto", padding: "20px 20px 120px" }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: msg.role === "user" ? "#111827" : "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {msg.role === "user" ? <User style={{ width: 14, height: 14, color: "#fff" }} /> : <Sparkles style={{ width: 14, height: 14, color: "#fff" }} />}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{msg.role === "user" ? "Kamu" : "Ayres Agent"}</span>
                  </div>
                  <div className="agent-md" style={{ paddingLeft: 36, fontSize: 15, lineHeight: 1.7, color: "#374151", wordBreak: "break-word" }}>
                    {msg.role === "assistant" ? <ReactMarkdown>{msg.content}</ReactMarkdown> : <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>}
                  </div>
                  {msg.role === "assistant" && (
                    <div style={{ paddingLeft: 36, marginTop: 8 }}>
                      <button onClick={() => exportPdf(msg.content)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", fontSize: 12, color: "#6b7280", cursor: "pointer" }}>
                        <Download style={{ width: 13, height: 13 }} /> Export PDF
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Sparkles style={{ width: 14, height: 14, color: "#fff" }} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>Ayres Agent</span>
                  </div>
                  <div style={{ paddingLeft: 36, display: "flex", gap: 4 }}>
                    {[0, 1, 2].map((d) => (
                      <div key={d} style={{ width: 8, height: 8, borderRadius: "50%", background: "#8b5cf6", opacity: 0.5, animation: `bounce 1s ease-in-out ${d * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, #fafafa 30%)", padding: "40px 20px 20px" }}>
          <div style={{ maxWidth: 768, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "4px 4px 4px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <input
                type="text" placeholder="Tanya Ayres Agent..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} disabled={loading}
                style={{ flex: 1, border: "none", outline: "none", fontSize: 15, color: "#111827", background: "transparent", padding: "10px 0" }}
              />
              <button onClick={handleSend} disabled={!input.trim() || loading}
                style={{ width: 40, height: 40, borderRadius: 8, border: "none", cursor: input.trim() && !loading ? "pointer" : "default", background: input.trim() && !loading ? "#8b5cf6" : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Send style={{ width: 18, height: 18, color: input.trim() && !loading ? "#fff" : "#9ca3af" }} />
              </button>
            </div>
            <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", marginTop: 8 }}>
              Ayres Agent menggunakan AI dengan knowledge base dari database WhatsApp.
            </p>
          </div>
        </div>
      </div>

      <style>{`@keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }`}</style>
    </div>
  );
}
