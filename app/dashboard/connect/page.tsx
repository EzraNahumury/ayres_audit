"use client";

import { useEffect, useState, useCallback } from "react";

type WAStatus = "waiting" | "connected" | "disconnected";

interface WAResponse {
  qr: string | null;
  status: WAStatus;
}

export default function ConnectPage() {
  const [qr, setQr] = useState<string | null>(null);
  const [status, setStatus] = useState<WAStatus>("disconnected");
  const [initializing, setInitializing] = useState(true);

  // -------------------------------------------------------------------
  // Poll the API for the latest QR / status
  // -------------------------------------------------------------------
  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp");
      if (!res.ok) return;
      const data: WAResponse = await res.json();
      setQr(data.qr);
      setStatus(data.status);
    } catch {
      // network error – ignore, will retry on next poll
    }
  }, []);

  // -------------------------------------------------------------------
  // On mount: kick off the connection (POST), then start polling
  // -------------------------------------------------------------------
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    let cancelled = false;

    async function init() {
      try {
        // Tell the backend to start a Baileys connection
        const res = await fetch("/api/whatsapp", { method: "POST" });
        if (!cancelled && res.ok) {
          const data: WAResponse = await res.json();
          setQr(data.qr);
          setStatus(data.status);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setInitializing(false);
      }

      // Start polling every 5 seconds
      if (!cancelled) {
        interval = setInterval(poll, 5000);
      }
    }

    init();

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [poll]);

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------
  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        {/* Header */}
        <div
          style={{
            width: 56,
            height: 56,
            background: "#dbeafe",
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          {/* WhatsApp-style icon via inline SVG */}
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M7 7h.01" />
            <path d="M17 7h.01" />
            <path d="M7 17h.01" />
            <path d="M11 7h2v2h-2z" />
            <path d="M7 11h2v2H7z" />
            <path d="M11 11h2v2h-2z" />
            <path d="M15 11h2v2h-2z" />
            <path d="M11 15h2v2h-2z" />
          </svg>
        </div>

        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#111827",
            margin: "0 0 4px",
          }}
        >
          Connect WhatsApp
        </h1>
        <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 28px" }}>
          Scan QR code di bawah ini dengan WhatsApp untuk menghubungkan.
        </p>

        {/* QR area */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 16,
            border: "1px solid #e5e7eb",
            padding: 32,
            marginBottom: 20,
          }}
        >
          {/* ---- Connected ---- */}
          {status === "connected" && (
            <div>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "#dcfce7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#16a34a"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#111827",
                  margin: "0 0 4px",
                }}
              >
                WhatsApp Terhubung!
              </h2>
              <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
                Sesi aktif. Pesan akan dimonitor secara otomatis.
              </p>
            </div>
          )}

          {/* ---- Waiting for scan / QR available ---- */}
          {status === "waiting" && qr && (
            <div>
              <img
                src={qr}
                alt="WhatsApp QR Code"
                style={{
                  width: 264,
                  height: 264,
                  margin: "0 auto 20px",
                  display: "block",
                  borderRadius: 8,
                }}
              />
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#111827",
                  margin: "0 0 4px",
                }}
              >
                Scan QR code dengan WhatsApp
              </p>
              <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
                Buka WhatsApp &rarr; Linked Devices &rarr; Link a Device
              </p>
            </div>
          )}

          {/* ---- Loading: waiting for QR to appear or initializing ---- */}
          {(initializing ||
            (status === "waiting" && !qr) ||
            status === "disconnected") &&
            status !== "connected" && (
              <div>
                {/* Spinner */}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    border: "4px solid #e5e7eb",
                    borderTop: "4px solid #3b82f6",
                    borderRadius: "50%",
                    margin: "0 auto 20px",
                    animation: "wa-spin 0.8s linear infinite",
                  }}
                />
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#111827",
                    margin: "0 0 4px",
                  }}
                >
                  {initializing
                    ? "Memulai koneksi..."
                    : status === "disconnected"
                      ? "Menghubungkan ulang..."
                      : "Menunggu QR code..."}
                </p>
                <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
                  Mohon tunggu sebentar
                </p>
              </div>
            )}
        </div>

        {/* Status pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 18px",
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 500,
            background:
              status === "connected"
                ? "#dcfce7"
                : status === "waiting"
                  ? "#fef9c3"
                  : "#f3f4f6",
            color:
              status === "connected"
                ? "#16a34a"
                : status === "waiting"
                  ? "#ca8a04"
                  : "#9ca3af",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background:
                status === "connected"
                  ? "#16a34a"
                  : status === "waiting"
                    ? "#ca8a04"
                    : "#9ca3af",
            }}
          />
          {status === "connected"
            ? "Connected"
            : status === "waiting"
              ? "Waiting for scan..."
              : "Disconnected"}
        </div>

        {/* Instructions */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            padding: 20,
            marginTop: 24,
            textAlign: "left",
          }}
        >
          <h3
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#111827",
              margin: "0 0 12px",
            }}
          >
            Cara menghubungkan:
          </h3>
          {[
            "Buka WhatsApp di HP",
            "Tap menu  \u2192  Linked Devices  \u2192  Link a Device",
            "Arahkan kamera ke QR code di atas",
            "Tunggu hingga status \"Connected\"",
          ].map((step, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                marginBottom: i < 3 ? 8 : 0,
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "#dbeafe",
                  color: "#3b82f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
              <span style={{ fontSize: 14, color: "#6b7280" }}>{step}</span>
            </div>
          ))}
        </div>

        <p
          style={{
            fontSize: 12,
            color: "#9ca3af",
            marginTop: 16,
          }}
        >
          QR code akan di-refresh otomatis setiap 5 detik. Pastikan HP tetap
          terhubung ke internet.
        </p>
      </div>

      {/* Keyframe animation for the spinner */}
      <style>{`
        @keyframes wa-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
