import crypto from "crypto";

const AUTH_SECRET = process.env.SESSION_SECRET ?? "fazaaah-development-secret";
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const LEGACY_PASSWORD_SALT = "sanad_salt_2024";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + AUTH_SECRET).digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash ||
    crypto.createHash("sha256").update(password + LEGACY_PASSWORD_SALT).digest("hex") === hash;
}

export function generateToken(userId: number): string {
  const payload = `${userId}:${Date.now()}`;
  const signature = crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${signature}`;
}

export function verifyToken(token: string): number | null {
  try {
    const [encodedPayload, signature] = token.split(".");
    if (!encodedPayload || !signature) return null;
    const decoded = Buffer.from(encodedPayload, "base64url").toString("utf-8");
    const [userId, issuedAt] = decoded.split(":");
    const expected = crypto.createHmac("sha256", AUTH_SECRET).update(decoded).digest("base64url");
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) {
      return null;
    }
    if (!issuedAt || Date.now() - Number(issuedAt) > TOKEN_TTL_MS) return null;
    const id = parseInt(userId, 10);
    return isNaN(id) ? null : id;
  } catch {
    return null;
  }
}
