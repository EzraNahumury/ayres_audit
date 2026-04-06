"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Shield, Trash2, Edit, X } from "lucide-react";

interface Role {
  id: number; name: string; description: string; permissions: string[];
  user_count: number; is_system: number;
}

const ALL_PERMISSIONS = [
  { key: "connect_wa", label: "Connect WhatsApp" },
  { key: "audital_work", label: "Audital Work" },
  { key: "data_customer", label: "Data Customer" },
  { key: "ayres_agent", label: "Ayres Agent" },
  { key: "roles", label: "Kelola Roles" },
  { key: "ai_settings", label: "AI Settings" },
];

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPerms, setFormPerms] = useState<string[]>([]);
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formDisplayName, setFormDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  const loadRoles = () => {
    fetch("/api/roles").then(r => r.json()).then(data => { if (Array.isArray(data)) setRoles(data); }).catch(() => {});
  };
  useEffect(() => { loadRoles(); }, []);

  const openCreate = () => { setEditRole(null); setFormName(""); setFormDesc(""); setFormPerms([]); setFormUsername(""); setFormPassword(""); setFormDisplayName(""); setShowModal(true); };
  const openEdit = (r: Role) => { setEditRole(r); setFormName(r.name); setFormDesc(r.description); setFormPerms(r.permissions); setFormUsername(""); setFormPassword(""); setFormDisplayName(""); setShowModal(true); };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    if (editRole) {
      await fetch(`/api/roles/${editRole.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: formName, description: formDesc, permissions: formPerms }) });
    } else {
      await fetch("/api/roles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: formName, description: formDesc, permissions: formPerms }) });
    }
    // Create user if username filled
    if (formUsername.trim() && formPassword.trim()) {
      await fetch("/api/roles/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: formUsername, password: formPassword, name: formDisplayName || formUsername, role: formName }) });
    }
    setSaving(false);
    setShowModal(false);
    loadRoles();
  };

  const handleDelete = async (r: Role) => {
    if (!confirm(`Hapus role "${r.name}"?`)) return;
    await fetch(`/api/roles/${r.id}`, { method: "DELETE" });
    loadRoles();
  };

  const togglePerm = (key: string) => {
    setFormPerms(prev => prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]);
  };

  const filtered = roles.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: 0 }}>Roles</h1>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "4px 0 0" }}>Kelola hak akses dan peran pengguna</p>
        </div>
        <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: 8, background: "#3b82f6", color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer" }}>
          <Plus style={{ width: 16, height: 16 }} /> Tambah Role
        </button>
      </div>

      <div style={{ position: "relative", maxWidth: 400, marginBottom: 16 }}>
        <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#9ca3af" }} />
        <input type="text" placeholder="Cari role..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", paddingLeft: 40, paddingRight: 16, paddingTop: 8, paddingBottom: 8, border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", background: "#fff" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {filtered.map((role) => (
          <div key={role.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 20 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Shield style={{ width: 20, height: 20, color: "#3b82f6" }} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{role.name}</div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>{role.user_count} pengguna</div>
                </div>
              </div>
              {!role.is_system && (
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => openEdit(role)} style={{ padding: 6, background: "none", border: "none", cursor: "pointer" }}>
                    <Edit style={{ width: 16, height: 16, color: "#9ca3af" }} />
                  </button>
                  <button onClick={() => handleDelete(role)} style={{ padding: 6, background: "none", border: "none", cursor: "pointer" }}>
                    <Trash2 style={{ width: 16, height: 16, color: "#ef4444" }} />
                  </button>
                </div>
              )}
            </div>
            <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 10px" }}>{role.description}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {role.permissions.includes("all") ? (
                <span style={{ padding: "2px 8px", background: "#dcfce7", color: "#16a34a", fontSize: 11, borderRadius: 4, fontWeight: 500 }}>Semua akses</span>
              ) : role.permissions.map((p) => (
                <span key={p} style={{ padding: "2px 8px", background: "#f3f4f6", color: "#6b7280", fontSize: 11, borderRadius: 4, fontWeight: 500 }}>
                  {ALL_PERMISSIONS.find(a => a.key === p)?.label || p}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", borderRadius: 12, width: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>{editRole ? "Edit Role" : "Tambah Role Baru"}</h2>
              <button onClick={() => setShowModal(false)} style={{ padding: 4, background: "none", border: "none", cursor: "pointer" }}>
                <X style={{ width: 18, height: 18, color: "#9ca3af" }} />
              </button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Nama Role</label>
              <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Contoh: CS, Manager"
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Deskripsi</label>
              <input type="text" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Deskripsi singkat role ini"
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Hak Akses Menu</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {ALL_PERMISSIONS.map((p) => (
                  <label key={p.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, cursor: "pointer", background: formPerms.includes(p.key) ? "#eff6ff" : "#f9fafb", border: formPerms.includes(p.key) ? "1px solid #93c5fd" : "1px solid #e5e7eb" }}>
                    <input type="checkbox" checked={formPerms.includes(p.key)} onChange={() => togglePerm(p.key)}
                      style={{ accentColor: "#3b82f6", width: 16, height: 16 }} />
                    <span style={{ fontSize: 13, color: "#374151" }}>{p.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* User Account */}
            <div style={{ marginBottom: 20, padding: 14, background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Buat Akun Login (opsional)</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>Nama Lengkap</div>
                  <input type="text" value={formDisplayName} onChange={(e) => setFormDisplayName(e.target.value)} placeholder="Nama user"
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>Username</div>
                  <input type="text" value={formUsername} onChange={(e) => setFormUsername(e.target.value)} placeholder="username"
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>Password</div>
                  <input type="text" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="password"
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "8px 20px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", fontSize: 14, color: "#6b7280", cursor: "pointer" }}>Batal</button>
              <button onClick={handleSave} disabled={saving || !formName.trim()} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#3b82f6", color: "#fff", fontSize: 14, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
