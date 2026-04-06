"use client";

import { useState } from "react";
import { Search, Plus, ArrowUpDown, ChevronLeft, ChevronRight, Building2, Shield } from "lucide-react";

const mockManagers = [
  { id: "1", name: "Faiz", phone: "81392493171", email: "faiz@ayres.id", division: "Marketing", createdAt: "01 Apr 2026, 15:43" },
  { id: "2", name: "Dea Ayup", phone: "85783467223", email: "dea@ayres.id", division: "Produk", createdAt: "27 Mar 2026, 15:45" },
  { id: "3", name: "Pimel", phone: "08573829395", email: "pimel@ayres.id", division: "Marketing", createdAt: "25 Mar 2026, 09:44" },
  { id: "4", name: "Fahri Pratama", phone: "082436364713", email: "fahri@ayres.id", division: "Marketing", createdAt: "19 Feb 2026, 13:24" },
  { id: "5", name: "Aditya", phone: "628231533622", email: "aditya@ayres.id", division: "Produk", createdAt: "19 Feb 2026, 13:20" },
];

export default function DivisiPage() {
  const [search, setSearch] = useState("");
  const [filterDiv, setFilterDiv] = useState("All Division");

  const filtered = mockManagers.filter((m) => {
    const matchS = m.name.toLowerCase().includes(search.toLowerCase()) || m.phone.includes(search);
    const matchD = filterDiv === "All Division" || m.division === filterDiv;
    return matchS && matchD;
  });

  const divColor = (d: string) => d === "Marketing" ? { bg: "#dbeafe", color: "#2563eb" } : { bg: "#dcfce7", color: "#16a34a" };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 24 }}>Profil Perusahaan</h1>

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 16, marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, background: "#f3f4f6", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Building2 style={{ width: 24, height: 24, color: "#9ca3af" }} />
          </div>
          <div>
            <div style={{ fontSize: 14, color: "#6b7280" }}>Tim kami dapat melihat data Anda untuk membantu,</div>
            <div style={{ fontSize: 14, color: "#6b7280" }}>dan Anda bisa mencabut akses kapan saja.</div>
          </div>
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: 8, background: "#14b8a6", color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 500, border: "none", cursor: "pointer" }}>
          <Shield style={{ width: 16, height: 16 }} /> Cabut Akses Developer
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>Manager Access</h2>
        <button style={{ display: "flex", alignItems: "center", gap: 8, background: "#3b82f6", color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 500, border: "none", cursor: "pointer" }}>
          <Plus style={{ width: 16, height: 16 }} /> Tambah Atasan
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#9ca3af" }} />
          <input type="text" placeholder="Cari Manager..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", paddingLeft: 40, paddingRight: 16, paddingTop: 8, paddingBottom: 8, border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", background: "#fff" }} />
        </div>
        <select value={filterDiv} onChange={(e) => setFilterDiv(e.target.value)}
          style={{ padding: "8px 16px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, color: "#6b7280", background: "#fff", outline: "none", cursor: "pointer" }}>
          <option>All Division</option><option>Marketing</option><option>Produk</option>
        </select>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
              {["No", "Manager Profile", "Telepon", "Email", "Division", "Created At", "Aksi"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, i) => (
              <tr key={m.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "12px 16px", fontSize: 14, color: "#6b7280" }}>{i + 1}</td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#dbeafe", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600 }}>{m.name[0]}</div>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>{m.name}</span>
                  </div>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 14, color: "#6b7280" }}>{m.phone}</td>
                <td style={{ padding: "12px 16px", fontSize: 14, color: "#6b7280" }}>{m.email}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 500, background: divColor(m.division).bg, color: divColor(m.division).color }}>{m.division}</span>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 14, color: "#6b7280" }}>{m.createdAt}</td>
                <td style={{ padding: "12px 16px" }}>
                  <select style={{ padding: "4px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, color: "#6b7280", background: "#fff", cursor: "pointer" }}>
                    <option>Aksi</option><option>Edit</option><option>Hapus</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: "1px solid #e5e7eb" }}>
          <span style={{ fontSize: 14, color: "#6b7280" }}>{filtered.length} Manager</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button style={{ padding: 4, border: "1px solid #e5e7eb", borderRadius: 4, background: "none", cursor: "pointer" }}><ChevronLeft style={{ width: 16, height: 16, color: "#9ca3af" }} /></button>
            <span style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, background: "#3b82f6", color: "#fff", fontSize: 14, fontWeight: 500 }}>1</span>
            <button style={{ padding: 4, border: "1px solid #e5e7eb", borderRadius: 4, background: "none", cursor: "pointer" }}><ChevronRight style={{ width: 16, height: 16, color: "#9ca3af" }} /></button>
            <span style={{ fontSize: 14, color: "#6b7280", marginLeft: 8 }}>Halaman 1 dari 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
