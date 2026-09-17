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
  const getTokenUser = (req: Request) => {
    const header = req.header("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token || revokedTokens.has(token)) return null;
    const session = sessions.get(token);
    if (session && session.expiresAt >= Date.now()) return session.user;
    try {
      const payload = JSON.parse(Buffer.from(token.replace(/^phone_/, ""), "base64url").toString()) as Record<string, unknown>;
      if (typeof payload.phone === "string" && Number(payload.issuedAt) + SESSION_TTL > Date.now()) return userFor(payload.phone, payload);
    } catch { /* invalid token */ }
    return null;
  };

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
    const user = getTokenUser(req);
    if (!user) return res.status(401).json({ error: "انتهت جلسة الدخول" });
    return res.json(user);
  });

  app.get("/api/providers/me", (req: Request, res: Response) => {
    const user = getTokenUser(req);
    if (!user) return res.status(401).json({ error: "انتهت جلسة الدخول" });
    if (user.role !== "provider") return res.status(403).json({ error: "هذا المسار للمهنيين فقط" });
    return res.json({ id: user.id, name: user.name, avatarUrl: null, categoryId: 0, categoryName: "خدمات مهنية", categoryIcon: null, city: user.city ?? "صنعاء", district: "", bio: "", rating: 0, reviewCount: 0, completedJobs: 0, yearsExperience: 0, hourlyRate: null, phone: user.phone, whatsapp: null, isVerified: false, isAvailable: true, lat: null, lng: null, createdAt: user.createdAt });
  });

  app.get("/api/categories", (_req: Request, res: Response) => res.json([]));
  app.get("/api/requests", (_req: Request, res: Response) => res.json([]));
  app.patch("/api/providers/:id", (req: Request, res: Response) => {
    const user = getTokenUser(req);
    if (!user) return res.status(401).json({ error: "انتهت جلسة الدخول" });
    if (req.body?.phone !== undefined) user.phone = normalizePhone(req.body.phone);
    if (req.body?.city !== undefined) user.city = String(req.body.city || "");
    return res.json({ id: Number(req.params.id), name: user.name, avatarUrl: null, categoryId: 0, categoryName: "خدمات مهنية", categoryIcon: null, city: user.city ?? "صنعاء", district: String(req.body?.district || ""), bio: String(req.body?.bio || ""), rating: 0, reviewCount: 0, completedJobs: 0, yearsExperience: Number(req.body?.yearsExperience) || 0, hourlyRate: Number(req.body?.hourlyRate) || null, phone: user.phone, whatsapp: req.body?.whatsapp ? normalizePhone(req.body.whatsapp) : null, isVerified: false, isAvailable: req.body?.isAvailable !== false, lat: null, lng: null, createdAt: user.createdAt });
  });
  app.get("/api/providers/me/business", (_req: Request, res: Response) => res.json({ subscription: { id: 0, plan: "free", status: "active", freeSlotNumber: null, startsAt: null, endsAt: null, createdAt: new Date().toISOString() }, metrics: { profileViews: 0, callClicks: 0, whatsappClicks: 0, serviceRequests: 0 }, freeSlotsRemaining: 300 }));
  app.get("/api/subscription-plans", (_req: Request, res: Response) => res.json([]));
  app.get("/api/payment-wallets", (_req: Request, res: Response) => res.json([]));
  app.get("/api/providers/me/payments", (_req: Request, res: Response) => res.json([]));
  app.get("/api/ads/mine", (_req: Request, res: Response) => res.json([]));
  app.get("/api/commercial-plans", (_req: Request, res: Response) => res.json([]));
  app.post("/api/subscriptions/checkout", (req: Request, res: Response) => res.status(201).json({ id: Date.now(), providerId: 0, plan: req.body?.plan || "monthly", wallet: req.body?.wallet || "", transactionReference: req.body?.transactionReference || "", receiptUrl: req.body?.receiptUrl || null, status: "pending", createdAt: new Date().toISOString() }));
  app.post("/api/ads", (req: Request, res: Response) => res.status(201).json({ id: Date.now(), providerId: 0, ...req.body, status: "pending", createdAt: new Date().toISOString() }));
  app.post("/api/storage/uploads/request-url", (_req: Request, res: Response) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return res.json({ uploadURL: `/api/storage/uploads/${id}`, objectPath: `verification/${id}` });
  });
  app.put("/api/storage/uploads/:id", (_req: Request, res: Response) => res.status(200).json({ success: true }));
  app.post("/api/providers/me/verification-documents", (req: Request, res: Response) => {
    if (!getTokenUser(req)) return res.status(401).json({ error: "انتهت جلسة الدخول" });
    return res.status(201).json({ success: true, document: req.body });
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
