"use client";

import { useState } from "react";
import {
  QrCode,
  Smartphone,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

type ConnectionStatus = "disconnected" | "scanning" | "connected";

export default function ConnectPage() {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [selectedCS, setSelectedCS] = useState("");

  const csOptions = [
    { id: "1", name: "Faiz", phone: "081392493171" },
    { id: "2", name: "Devina", phone: "085783467223" },
    { id: "3", name: "Pimel", phone: "08573829395" },
    { id: "4", name: "Anis", phone: "082436364713" },
    { id: "5", name: "Reza", phone: "628231533622" },
  ];

  const handleConnect = () => {
    if (!selectedCS) return;
    setStatus("scanning");
    setTimeout(() => setStatus("connected"), 5000);
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, background: "#dbeafe", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <QrCode style={{ width: 28, height: 28, color: "#3b82f6" }} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>Connect WhatsApp</h1>
          <p style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>Hubungkan akun WhatsApp Sales/CS untuk monitoring</p>
        </div>

        {/* Status Badge */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 999, fontSize: 14, fontWeight: 500,
            background: status === "connected" ? "#dcfce7" : status === "scanning" ? "#fef9c3" : "#f3f4f6",
            color: status === "connected" ? "#16a34a" : status === "scanning" ? "#ca8a04" : "#9ca3af",
          }}>
            {status === "connected" ? <><Wifi style={{ width: 16, height: 16 }} /> Connected</> :
              status === "scanning" ? <><Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> Waiting for scan...</> :
                <><WifiOff style={{ width: 16, height: 16 }} /> Disconnected</>}
          </div>
        </div>

        {/* Select CS */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 20, marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#111827", marginBottom: 8 }}>Pilih Sales/CS</label>
          <select
            value={selectedCS}
            onChange={(e) => setSelectedCS(e.target.value)}
            style={{ width: "100%", padding: "8px 16px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, background: "#fff", outline: "none" }}
          >
            <option value="">-- Pilih Sales/CS --</option>
            {csOptions.map((cs) => (
              <option key={cs.id} value={cs.id}>{cs.name} ({cs.phone})</option>
            ))}
          </select>
        </div>

        {/* QR Area */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 32 }}>
          {status === "connected" ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <CheckCircle2 style={{ width: 64, height: 64, color: "#10b981", margin: "0 auto 12px" }} />
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 4 }}>WhatsApp Terhubung!</h2>
              <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 16 }}>
                Akun <strong>{csOptions.find((c) => c.id === selectedCS)?.name}</strong> berhasil terhubung.
              </p>
              <button onClick={() => setStatus("disconnected")} style={{ padding: "8px 16px", border: "1px solid #ef4444", color: "#ef4444", borderRadius: 8, fontSize: 14, fontWeight: 500, background: "none", cursor: "pointer" }}>
                Disconnect
              </button>
            </div>
          ) : status === "scanning" ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 224, height: 224, border: "2px solid #e5e7eb", borderRadius: 12, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(11, 1fr)", gap: 2, padding: 12 }}>
                  {Array.from({ length: 121 }).map((_, i) => {
                    const row = Math.floor(i / 11);
                    const col = i % 11;
                    const isCorner = (row < 3 && col < 3) || (row < 3 && col > 7) || (row > 7 && col < 3);
                    const isFilled = isCorner || Math.random() > 0.5;
                    return <div key={i} style={{ width: 14, height: 14, borderRadius: 2, background: isFilled ? "#111827" : "transparent" }} />;
                  })}
                </div>
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Scan QR Code</h2>
              <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 12 }}>Buka WhatsApp &rarr; Linked Devices &rarr; Link a Device</p>
              <button onClick={() => setStatus("scanning")} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, color: "#6b7280", background: "none", cursor: "pointer" }}>
                <RefreshCw style={{ width: 14, height: 14 }} /> Refresh QR
              </button>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <Smartphone style={{ width: 56, height: 56, color: "#9ca3af", margin: "0 auto 12px" }} />
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Mulai Hubungkan WhatsApp</h2>
              <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 16 }}>Pilih Sales/CS lalu generate QR code.</p>
              <button
                onClick={handleConnect}
                disabled={!selectedCS}
                style={{
                  padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 500, border: "none", cursor: selectedCS ? "pointer" : "not-allowed",
                  background: selectedCS ? "#3b82f6" : "#e5e7eb", color: selectedCS ? "#fff" : "#9ca3af",
                }}
              >
                Generate QR Code
              </button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 20, marginTop: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 8 }}>Cara menghubungkan:</h3>
          {["Pilih Sales/CS yang akan dihubungkan", "Klik \"Generate QR Code\"", "Buka WhatsApp di HP Sales/CS", "Tap menu → Linked Devices → Link a Device", "Arahkan kamera ke QR code", "Tunggu hingga status Connected"].map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
              <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#dbeafe", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{i + 1}</span>
              <span style={{ fontSize: 14, color: "#6b7280" }}>{step}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: 12, marginTop: 12 }}>
          <AlertCircle style={{ width: 16, height: 16, color: "#f59e0b", flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 12, color: "#6b7280" }}>Pastikan HP tetap terhubung ke internet. Jika offline lebih dari 14 hari, sesi akan terputus.</p>
        </div>
      </div>
    </div>
  );
}
