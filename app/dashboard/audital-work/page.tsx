"use client";

import { useState } from "react";
import { Plus, Send, Bookmark, Search, MoreVertical, BarChart3, X, Bot, User } from "lucide-react";

interface ChatSession { id: string; name: string; preview: string; date: string; }
interface AiMessage { id: string; role: "user" | "assistant"; content: string; timestamp: string; }
interface SavedPrompt { id: string; title: string; description: string; }

const mockSessions: ChatSession[] = [
  { id: "1", name: "Faiz", preview: "beri insight", date: "04/04/2026" },
  { id: "2", name: "Devina", preview: "tolong liskan lead yang masuk dari riwayat c...", date: "04/04/2026" },
  { id: "3", name: "Devina", preview: "Buatkan saya pipeline sales, dimana bisa m...", date: "04/04/2026" },
  { id: "4", name: "Anis", preview: "tampilkan database customer dalam peridoe...", date: "04/04/2026" },
  { id: "5", name: "Devina", preview: "berikan saya list leads yang tidak jadi closin...", date: "03/04/2026" },
  { id: "6", name: "Devina", preview: "Tolong liskan cust yang masuk di riwayat c...", date: "03/04/2026" },
  { id: "7", name: "Devina", preview: "ini sekedar test chat", date: "01/04/2026" },
];

const mockAiMessages: AiMessage[] = [
  { id: "1", role: "user", content: "tolong liskan lead beserta nomor hpnya, kategorikan juga statusnya apakah hot, warm, cold dan closing. tampilkan dalam bentuk tabel", timestamp: "14:30" },
  { id: "2", role: "assistant", content: "Berikut adalah daftar lead dari riwayat chat Sales Faiz:\n\n| No | Nama | No HP | Status |\n|----|------|-------|--------|\n| 1 | Customer Jersey Tim A | +62 878-1234-5678 | Hot |\n| 2 | ASTON NUSANTARA FARM | +62 813-9249-3171 | Warm |\n| 3 | Mikhael | +62 812-3456-7890 | Hot |\n| 4 | Paradise Group | +62 812-9876-5432 | Warm |\n| 5 | Ketut | +62 857-1234-5678 | Cold |\n\nSummary:\n- Hot Leads: 2 (perlu segera follow up)\n- Warm Leads: 2 (perlu edukasi & nurturing)\n- Cold Leads: 1 (awareness stage)\n\nRekomendasi:\n1. Prioritaskan Customer Jersey Tim A — ada urgency kompetisi\n2. Follow up Mikhael dengan penawaran repeat customer", timestamp: "14:31" },
];

const savedPrompts: SavedPrompt[] = [
  { id: "1", title: "tolong liskan lead yang masuk dari riwayat chat tersebut,...", description: "tolong liskan lead yang masuk dari riwayat chat tersebut, jadikan table dengan kolom meliputi Nama kontak, nomor kontak..." },
  { id: "2", title: "tampilkan database customer dalam periode ini...", description: "tampilkan database customer dalam periode ini dalam bentuk tabel berisi nama, nomor, status" },
  { id: "3", title: "tolong listkan lead beserta nomor hpnya...", description: "tolong listkan lead beserta nomor hpnya, kategorikan juga statusnya apakah hot, warm, cold dan closing" },
];

export default function AuditalWorkPage() {
  const [selectedSession, setSelectedSession] = useState(mockSessions[0]);
  const [messages, setMessages] = useState(mockAiMessages);
  const [input, setInput] = useState("");
  const [showSavedPrompts, setShowSavedPrompts] = useState(false);
  const [searchSessions, setSearchSessions] = useState("");

  const filteredSessions = mockSessions.filter((s) => s.name.toLowerCase().includes(searchSessions.toLowerCase()) || s.preview.toLowerCase().includes(searchSessions.toLowerCase()));

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { id: String(messages.length + 1), role: "user", content: input, timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) }]);
    setInput("");
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BarChart3 style={{ width: 20, height: 20, color: "#111827" }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Audital Work</span>
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
        </div>
      </div>

      {/* Sub Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "8px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>Chat History</span>
          <button style={{ display: "flex", alignItems: "center", gap: 6, background: "#3b82f6", color: "#fff", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500, border: "none", cursor: "pointer" }}>
            <Plus style={{ width: 14, height: 14 }} /> New Chat
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 12, color: "#6b7280" }}>
          <span>Sales: <strong style={{ color: "#111827" }}>{selectedSession.name}</strong></span>
          <span>Tokens: <strong style={{ color: "#10b981" }}>13,467</strong></span>
          <span>22 Mar 26 - 06 Apr 26</span>
          <span>AI: Ollama - Llama 3</span>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Session List */}
        <div style={{ width: 280, borderRight: "1px solid #e5e7eb", background: "#fff", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>
            <div style={{ position: "relative" }}>
              <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#9ca3af" }} />
              <input type="text" placeholder="Search chat..." value={searchSessions} onChange={(e) => setSearchSessions(e.target.value)}
                style={{ width: "100%", paddingLeft: 40, paddingRight: 16, paddingTop: 8, paddingBottom: 8, border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none" }} />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filteredSessions.map((session) => (
              <button key={session.id} onClick={() => setSelectedSession(session)}
                style={{ width: "100%", display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px", textAlign: "left", border: "none", borderBottom: "1px solid #f3f4f6", cursor: "pointer", background: selectedSession.id === session.id ? "#eff6ff" : "#fff" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#dbeafe", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{session.name[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{session.name}</span>
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>{session.date}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>{session.preview}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{ flex: 1, overflowY: "auto", padding: 20, background: "#fafafa" }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{ display: "flex", gap: 12, justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 16 }}>
                {msg.role === "assistant" && (
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Bot style={{ width: 16, height: 16, color: "#fff" }} />
                  </div>
                )}
                <div style={{ maxWidth: "70%", borderRadius: 12, padding: "12px 16px", background: msg.role === "user" ? "#3b82f6" : "#fff", color: msg.role === "user" ? "#fff" : "#111827", border: msg.role === "assistant" ? "1px solid #e5e7eb" : "none" }}>
                  <div style={{ fontSize: 14, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{msg.content}</div>
                  <div style={{ fontSize: 10, marginTop: 6, color: msg.role === "user" ? "rgba(255,255,255,0.6)" : "#9ca3af" }}>{msg.timestamp}</div>
                </div>
                {msg.role === "user" && (
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <User style={{ width: 16, height: 16, color: "#6b7280" }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input */}
          <div style={{ background: "#fff", borderTop: "1px solid #e5e7eb", padding: "12px 16px", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button style={{ padding: 8, background: "none", border: "none", cursor: "pointer" }}><Plus style={{ width: 20, height: 20, color: "#6b7280" }} /></button>
              <input type="text" placeholder="Message Sales Analytics Assistant..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()}
                style={{ flex: 1, padding: "8px 16px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none" }} />
              <button onClick={() => setShowSavedPrompts(true)} style={{ padding: 8, background: "none", border: "none", cursor: "pointer" }}><Bookmark style={{ width: 20, height: 20, color: "#6b7280" }} /></button>
              <button onClick={handleSend} style={{ padding: 10, background: "#3b82f6", borderRadius: "50%", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Send style={{ width: 18, height: 18, color: "#fff" }} />
              </button>
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", marginTop: 4 }}>Press Enter to send, Shift + Enter for new line.</div>
          </div>
        </div>
      </div>

      {/* Saved Prompts Modal */}
      {showSavedPrompts && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", borderRadius: 12, width: 520, maxHeight: 480, display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Saved prompts</div>
                <div style={{ fontSize: 14, color: "#6b7280" }}>Store and reuse your best prompts</div>
              </div>
              <button onClick={() => setShowSavedPrompts(false)} style={{ padding: 4, background: "none", border: "none", cursor: "pointer" }}><X style={{ width: 20, height: 20, color: "#6b7280" }} /></button>
            </div>
            <div style={{ padding: "8px 20px", borderBottom: "1px solid #e5e7eb" }}>
              <div style={{ position: "relative" }}>
                <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#9ca3af" }} />
                <input type="text" placeholder="Search saved prompts..." style={{ width: "100%", paddingLeft: 40, paddingRight: 16, paddingTop: 8, paddingBottom: 8, border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none" }} />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px" }}>
              {savedPrompts.map((prompt) => (
                <div key={prompt.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>{prompt.title}</div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>{prompt.description}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button onClick={() => { setInput(prompt.description); setShowSavedPrompts(false); handleSend(); }} style={{ padding: "4px 12px", background: "#3b82f6", color: "#fff", fontSize: 12, fontWeight: 500, borderRadius: 6, border: "none", cursor: "pointer" }}>Paste & run</button>
                    <button onClick={() => { setInput(prompt.description); setShowSavedPrompts(false); }} style={{ padding: "4px 12px", border: "1px solid #e5e7eb", color: "#6b7280", fontSize: 12, fontWeight: 500, borderRadius: 6, background: "none", cursor: "pointer" }}>Just paste</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
