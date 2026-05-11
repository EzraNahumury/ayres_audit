// One-time migration: hash any plaintext passwords in the `users` table.
// Run locally OR on the Hostinger server (where the production DB lives):
//   node scripts/migrate-passwords.mjs
//
// Idempotent — rows already in pbkdf2$... format are skipped.
// Also widens the `password` column to VARCHAR(255) if narrower.

import mysql from "mysql2/promise";
import { webcrypto } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// Tiny .env.local loader (no dotenv dependency)
const envPath = join(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
}

const subtle = webcrypto.subtle;
const enc = new TextEncoder();
const PBKDF2_ITERATIONS = 210_000;
const PBKDF2_KEY_BYTES = 32;
const PBKDF2_SALT_BYTES = 16;

function toBase64Url(buf) {
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return Buffer.from(u8).toString("base64url");
}

async function hashPassword(plain) {
  const salt = webcrypto.getRandomValues(new Uint8Array(PBKDF2_SALT_BYTES));
  const key = await subtle.importKey("raw", enc.encode(plain), { name: "PBKDF2" }, false, ["deriveBits"]);
  const bits = await subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: PBKDF2_ITERATIONS },
    key,
    PBKDF2_KEY_BYTES * 8
  );
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toBase64Url(salt)}$${toBase64Url(bits)}`;
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "ayres_audit",
  });

  // Make sure column can hold a 90+ char hash.
  const [cols] = await conn.query(
    "SELECT CHARACTER_MAXIMUM_LENGTH AS len FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'password'"
  );
  const currentLen = cols[0]?.len ?? 0;
  if (currentLen && currentLen < 255) {
    console.log(`Widening users.password from VARCHAR(${currentLen}) to VARCHAR(255)…`);
    await conn.query("ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NOT NULL");
  }

  const [rows] = await conn.query("SELECT id, username, password FROM users");
  let upgraded = 0;
  let skipped = 0;
  for (const row of rows) {
    const pwd = row.password ?? "";
    if (pwd.startsWith("pbkdf2$")) {
      skipped++;
      continue;
    }
    if (!pwd) {
      console.log(`  ⚠ user #${row.id} (${row.username}) has empty password — skipping`);
      skipped++;
      continue;
    }
    const hashed = await hashPassword(pwd);
    await conn.query("UPDATE users SET password = ? WHERE id = ?", [hashed, row.id]);
    console.log(`  ✓ hashed password for ${row.username}`);
    upgraded++;
  }

  console.log(`\nDone. Upgraded: ${upgraded}, already-hashed/skipped: ${skipped}.`);
  await conn.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
