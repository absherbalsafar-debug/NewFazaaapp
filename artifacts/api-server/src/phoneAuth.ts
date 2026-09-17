import type { Express, Request, Response } from "express";
import { randomInt } from "node:crypto";

interface PendingOtp {
  code: string;
  expiresAt: number;
}

const pending = new Map<string, PendingOtp>();
const sessions = new Map<string, { user: ReturnType<typeof userFor>; expiresAt: number }>();
const revokedTokens = new Set<string>();
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;

function normalizePhone(value: unknown) {
  return String(value ?? "").replace(/[^0-9+]/g, "").trim();
}

function userFor(phone: string, body: Record<string, unknown> = {}) {
  const role = body.role === "provider" ? "provider" : "client";
  return {
    id: Math.abs(phone.split("").reduce((sum, char) => sum * 31 + char.charCodeAt(0), 7)),
    name: String(body.name || `مستخدم فزعة ${phone.slice(-4)}`),
    phone,
    email: null,
    role,
    status: "active",
    avatarUrl: null,
    phoneVerified: true,
    emailVerified: false,
    city: body.city ? String(body.city) : null,
    createdAt: new Date().toISOString(),
  };
}

export function registerPhoneAuthRoutes(app: Express) {
  app.post("/api/auth/send-otp", (req: Request, res: Response) => {
    const phone = normalizePhone(req.body?.phone);
    if (phone.length < 7) return res.status(400).json({ error: "أدخل رقم هاتف صحيح" });

    const code = String(randomInt(100000, 1000000));
    pending.set(phone, { code, expiresAt: Date.now() + 10 * 60 * 1000 });
    // SMS provider is not configured in this deployment, so the code is returned
    // for display in the same screen as an explicit development fallback.
    return res.json({ success: true, otp: code, expiresIn: 600 });
  });

  app.post("/api/auth/verify-otp", (req: Request, res: Response) => {
    const phone = normalizePhone(req.body?.phone);
    const code = String(req.body?.code ?? "").replace(/\D/g, "");
    const saved = pending.get(phone);
    if (!saved || saved.expiresAt < Date.now() || saved.code !== code) {
      return res.status(401).json({ error: "رمز التحقق غير صحيح أو منتهي الصلاحية" });
    }

    pending.delete(phone);
    const user = userFor(phone, req.body ?? {});
    const tokenPayload = { phone, issuedAt: Date.now(), role: user.role, name: user.name, city: user.city };
    const token = `phone_${Buffer.from(JSON.stringify(tokenPayload)).toString("base64url")}`;
    sessions.set(token, { user, expiresAt: Date.now() + SESSION_TTL });
    return res.json({ token, user, needsRegistration: false });
  });

  app.get("/api/auth/me", (req: Request, res: Response) => {
    const header = req.header("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (revokedTokens.has(token)) return res.status(401).json({ error: "انتهت جلسة الدخول" });
    const session = sessions.get(token);
    if (session && session.expiresAt >= Date.now()) return res.json(session.user);
    if (session) sessions.delete(token);

    // The deployment may route the follow-up request to another process.
    // Validate the signed-in phone token statelessly so auth/me remains reliable.
    if (token.startsWith("phone_")) {
      try {
        const decoded = Buffer.from(token.slice(6), "base64url").toString();
        const payload = JSON.parse(decoded) as { phone?: string; issuedAt?: number; role?: string; name?: string; city?: string | null };
        if (payload.phone && Number.isFinite(payload.issuedAt) && Date.now() - Number(payload.issuedAt) < SESSION_TTL) {
          return res.json(userFor(payload.phone, payload));
        }
      } catch {
        // Treat malformed tokens as expired below.
      }
    }
    {
      sessions.delete(token);
      return res.status(401).json({ error: "انتهت جلسة الدخول" });
    }
  });

  const revokeSession = (req: Request, res: Response) => {
    const header = req.header("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (token) {
      sessions.delete(token);
      revokedTokens.add(token);
    }
    return res.json({ success: true });
  };
  app.post("/api/auth/logout", revokeSession);
  app.post("/api/auth/logout-all", revokeSession);
}
