"use client";

import { useState } from "react";
import { Search, Plus, Shield, Eye, Edit, Trash2 } from "lucide-react";

const mockRoles = [
  { id: "1", name: "Super Admin", desc: "Akses penuh ke semua fitur dan pengaturan sistem", perms: ["Semua akses"], users: 1 },
  { id: "2", name: "Manager", desc: "Dapat melihat semua data sales/CS, analytics, dan audit", perms: ["View chats", "View analytics", "Manage sales/CS", "Audital Work"], users: 5 },
  { id: "3", name: "Sales/CS", desc: "Akses terbatas ke chat dan data sendiri", perms: ["View own chats", "View own analytics"], users: 12 },
  { id: "4", name: "Viewer", desc: "Hanya dapat melihat data tanpa bisa mengubah", perms: ["View chats", "View analytics"], users: 3 },
];

export default function RolesPage() {
  const [search, setSearch] = useState("");
  const filtered = mockRoles.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>Roles</h1>
          <p style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>Kelola hak akses dan peran pengguna</p>
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: 8, background: "#3b82f6", color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 500, border: "none", cursor: "pointer" }}>
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
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Shield style={{ width: 20, height: 20, color: "#3b82f6" }} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{role.name}</div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>{role.users} pengguna</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {[Eye, Edit, Trash2].map((Icon, i) => (
                  <button key={i} style={{ padding: 6, background: "none", border: "none", cursor: "pointer", borderRadius: 6 }}>
                    <Icon style={{ width: 16, height: 16, color: i === 2 ? "#ef4444" : "#9ca3af" }} />
                  </button>
                ))}
              </div>
            </div>
            <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 12 }}>{role.desc}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {role.perms.map((p) => (
                <span key={p} style={{ padding: "2px 8px", background: "#f3f4f6", color: "#6b7280", fontSize: 11, borderRadius: 4, fontWeight: 500 }}>{p}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
