import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@whiskeysockets/baileys",
    "qrcode",
    "pino",
    "pino-pretty",
    "libsignal",
    "protobufjs",
    "link-preview-js",
    "mysql2",
  ],
};

export default nextConfig;
