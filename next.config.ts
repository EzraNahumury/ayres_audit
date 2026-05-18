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

// scripts/wa-worker.cjs is loaded via child_process, completely outside the
// Next.js module graph, so next-trace can't follow its require() chain. Rather
// than enumerate every transitive dep (Baileys + libsignal + protobufjs alone
// pull in 100+ packages), include the whole node_modules tree for the worker
// routes. Other (non-WA) routes still get the narrow trace they had before.
const workerIncludes = [
  "./scripts/wa-worker.cjs",
  "./node_modules/**/*",
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
