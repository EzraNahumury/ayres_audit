"use client";

import { useEffect, useState, useRef } from "react";

type WAStatus = "waiting" | "connected" | "disconnected";

interface WAResponse { qr: string | null; status: WAStatus; }

export default function ConnectPage() {
  const [qr, setQr] = useState<string | null>(null);
  const [status, setStatus] = useState<WAStatus>("disconnected");
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll API
  const poll = async () => {
    try {
      const res = await fetch("/api/whatsapp");
      if (res.ok) {
        const data: WAResponse = await res.json();
        setQr(data.qr);
        setStatus(data.status);
      }
    } catch { /* ignore */ }
  };

  // Start polling
  const startPolling = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(poll, 3000);
  };

  // On mount — always check status & start connection
  useEffect(() => {
    (async () => {
      // First check current status
      await poll();
      setLoading(false);
      // Try to connect (will return immediately if already connected)
      try { await fetch("/api/whatsapp", { method: "POST" }); } catch { /* ignore */ }
      await poll();
      // Always poll — even if connected (to detect disconnects)
      startPolling();
    })();

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Logout
  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
    try { await fetch("/api/whatsapp/logout", { method: "POST" }); } catch { /* ignore */ }
    setStatus("disconnected");
    setQr(null);
    setLoggingOut(false);
    // Reconnect — generate new QR
    setLoading(true);
    try { await fetch("/api/whatsapp", { method: "POST" }); } catch { /* ignore */ }
    await poll();
    setLoading(false);
    startPolling();
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
        <div style={{ width: 56, height: 56, background: "#dbeafe", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M7 7h.01" /><path d="M17 7h.01" /><path d="M7 17h.01" />
            <path d="M11 7h2v2h-2z" /><path d="M7 11h2v2H7z" /><path d="M11 11h2v2h-2z" />
            <path d="M15 11h2v2h-2z" /><path d="M11 15h2v2h-2z" />
          </svg>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>Connect WhatsApp</h1>
        <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 28px" }}>
          {status === "connected" ? "WhatsApp sudah terhubung dan aktif monitoring." : "Scan QR code untuk menghubungkan WhatsApp."}
        </p>

        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: 32, marginBottom: 20 }}>
          {/* Connected */}
          {status === "connected" && !loggingOut && (
            <div>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>WhatsApp Terhubung!</h2>
              <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 24px" }}>Sesi aktif. Pesan akan dimonitor secara otomatis.</p>
              <button onClick={handleLogout} style={{ padding: "10px 24px", border: "1px solid #ef4444", borderRadius: 8, background: "#fff", color: "#ef4444", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Logout WhatsApp
              </button>
            </div>
          )}

          {/* QR code */}
          {status !== "connected" && !loading && qr && (
            <div>
              <img src={qr} alt="QR Code" style={{ width: 264, height: 264, margin: "0 auto 20px", display: "block", borderRadius: 8 }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: "0 0 4px" }}>Scan QR code dengan WhatsApp</p>
              <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Buka WhatsApp &rarr; Linked Devices &rarr; Link a Device</p>
            </div>
          )}

          {/* Loading */}
          {(loading || loggingOut || (status !== "connected" && !qr)) && status !== "connected" && (
            <div>
              <div style={{ width: 48, height: 48, border: "4px solid #e5e7eb", borderTop: "4px solid #3b82f6", borderRadius: "50%", margin: "0 auto 20px", animation: "wa-spin 0.8s linear infinite" }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: "0 0 4px" }}>
                {loggingOut ? "Logging out..." : "Memulai koneksi..."}
              </p>
              <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Mohon tunggu sebentar</p>
            </div>
          )}
        </div>

        {/* Status pill */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 18px", borderRadius: 999, fontSize: 13, fontWeight: 500,
          background: status === "connected" ? "#dcfce7" : status === "waiting" ? "#fef9c3" : "#f3f4f6",
          color: status === "connected" ? "#16a34a" : status === "waiting" ? "#ca8a04" : "#9ca3af",
        }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: status === "connected" ? "#16a34a" : status === "waiting" ? "#ca8a04" : "#9ca3af" }} />
          {status === "connected" ? "Connected" : status === "waiting" ? "Waiting for scan..." : "Disconnected"}
        </div>

        {/* Instructions */}
        {status !== "connected" && qr && !loading && (
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 20, marginTop: 24, textAlign: "left" }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 12px" }}>Cara menghubungkan:</h3>
            {["Buka WhatsApp di HP", "Tap menu → Linked Devices → Link a Device", "Arahkan kamera ke QR code di atas", "Tunggu hingga status \"Connected\""].map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: i < 3 ? 8 : 0 }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#dbeafe", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontSize: 14, color: "#6b7280" }}>{step}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes wa-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
