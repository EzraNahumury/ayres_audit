import type { NextConfig } from "next";

// Packages we ship to disk but don't bundle. Next.js still traces the top-level
// module, but not its transitive deps — that's why we also need
// outputFileTracingIncludes below to preserve sub-deps that Baileys (running
// inside scripts/wa-worker.cjs, outside the Next.js graph) ends up requiring.
const externalPackages = [
  "@whiskeysockets/baileys",
  "qrcode",
  "pino",
  "pino-pretty",
  "libsignal",
  "protobufjs",
  "link-preview-js",
  "mysql2",
];

// Glob patterns for every node_modules tree that the WA worker reaches into.
// On Hostinger (standalone build + aggressive prune), anything not listed here
// gets dropped from node_modules and the worker fails with MODULE_NOT_FOUND.
const workerIncludes = [
  "./scripts/wa-worker.cjs",
  "./node_modules/@whiskeysockets/**/*",
  "./node_modules/@adiwajshing/**/*",
  "./node_modules/@hapi/**/*",
  "./node_modules/@protobufjs/**/*",
  "./node_modules/@cacheable/**/*",
  "./node_modules/protobufjs/**/*",
  "./node_modules/libsignal/**/*",
  "./node_modules/link-preview-js/**/*",
  "./node_modules/axios/**/*",
  "./node_modules/lodash/**/*",
  "./node_modules/pino/**/*",
  "./node_modules/pino-*/**/*",
  "./node_modules/ws/**/*",
  "./node_modules/uuid/**/*",
  "./node_modules/cache-manager/**/*",
  "./node_modules/libphonenumber-js/**/*",
  "./node_modules/music-metadata/**/*",
  "./node_modules/audio-decode/**/*",
  "./node_modules/async-lock/**/*",
  "./node_modules/qrcode/**/*",
];

const nextConfig: NextConfig = {
  serverExternalPackages: externalPackages,
  outputFileTracingIncludes: {
    "/api/whatsapp": workerIncludes,
    "/api/whatsapp/**": workerIncludes,
    "/api/wa-debug": workerIncludes,
  },
};

export default nextConfig;
