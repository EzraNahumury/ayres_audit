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
  ],
};

export default nextConfig;
