"use client";

import { useEffect, useState, useCallback } from "react";
import { UserCheck, Plus, Trash2, X, Users } from "lucide-react";

interface CSPerson {
  id: number;
  name: string;
  username: string;
  role: string;
  is_online: number;
  assigned_contacts: number;
}

export default function PersonCSPage() {
  const [persons, setPersons] = useState<CSPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formName, setFormName] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");

  const loadData = useCallback(async () => {
    try {
      const r = await fetch("/api/cs-persons");
      const d = await r.json();
      if (d.persons) setPersons(d.persons);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openModal = () => {
    setFormName(""); setFormUsername(""); setFormPassword(""); setError(""); setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formUsername.trim() || !formPassword.trim()) {
      setError("Nama, username, dan password wajib diisi"); return;
    }
    setSaving(true); setError("");
    try {
      const r = await fetch("/api/cs-persons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, username: formUsername, password: formPassword }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Gagal menyimpan"); setSaving(false); return; }
      setShowModal(false);
      await loadData();
    } catch { setError("Terjadi kesalahan"); }
    setSaving(false);
  };

  const handleToggleOnline = async (p: CSPerson) => {
    await fetch(`/api/cs-persons/${p.id}`, { method: "PATCH" });
    loadData();
  };

  const handleDelete = async (p: CSPerson) => {
    if (!confirm(`Hapus CS "${p.name}"? Kontak yang di-assign ke CS ini akan menjadi tidak ter-assign.`)) return;
    await fetch(`/api/cs-persons/${p.id}`, { method: "DELETE" });
    loadData();
  };

  const totalAssigned = persons.reduce((s, p) => s + Number(p.assigned_contacts), 0);

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #e5e7eb", borderTop: "3px solid #8b5cf6", borderRadius: "50%", margin: "0 auto 12px", animation: "spin 0.8s linear infinite" }} />
          <p style={{ fontSize: 14, color: "#6b7280" }}>Memuat data...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 28px", maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, background: "#8b5cf6", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <UserCheck style={{ width: 20, height: 20, color: "#fff" }} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: 0 }}>Person CS</h1>
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Data CS yang digunakan untuk distribusi kontak</p>
          </div>
        </div>
        <button
          onClick={openModal}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "#8b5cf6", color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer" }}
        >
          <Plus style={{ width: 16, height: 16 }} /> Tambah CS
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total CS", value: persons.length, color: "#8b5cf6" },
          { label: "Total Kontak Di-assign", value: totalAssigned, color: "#10b981" },
          { label: "Rata-rata Kontak / CS", value: persons.length ? Math.round(totalAssigned / persons.length) : 0, color: "#3b82f6" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 20px" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      {persons.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "60px 20px", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Users style={{ width: 28, height: 28, color: "#9ca3af" }} />
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#374151", margin: "0 0 8px" }}>Belum ada CS</h2>
          <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>Klik <strong>Tambah CS</strong> untuk mendaftarkan CS pertama.</p>
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                {["Nama CS", "Username", "Kontak Di-assign", "Status", "Aksi"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {persons.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < persons.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #8b5cf6, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff" }}>
                          {p.name[0].toUpperCase()}
                        </div>
                        <span style={{ position: "absolute", bottom: 1, right: 1, width: 10, height: 10, borderRadius: "50%", background: p.is_online ? "#22c55e" : "#d1d5db", border: "2px solid #fff" }} />
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{p.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: "#6b7280" }}>@{p.username}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{p.assigned_contacts}</span>
                      {totalAssigned > 0 && (
                        <div style={{ flex: 1, height: 6, background: "#f3f4f6", borderRadius: 3, maxWidth: 80 }}>
                          <div style={{ height: "100%", width: `${Math.round((Number(p.assigned_contacts) / totalAssigned) * 100)}%`, background: "linear-gradient(90deg, #8b5cf6, #3b82f6)", borderRadius: 3 }} />
                        </div>
                      )}
                    </div>
                  </td>
                  {/* Status toggle */}
                  <td style={{ padding: "14px 16px" }}>
                    <button
                      onClick={() => handleToggleOnline(p)}
                      title={p.is_online ? "Klik untuk set Offline" : "Klik untuk set Online"}
                      style={{
                        position: "relative", width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                        background: p.is_online ? "#22c55e" : "#d1d5db", transition: "background 0.2s", padding: 0,
                      }}
                    >
                      <span style={{
                        position: "absolute", top: 3, left: p.is_online ? 23 : 3,
                        width: 18, height: 18, borderRadius: "50%", background: "#fff",
                        transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                        display: "block",
                      }} />
                    </button>
                    <div style={{ fontSize: 10, color: p.is_online ? "#16a34a" : "#9ca3af", marginTop: 3, fontWeight: 600 }}>
                      {p.is_online ? "Online" : "Offline"}
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <button
                      onClick={() => handleDelete(p)}
                      style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", border: "1px solid #fecaca", borderRadius: 6, background: "#fff5f5", color: "#ef4444", fontSize: 12, cursor: "pointer", fontWeight: 500 }}
                    >
                      <Trash2 style={{ width: 13, height: 13 }} /> Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Tambah CS */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", borderRadius: 12, width: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>Tambah CS Baru</h2>
              <button onClick={() => setShowModal(false)} style={{ padding: 4, background: "none", border: "none", cursor: "pointer" }}>
                <X style={{ width: 18, height: 18, color: "#9ca3af" }} />
              </button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Nama Lengkap</label>
              <input
                type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Contoh: Budi Santoso"
                autoFocus
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Username</label>
              <input
                type="text" value={formUsername} onChange={(e) => setFormUsername(e.target.value)} placeholder="Contoh: budi_cs"
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Password</label>
              <input
                type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="Password login"
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px", marginBottom: 16, fontSize: 13, color: "#ef4444" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "8px 20px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", fontSize: 14, color: "#6b7280", cursor: "pointer" }}>Batal</button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: saving ? "#c4b5fd" : "#8b5cf6", color: "#fff", fontSize: 14, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
