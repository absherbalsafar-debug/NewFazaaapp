import crypto from "crypto";

const AUTH_SECRET = process.env.SESSION_SECRET;
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const LEGACY_PASSWORD_SALT = "sanad_salt_2024";
const SCRYPT_KEY_LENGTH = 64;

if ((!AUTH_SECRET || AUTH_SECRET.length < 32) && process.env.NODE_ENV === "production") {
  throw new Error("SESSION_SECRET must be configured with at least 32 characters in production");
}

const signingSecret = AUTH_SECRET || "local-development-only-change-me";

/** Password hashes use a versioned scrypt format: scrypt$N$r$p$salt$derivedKey. */
export function hashPassword(password: string): string {
  if (password.length < 8) throw new Error("Password must be at least 8 characters");
  const salt = crypto.randomBytes(16).toString("base64url");
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH, { N: 16_384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 });
  return `scrypt$16384$8$1$${salt}$${derived.toString("base64url")}`;
}

function verifyScrypt(password: string, encoded: string): boolean {
  const [algorithm, n, r, p, salt, expected] = encoded.split("$");
  if (algorithm !== "scrypt" || !n || !r || !p || !salt || !expected) return false;
  try {
    const actual = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH, { N: Number(n), r: Number(r), p: Number(p), maxmem: 32 * 1024 * 1024 });
    const expectedBuffer = Buffer.from(expected, "base64url");
    return expectedBuffer.length === actual.length && crypto.timingSafeEqual(actual, expectedBuffer);
  } catch { return false; }
}

export function verifyPassword(password: string, hash: string): boolean {
  if (hash.startsWith("scrypt$")) return verifyScrypt(password, hash);
  const legacy = crypto.createHash("sha256").update(password + signingSecret).digest("hex");
  const oldLegacy = crypto.createHash("sha256").update(password + LEGACY_PASSWORD_SALT).digest("hex");
  const candidate = Buffer.from(hash);
  const matches = (expected: string) => { const expectedBuffer = Buffer.from(expected); return candidate.length === expectedBuffer.length && crypto.timingSafeEqual(expectedBuffer, candidate); };
  return matches(legacy) || matches(oldLegacy);
}

export function needsPasswordRehash(hash: string): boolean {
  return !hash.startsWith("scrypt$");
}

export function generateToken(userId: number): string {
  const payload = `${userId}:${Date.now()}`;
  const signature = crypto.createHmac("sha256", signingSecret).update(payload).digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${signature}`;
}

export function verifyToken(token: string): number | null {
  try {
    const [encodedPayload, signature] = token.split(".");
    if (!encodedPayload || !signature) return null;
    const decoded = Buffer.from(encodedPayload, "base64url").toString("utf-8");
    const [userId, issuedAt] = decoded.split(":");
    const expected = crypto.createHmac("sha256", signingSecret).update(decoded).digest("base64url");
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) return null;
    const issued = Number(issuedAt);
    if (!Number.isFinite(issued) || Date.now() - issued > TOKEN_TTL_MS || Date.now() - issued < -60_000) return null;
    const id = parseInt(userId, 10);
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch { return null; }
}
