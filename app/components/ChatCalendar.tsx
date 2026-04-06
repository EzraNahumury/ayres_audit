"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DayStat { date: string; contacts: number; messages: number; }

interface Props {
  onSelectRange: (from: string, to: string) => void;
}

export default function ChatCalendar({ onSelectRange }: Props) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth()); // 0-indexed
  const [stats, setStats] = useState<Record<string, DayStat>>({});
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);

  // Load stats for current month
  useEffect(() => {
    const m = `${year}-${String(month + 1).padStart(2, "0")}`;
    fetch(`/api/messages/stats?month=${m}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const map: Record<string, DayStat> = {};
          data.forEach((d: DayStat) => { map[d.date.split("T")[0]] = d; });
          setStats(map);
        }
      })
      .catch(() => {});
  }, [year, month]);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const getDateStr = (day: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const handleDayClick = (day: number) => {
    const ds = getDateStr(day);
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(ds);
      setRangeEnd(null);
    } else {
      if (ds < rangeStart) {
        setRangeEnd(rangeStart);
        setRangeStart(ds);
        onSelectRange(ds, rangeStart);
      } else {
        setRangeEnd(ds);
        onSelectRange(rangeStart, ds);
      }
    }
  };

  const isInRange = (day: number) => {
    if (!rangeStart) return false;
    const ds = getDateStr(day);
    if (!rangeEnd) return ds === rangeStart;
    return ds >= rangeStart && ds <= rangeEnd;
  };

  const isStart = (day: number) => getDateStr(day) === rangeStart;
  const isEnd = (day: number) => getDateStr(day) === rangeEnd;

  // Build calendar grid
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 16, width: 320 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button onClick={prevMonth} style={{ padding: 4, background: "none", border: "none", cursor: "pointer", borderRadius: 6 }}>
          <ChevronLeft style={{ width: 18, height: 18, color: "#6b7280" }} />
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
          {monthNames[month]} {year}
        </span>
        <button onClick={nextMonth} style={{ padding: 4, background: "none", border: "none", cursor: "pointer", borderRadius: 6 }}>
          <ChevronRight style={{ width: 18, height: 18, color: "#6b7280" }} />
        </button>
      </div>

      {/* Day names */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
        {dayNames.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "#9ca3af", padding: "4px 0" }}>{d}</div>
        ))}
      </div>

      {/* Days */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />;
          const ds = getDateStr(day);
          const stat = stats[ds];
          const inRange = isInRange(day);
          const start = isStart(day);
          const end = isEnd(day);
          const isToday = ds === todayStr;

          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              style={{
                padding: "4px 2px",
                border: "none",
                borderRadius: start || end ? 8 : inRange ? 0 : 8,
                cursor: "pointer",
                background: start || end ? "#3b82f6" : inRange ? "#dbeafe" : isToday ? "#f0f9ff" : "transparent",
                textAlign: "center",
                minHeight: 44,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: isToday || start || end ? 700 : 400, color: start || end ? "#fff" : isToday ? "#3b82f6" : "#374151" }}>
                {day}
              </span>
              {stat && (
                <span style={{
                  fontSize: 9, fontWeight: 700,
                  color: start || end ? "#bfdbfe" : stat.contacts > 5 ? "#dc2626" : stat.contacts > 2 ? "#f59e0b" : "#3b82f6",
                }}>
                  {stat.contacts}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: "1px solid #f3f4f6" }}>
        <div style={{ fontSize: 11, color: "#9ca3af" }}>
          {rangeStart && rangeEnd ? `${rangeStart} → ${rangeEnd}` : rangeStart ? "Pilih tanggal akhir..." : "Pilih Range Tanggal"}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <span style={{ fontSize: 9, color: "#3b82f6" }}>&#9679; 1-2</span>
          <span style={{ fontSize: 9, color: "#f59e0b" }}>&#9679; 3-5</span>
          <span style={{ fontSize: 9, color: "#dc2626" }}>&#9679; 6+</span>
        </div>
      </div>
    </div>
  );
}
