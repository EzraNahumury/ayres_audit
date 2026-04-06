import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ayres Audit - AI WhatsApp Auto Audit System",
  description: "Sistem audit otomatis untuk Customer Service Ayres berbasis AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
