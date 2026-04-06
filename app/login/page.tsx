"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, User } from "lucide-react";
import Particles from "@/app/components/Particles";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { setError("Username dan password wajib diisi"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) router.push("/dashboard/sales");
      else setError(data.error || "Login gagal");
    } catch { setError("Tidak dapat terhubung ke server"); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0e1117" }}>
      <Particles />
      {/* Card container */}
      <div style={{ display: "flex", width: 720, minHeight: 460, borderRadius: 20, overflow: "hidden", boxShadow: "0 25px 80px rgba(0,0,0,0.5)", position: "relative", zIndex: 1 }}>

        {/* Left — Dark panel */}
        <div style={{ width: 300, background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.02)", bottom: -40, left: -40 }} />

          {/* Robot icon — animated */}
          <svg width="70" height="70" viewBox="0 0 80 80" fill="none" style={{ marginBottom: 20 }}>
            {/* Body — float up/down */}
            <g style={{ animation: "robotFloat 3s ease-in-out infinite" }}>
              <rect x="12" y="22" width="56" height="36" rx="8" stroke="#fff" strokeWidth="2.5" fill="none" />
              {/* Left eye — blink */}
              <g style={{ animation: "robotBlink 4s ease-in-out infinite" }}>
                <circle cx="32" cy="40" r="5" stroke="#fff" strokeWidth="2" fill="none" />
                <line x1="29" y1="37" x2="35" y2="43" stroke="#fff" strokeWidth="2" />
                <line x1="35" y1="37" x2="29" y2="43" stroke="#fff" strokeWidth="2" />
              </g>
              {/* Right eye — glow */}
              <rect x="48" y="34" width="12" height="8" rx="2" stroke="#fff" strokeWidth="2" fill="none" />
              <circle cx="54" cy="38" r="2" fill="#fff" style={{ animation: "robotGlow 2s ease-in-out infinite" }} />
            </g>
            {/* Antenna — wiggle */}
            <g style={{ transformOrigin: "22px 22px", animation: "robotWiggle 2.5s ease-in-out infinite" }}>
              <line x1="22" y1="22" x2="18" y2="14" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              <path d="M16 10 Q18 7 20 10" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </g>
            {/* Arms — wave */}
            <line x1="8" y1="40" x2="12" y2="40" stroke="#fff" strokeWidth="2" strokeLinecap="round" style={{ transformOrigin: "12px 40px", animation: "robotArmL 2s ease-in-out infinite" }} />
            <line x1="68" y1="40" x2="72" y2="40" stroke="#fff" strokeWidth="2" strokeLinecap="round" style={{ transformOrigin: "68px 40px", animation: "robotArmR 2s ease-in-out 0.5s infinite" }} />
          </svg>
          <style>{`
            @keyframes robotFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
            @keyframes robotBlink { 0%,42%,50%,100% { transform: scaleY(1); } 45%,47% { transform: scaleY(0.1); } }
            @keyframes robotGlow { 0%,100% { opacity: 1; r: 2; } 50% { opacity: 0.4; } }
            @keyframes robotWiggle { 0%,100% { transform: rotate(0deg); } 25% { transform: rotate(8deg); } 75% { transform: rotate(-8deg); } }
            @keyframes robotArmL { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(-15deg); } }
            @keyframes robotArmR { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(15deg); } }
          `}</style>

          <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: 3 }}>AYRES</div>
          <div style={{ fontSize: 9, color: "#555", marginTop: 4, letterSpacing: 3, textTransform: "uppercase" }}>Auto Audit System</div>
        </div>

        {/* Right — Form */}
        <div style={{ flex: 1, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 40px" }}>
          <div style={{ width: "100%" }}>
            {/* Avatar */}
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <User style={{ width: 18, height: 18, color: "#9ca3af" }} />
            </div>

            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", textAlign: "center", margin: "0 0 2px" }}>Welcome back!</h1>
            <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", margin: "0 0 24px" }}>Enter your login details</p>

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 5 }}>Username</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, outline: "none", background: "#f9fafb", boxSizing: "border-box" }} />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 5 }}>Password</label>
                <div style={{ position: "relative" }}>
                  <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                    style={{ width: "100%", padding: "10px 36px 10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, outline: "none", background: "#f9fafb", boxSizing: "border-box" }} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}>
                    {showPass ? <EyeOff style={{ width: 16, height: 16, color: "#9ca3af" }} /> : <Eye style={{ width: 16, height: 16, color: "#9ca3af" }} />}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#374151", cursor: "pointer" }}>
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ accentColor: "#111827", width: 14, height: 14 }} />
                  Remember me
                </label>
                <span style={{ fontSize: 12, color: "#6b7280" }}>Forgot password?</span>
              </div>

              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px", marginBottom: 14, fontSize: 12, color: "#dc2626" }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                width: "100%", padding: "10px 0", borderRadius: 999, border: "none",
                background: loading ? "#555" : "#111827", color: "#fff",
                fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
              }}>
                {loading ? "Memproses..." : "Log in"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
