"use client";

import { useState } from "react";
import { Settings, Save, RotateCcw, Cpu, Database, Zap } from "lucide-react";

export default function AISettingsPage() {
  const [model, setModel] = useState("llama3");
  const [temp, setTemp] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [batchSize, setBatchSize] = useState(10);
  const [autoAnalysis, setAutoAnalysis] = useState(true);
  const [period, setPeriod] = useState("30");

  const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 16px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", background: "#fff" };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: 14, fontWeight: 500, color: "#111827", marginBottom: 6 };
  const helpStyle: React.CSSProperties = { fontSize: 12, color: "#9ca3af", marginTop: 4 };

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Settings style={{ width: 24, height: 24, color: "#111827" }} />
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>AI Settings</h1>
            <p style={{ fontSize: 14, color: "#6b7280" }}>Konfigurasi model AI dan parameter analisa</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, fontWeight: 500, color: "#6b7280", background: "#fff", cursor: "pointer" }}>
            <RotateCcw style={{ width: 16, height: 16 }} /> Reset
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "#3b82f6", color: "#fff", borderRadius: 8, fontSize: 14, fontWeight: 500, border: "none", cursor: "pointer" }}>
            <Save style={{ width: 16, height: 16 }} /> Simpan
          </button>
        </div>
      </div>

      {/* Model Config */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Cpu style={{ width: 20, height: 20, color: "#3b82f6" }} />
          <span style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>Model Configuration</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>AI Model</label>
            <select value={model} onChange={(e) => setModel(e.target.value)} style={inputStyle}>
              <option value="llama3">Llama 3</option><option value="mistral">Mistral</option><option value="gemma">Gemma 2</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Ollama URL</label>
            <input type="text" value={ollamaUrl} onChange={(e) => setOllamaUrl(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Temperature: {temp}</label>
            <input type="range" min="0" max="1" step="0.1" value={temp} onChange={(e) => setTemp(Number(e.target.value))} style={{ width: "100%", accentColor: "#3b82f6" }} />
            <div style={{ display: "flex", justifyContent: "space-between", ...helpStyle }}><span>Presisi</span><span>Kreatif</span></div>
          </div>
          <div>
            <label style={labelStyle}>Max Tokens</label>
            <input type="number" value={maxTokens} onChange={(e) => setMaxTokens(Number(e.target.value))} style={inputStyle} />
          </div>
        </div>
      </div>

      {/* Analysis Config */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Zap style={{ width: 20, height: 20, color: "#f59e0b" }} />
          <span style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>Analysis Configuration</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>Batch Size</label>
            <input type="number" value={batchSize} onChange={(e) => setBatchSize(Number(e.target.value))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Periode Analisa</label>
            <select value={period} onChange={(e) => setPeriod(e.target.value)} style={inputStyle}>
              <option value="7">7 hari terakhir</option><option value="14">14 hari terakhir</option><option value="30">30 hari terakhir</option><option value="90">90 hari terakhir</option>
            </select>
          </div>
          <div style={{ gridColumn: "span 2", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>Auto Analysis</div>
              <div style={helpStyle}>Analisa otomatis setiap ada chat baru masuk</div>
            </div>
            <button onClick={() => setAutoAnalysis(!autoAnalysis)} style={{ width: 44, height: 24, borderRadius: 999, border: "none", cursor: "pointer", background: autoAnalysis ? "#3b82f6" : "#d1d5db", position: "relative" }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: autoAnalysis ? 22 : 2, transition: "left 0.2s", boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }} />
            </button>
          </div>
        </div>
      </div>

      {/* DB Config */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Database style={{ width: 20, height: 20, color: "#10b981" }} />
          <span style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>Database Configuration (MySQL)</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div><label style={labelStyle}>Host</label><input type="text" defaultValue="localhost" style={inputStyle} /></div>
          <div><label style={labelStyle}>Port</label><input type="text" defaultValue="3306" style={inputStyle} /></div>
          <div><label style={labelStyle}>Database</label><input type="text" defaultValue="ayres_audit" style={inputStyle} /></div>
          <div><label style={labelStyle}>Username</label><input type="text" defaultValue="root" style={inputStyle} /></div>
        </div>
      </div>
    </div>
  );
}
