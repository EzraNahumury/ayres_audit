"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, RefreshCw, Calendar } from "lucide-react";

interface ContactItem {
  jid: string;
  phone: string;
  name: string | null;
  last_message_at: string | null;
  assigned_at: string | null;
  total_messages: number;
}

interface CSAgent {
  id: number;
  name: string;
  username: string;
  is_online?: number;
  contact_count: number;
  contacts: ContactItem[];
}

interface DistributionData {
  cs_agents: CSAgent[];
  filtered_date: string | null;
}

function toLocalDateString(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function CSDistributionPage() {
  const today = toLocalDateString(new Date());
  const [data, setData] = useState<DistributionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [distributing, setDistributing] = useState(false);
  const [expandedCS, setExpandedCS] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const isToday = selectedDate === today;

  const loadData = useCallback(async (date: string) => {
    try {
      const url = `/api/distribution?date=${date}`;
      const r = await fetch(url);
      const d = await r.json();
      if (d.cs_agents) setData(d);
    } catch { /* ignore */ }
    setLoading(false);
  }, [today]);

  // Auto-distribute unassigned contacts (only for today view)
  const autoDistribute = useCallback(async () => {
    setDistributing(true);
    try {
      await fetch("/api/distribution", { method: "POST" });
    } catch { /* ignore */ }
    await loadData(today);
    setDistributing(false);
  }, [loadData, today]);

  useEffect(() => {
    autoDistribute();
  }, [autoDistribute]);

  const handleDateChange = async (date: string) => {
    setSelectedDate(date);
    setLoading(true);
    setExpandedCS(null);
    if (date === today) {
      await autoDistribute();
    } else {
      await loadData(date);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    if (isToday) {
      autoDistribute();
    } else {
      loadData(selectedDate);
    }
  };

  const formatTime = (ts: string | null) => {
    if (!ts) return "–";
    const d = new Date(ts);
    const todayD = new Date();
    if (d.toDateString() === todayD.toDateString())
      return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
  };

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };

  const totalContacts = data?.cs_agents.reduce((s, cs) => s + cs.contact_count, 0) ?? 0;

  if (loading || distributing) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #e5e7eb", borderTop: "3px solid #3b82f6", borderRadius: "50%", margin: "0 auto 12px", animation: "spin 0.8s linear infinite" }} />
          <p style={{ fontSize: 14, color: "#6b7280" }}>{distributing ? "Mendistribusikan kontak..." : "Memuat data..."}</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, background: "#3b82f6", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users style={{ width: 20, height: 20, color: "#fff" }} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: 0 }}>CS Distribution</h1>
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
              {isToday ? "Hari ini · distribusi otomatis" : formatDateLabel(selectedDate)}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Date Picker */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 12px" }}>
            <Calendar style={{ width: 15, height: 15, color: "#6b7280" }} />
            <input
              type="date"
              value={selectedDate}
              max={today}
              onChange={(e) => handleDateChange(e.target.value)}
              style={{ border: "none", outline: "none", fontSize: 13, color: "#374151", background: "transparent", cursor: "pointer" }}
            />
          </div>
          <button
            onClick={handleRefresh}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, cursor: "pointer", color: "#374151" }}
          >
            <RefreshCw style={{ width: 14, height: 14 }} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 28, maxWidth: 500 }}>
        {[
          { label: isToday ? "Total CS" : "CS Online Hari Ini", value: data?.cs_agents.length ?? 0, color: "#3b82f6" },
          { label: isToday ? "Total Kontak" : "Kontak Masuk Hari Ini", value: totalContacts, color: "#10b981" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 20px" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* History info banner */}
      {!isToday && (
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "10px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#1d4ed8" }}>
          <Calendar style={{ width: 15, height: 15, flexShrink: 0 }} />
          Menampilkan CS yang online pada <strong style={{ marginLeft: 4 }}>{formatDateLabel(selectedDate)}</strong> &mdash; kontak yang baru masuk hari itu
        </div>
      )}

      {/* CS Agent Cards */}
      {data && data.cs_agents.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {data.cs_agents.map((cs) => {
            const isExpanded = expandedCS === cs.id;
            const loadPct = totalContacts > 0 ? Math.round((cs.contact_count / totalContacts) * 100) : 0;
            return (
              <div key={cs.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
                {/* CS Header */}
                <div
                  style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", borderBottom: isExpanded ? "1px solid #f3f4f6" : "none" }}
                  onClick={() => setExpandedCS(isExpanded ? null : cs.id)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ position: "relative" }}>
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "#fff" }}>
                        {cs.name[0].toUpperCase()}
                      </div>
                      {/* Online dot (only for today view) */}
                      {isToday && (
                        <span style={{ position: "absolute", bottom: 1, right: 1, width: 10, height: 10, borderRadius: "50%", background: cs.is_online ? "#22c55e" : "#d1d5db", border: "2px solid #fff" }} />
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{cs.name}</div>
                      <div style={{ fontSize: 12, color: "#9ca3af" }}>@{cs.username}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>{cs.contact_count}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>
                      {isToday ? `kontak · ${loadPct}%` : `kontak masuk`}
                    </div>
                  </div>
                </div>

                {/* Load bar */}
                <div style={{ height: 4, background: "#f3f4f6" }}>
                  <div style={{ height: "100%", width: `${loadPct}%`, background: "linear-gradient(90deg, #3b82f6, #8b5cf6)", transition: "width 0.3s" }} />
                </div>

                {/* Contacts List (expanded) */}
                {isExpanded && (
                  <div style={{ maxHeight: 260, overflowY: "auto" }}>
                    {cs.contacts.length === 0 ? (
                      <div style={{ padding: "16px", textAlign: "center", fontSize: 13, color: "#9ca3af" }}>Belum ada kontak</div>
                    ) : (
                      cs.contacts.map((contact) => (
                        <div key={contact.jid} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", borderBottom: "1px solid #f9fafb" }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #00a884, #25d366)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                            {(contact.name || contact.phone)[0].toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
                              <span style={{ fontSize: 13, fontWeight: 500, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {contact.name || contact.phone}
                              </span>
                              {contact.name && (
                                <span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap", flexShrink: 0 }}>
                                  +{contact.phone}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: "#9ca3af" }}>
                              {contact.total_messages} pesan · {formatTime(contact.last_message_at || contact.assigned_at)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Users style={{ width: 28, height: 28, color: "#9ca3af" }} />
          </div>
          {isToday ? (
            <>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "#374151", margin: "0 0 8px" }}>Belum ada CS Agent</h2>
              <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>Tambahkan CS di menu <strong>Person CS</strong> terlebih dahulu.</p>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "#374151", margin: "0 0 8px" }}>Tidak ada CS online</h2>
              <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>Tidak ada CS yang tercatat online pada tanggal {formatDateLabel(selectedDate)}.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
