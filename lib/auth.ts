// Auth primitives: signed tokens (HMAC-SHA256) and password hashing (PBKDF2-SHA256).
// Uses Web Crypto only — works in both Node runtime (route handlers) and Edge runtime (middleware/proxy).
// No native modules → safe to deploy on Hostinger Cloud Hosting.

const subtle = globalThis.crypto.subtle;
const enc = new TextEncoder();
const dec = new TextDecoder();

const PBKDF2_ITERATIONS = 210_000; // OWASP 2023 recommendation for PBKDF2-SHA256
const PBKDF2_KEY_BYTES = 32;
const PBKDF2_SALT_BYTES = 16;
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error(
      "AUTH_SECRET is missing or shorter than 32 chars. Generate one with: node -e \"console.log(require('crypto').randomBytes(48).toString('base64url'))\""
    );
  }
  return s;
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array<ArrayBuffer> {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const buf = new ArrayBuffer(bin.length);
  const u8 = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}

async function importHmacKey(): Promise<CryptoKey> {
  return subtle.importKey(
    "raw",
    enc.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

// Constant-time comparison for two Uint8Arrays of equal length.
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// ============ Token (signed JWT-like, HS256) ============

export type TokenPayload = {
  id: number;
  username: string;
  name: string;
  role: string;
  permissions: string[];
  exp?: number; // Unix seconds
};

export async function signToken(payload: TokenPayload): Promise<string> {
  const body: TokenPayload = {
    ...payload,
    exp: payload.exp ?? Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };
  const payloadB64 = toBase64Url(enc.encode(JSON.stringify(body)));
  const key = await importHmacKey();
  const sig = await subtle.sign("HMAC", key, enc.encode(payloadB64));
  return `${payloadB64}.${toBase64Url(sig)}`;
}

export async function verifyToken(token: string | undefined | null): Promise<TokenPayload | null> {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot < 0) return null;
  const payloadB64 = token.slice(0, dot);
  const sigB64 = token.slice(dot + 1);
  if (!payloadB64 || !sigB64) return null;

  try {
    const key = await importHmacKey();
    const expected = new Uint8Array(await subtle.sign("HMAC", key, enc.encode(payloadB64)));
    const provided = fromBase64Url(sigB64);
    if (!timingSafeEqual(expected, provided)) return null;

    const payload = JSON.parse(dec.decode(fromBase64Url(payloadB64))) as TokenPayload;
    if (payload.exp && Math.floor(Date.now() / 1000) >= payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// ============ Password hashing (PBKDF2-SHA256) ============

// Stored format: pbkdf2$<iterations>$<saltB64url>$<hashB64url>
const PASSWORD_PREFIX = "pbkdf2$";

export function isHashedPassword(stored: string | null | undefined): boolean {
  return typeof stored === "string" && stored.startsWith(PASSWORD_PREFIX);
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(PBKDF2_SALT_BYTES));
  const keyMaterial = await subtle.importKey(
    "raw",
    enc.encode(plain),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const bits = await subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: PBKDF2_ITERATIONS },
    keyMaterial,
    PBKDF2_KEY_BYTES * 8
  );
  return `${PASSWORD_PREFIX}${PBKDF2_ITERATIONS}$${toBase64Url(salt)}$${toBase64Url(bits)}`;
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  if (!isHashedPassword(stored)) return false;
  const [, iterStr, saltB64, hashB64] = stored.split("$");
  const iterations = Number(iterStr);
  if (!iterations || !saltB64 || !hashB64) return false;

  const salt = fromBase64Url(saltB64);
  const expected = fromBase64Url(hashB64);
  const keyMaterial = await subtle.importKey(
    "raw",
    enc.encode(plain),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const bits = new Uint8Array(
    await subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt, iterations },
      keyMaterial,
      expected.length * 8
    )
  );
  return timingSafeEqual(bits, expected);
}

// Cookie name used across the app.
export const AUTH_COOKIE = "auth_token";

// Cookie options for set-cookie. `secure` flips automatically with NODE_ENV.
export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: TOKEN_TTL_SECONDS,
};
