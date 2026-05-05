"use client";

import { useEffect, useState, useRef } from "react";
import { Pencil, Check, X } from "lucide-react";

type WAStatus = "waiting" | "connected" | "disconnected";

interface Account {
  id: number;
  slug: string;
  name: string;
  status: WAStatus;
  qr: string | null;
  phone: string | null;
}

export default function ConnectPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set());
  const [editing, setEditing] = useState<{ id: number; value: string } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setBusy = (id: number, busy: boolean) => {
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const poll = async () => {
    try {
      const res = await fetch("/api/whatsapp", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    (async () => {
      await poll();
      setLoading(false);
      intervalRef.current = setInterval(poll, 3000);
    })();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const handleConnect = async (id: number) => {
    setBusy(id, true);
    try {
      await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await poll();
    } finally {
      setBusy(id, false);
    }
  };

  const handleLogout = async (id: number) => {
    setBusy(id, true);
    try {
      await fetch("/api/whatsapp/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await poll();
    } finally {
      setBusy(id, false);
    }
  };

  const startEdit = (acc: Account) => setEditing({ id: acc.id, value: acc.name });
  const cancelEdit = () => setEditing(null);
  const saveEdit = async () => {
    if (!editing) return;
    const newName = editing.value.trim();
    if (!newName) return cancelEdit();
    await fetch("/api/whatsapp/accounts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editing.id, name: newName }),
    });
    setEditing(null);
    await poll();
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
            Connect WhatsApp
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
            Hubungkan hingga 3 akun WhatsApp. Scan QR di setiap card untuk mengaktifkan.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{
              width: 48, height: 48, border: "4px solid #e5e7eb", borderTop: "4px solid #3b82f6",
              borderRadius: "50%", margin: "0 auto 16px", animation: "wa-spin 0.8s linear infinite",
            }} />
            <p style={{ fontSize: 14, color: "#6b7280" }}>Memuat status akun...</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {accounts.map((acc) => (
              <AccountCard
                key={acc.id}
                acc={acc}
                busy={busyIds.has(acc.id)}
                editing={editing?.id === acc.id ? editing : null}
                onConnect={() => handleConnect(acc.id)}
                onLogout={() => handleLogout(acc.id)}
                onEditStart={() => startEdit(acc)}
                onEditChange={(v) => setEditing({ id: acc.id, value: v })}
                onEditCancel={cancelEdit}
                onEditSave={saveEdit}
              />
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes wa-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

interface CardProps {
  acc: Account;
  busy: boolean;
  editing: { id: number; value: string } | null;
  onConnect: () => void;
  onLogout: () => void;
  onEditStart: () => void;
  onEditChange: (value: string) => void;
  onEditCancel: () => void;
  onEditSave: () => void;
}

function AccountCard({ acc, busy, editing, onConnect, onLogout, onEditStart, onEditChange, onEditCancel, onEditSave }: CardProps) {
  const isConnected = acc.status === "connected";
  const isWaiting = acc.status === "waiting";

  const pillBg = isConnected ? "#dcfce7" : isWaiting ? "#fef9c3" : "#f3f4f6";
  const pillColor = isConnected ? "#16a34a" : isWaiting ? "#ca8a04" : "#9ca3af";
  const dotColor = isConnected ? "#16a34a" : isWaiting ? "#ca8a04" : "#9ca3af";
  const pillText = isConnected ? "Connected" : isWaiting ? "Waiting scan..." : "Disconnected";

  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        {editing ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
            <input
              autoFocus
              value={editing.value}
              onChange={(e) => onEditChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onEditSave();
                if (e.key === "Escape") onEditCancel();
              }}
              style={{
                flex: 1, padding: "6px 10px", fontSize: 15, fontWeight: 600,
                border: "1px solid #3b82f6", borderRadius: 6, outline: "none", color: "#111827",
              }}
            />
            <button onClick={onEditSave} style={btnIconStyle("#dcfce7", "#16a34a")}>
              <Check style={{ width: 14, height: 14 }} />
            </button>
            <button onClick={onEditCancel} style={btnIconStyle("#fee2e2", "#dc2626")}>
              <X style={{ width: 14, height: 14 }} />
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {acc.name}
              </h3>
              <button
                onClick={onEditStart}
                style={{ padding: 4, background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex" }}
                title="Rename"
              >
                <Pencil style={{ width: 12, height: 12 }} />
              </button>
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 999,
              fontSize: 11, fontWeight: 600, background: pillBg, color: pillColor, flexShrink: 0,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor }} />
              {pillText}
            </div>
          </>
        )}
      </div>

      <div style={{ padding: 20, minHeight: 320, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {isConnected ? (
          <ConnectedView phone={acc.phone} onLogout={onLogout} busy={busy} />
        ) : isWaiting && acc.qr ? (
          <QRView qr={acc.qr} />
        ) : isWaiting ? (
          <LoadingView label="Generating QR..." />
        ) : busy ? (
          <LoadingView label="Connecting..." />
        ) : (
          <DisconnectedView onConnect={onConnect} />
        )}
      </div>
    </div>
  );
}

function ConnectedView({ phone, onLogout, busy }: { phone: string | null; onLogout: () => void; busy: boolean }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <p style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: "0 0 4px" }}>Terhubung</p>
      <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 20px", fontFamily: "monospace" }}>
        {phone ? `+${phone}` : "—"}
      </p>
      <button
        onClick={onLogout}
        disabled={busy}
        style={{
          padding: "8px 18px", border: "1px solid #ef4444", borderRadius: 8, background: "#fff",
          color: "#ef4444", fontSize: 13, fontWeight: 600, cursor: busy ? "not-allowed" : "pointer",
          opacity: busy ? 0.6 : 1,
        }}
      >
        {busy ? "Logging out..." : "Logout"}
      </button>
    </div>
  );
}

function QRView({ qr }: { qr: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <img src={qr} alt="QR Code" style={{ width: 220, height: 220, margin: "0 auto 12px", display: "block", borderRadius: 8 }} />
      <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: "0 0 4px" }}>Scan QR</p>
      <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>WhatsApp &rarr; Linked Devices</p>
    </div>
  );
}

function LoadingView({ label }: { label: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        width: 40, height: 40, border: "4px solid #e5e7eb", borderTop: "4px solid #3b82f6",
        borderRadius: "50%", margin: "0 auto 12px", animation: "wa-spin 0.8s linear infinite",
      }} />
      <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>{label}</p>
    </div>
  );
}

function DisconnectedView({ onConnect }: { onConnect: () => void }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 9h.01" /><path d="M15 9h.01" /><path d="M9 15h.01" /><path d="M15 15h.01" />
        </svg>
      </div>
      <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 16px" }}>Belum terhubung</p>
      <button
        onClick={onConnect}
        style={{
          padding: "10px 24px", border: "none", borderRadius: 8, background: "#3b82f6",
          color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}
      >
        Connect
      </button>
    </div>
  );
}

function btnIconStyle(bg: string, color: string): React.CSSProperties {
  return {
    padding: 6, background: bg, border: "none", borderRadius: 6, cursor: "pointer",
    color, display: "flex", alignItems: "center", justifyContent: "center",
  };
}
