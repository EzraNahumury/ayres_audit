"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Users,
  Building2,
  Shield,
  Settings,
  ChevronDown,
  ChevronRight,
  QrCode,
} from "lucide-react";
import { useState } from "react";

const menuSections = [
  {
    title: "Analisa Data",
    items: [
      { label: "Audital Work", href: "/dashboard/audital-work", icon: BarChart3 },
    ],
  },
  {
    title: "General Menu",
    items: [
      { label: "Data Customer", href: "/dashboard/sales", icon: Users },
      { label: "Ayres Agent", href: "/dashboard/agent", icon: Building2 },
      { label: "Roles", href: "/dashboard/roles", icon: Shield },
    ],
  },
  {
    title: "AI Settings",
    items: [
      { label: "AI Settings", href: "/dashboard/ai-settings", icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    Object.fromEntries(menuSections.map((s) => [s.title, true]))
  );

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isActive = (href: string) => {
    if (href === "/dashboard/sales") {
      return pathname === href || pathname.startsWith("/dashboard/sales/");
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      style={{
        width: 230,
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        background: "#fff",
        borderRight: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: "#3b82f6",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BarChart3 style={{ width: 20, height: 20, color: "#fff" }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Ayres</div>
            <div style={{ fontSize: 10, color: "#9ca3af" }}>Auto Audit System</div>
          </div>
        </div>
        <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>version: 1.0.0</div>
      </div>

      {/* Connect WhatsApp */}
      <div style={{ padding: "12px 12px 4px" }}>
        <Link
          href="/dashboard/connect"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            textDecoration: "none",
            background: isActive("/dashboard/connect") ? "#3b82f6" : "transparent",
            color: isActive("/dashboard/connect") ? "#fff" : "#4b5563",
          }}
        >
          <QrCode style={{ width: 16, height: 16 }} />
          Connect WhatsApp
        </Link>
      </div>

      {/* Menu */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "8px 12px 16px" }}>
        {menuSections.map((section) => (
          <div key={section.title} style={{ marginBottom: 4 }}>
            <button
              onClick={() => toggleSection(section.title)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                padding: "8px 12px",
                fontSize: 11,
                fontWeight: 600,
                color: "#9ca3af",
                background: "none",
                border: "none",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {section.title}
              {openSections[section.title] ? (
                <ChevronDown style={{ width: 14, height: 14 }} />
              ) : (
                <ChevronRight style={{ width: 14, height: 14 }} />
              )}
            </button>

            {openSections[section.title] &&
              section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 500,
                      textDecoration: "none",
                      marginBottom: 2,
                      background: active ? "#3b82f6" : "transparent",
                      color: active ? "#fff" : "#4b5563",
                    }}
                  >
                    <Icon style={{ width: 16, height: 16 }} />
                    {item.label}
                  </Link>
                );
              })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
