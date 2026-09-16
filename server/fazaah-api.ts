import { randomBytes } from "node:crypto";
import type { Express, Request, Response } from "express";

type FazaahUser = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  role: "client" | "provider" | "admin";
  status: "active" | "banned";
  avatarUrl: string | null;
  phoneVerified: boolean;
  emailVerified: boolean;
  city: string | null;
  createdAt: string;
};

type OtpEntry = { code: string; expiresAt: number };

const categories = [
  { id: 1, name: "كهرباء", icon: "⚡" },
  { id: 2, name: "سباكة", icon: "💧" },
  { id: 3, name: "تكييف وتبريد", icon: "❄️" },
  { id: 4, name: "نقل وتوصيل", icon: "🚚" },
  { id: 5, name: "دهان وديكور", icon: "🎨" },
  { id: 6, name: "صيانة منزلية", icon: "🔧" },
];

const providers = [
  {
    id: 1,
    userId: 101,
    name: "مؤسسة النخبة للكهرباء",
    categoryId: 1,
    categoryName: "كهرباء",
    categoryIcon: "⚡",
    city: "صنعاء",
    district: "حدة",
    rating: 4.9,
    reviewCount: 28,
    completedJobs: 86,
    yearsExperience: 9,
    isAvailable: true,
    isVerified: true,
    avatarUrl: null,
    phone: "777111111",
    whatsapp: "777111111",
    bio: "فريق متخصص في التمديدات الكهربائية والصيانة المنزلية بخبرة موثقة.",
    distanceKm: 1.8,
  },
  {
    id: 2,
    userId: 102,
    name: "سباك فزعة",
    categoryId: 2,
    categoryName: "سباكة",
    categoryIcon: "💧",
    city: "صنعاء",
    district: "الزبيري",
    rating: 4.7,
    reviewCount: 19,
    completedJobs: 54,
    yearsExperience: 6,
    isAvailable: true,
    isVerified: true,
    avatarUrl: null,
    phone: "777222222",
    whatsapp: "777222222",
    bio: "حلول سريعة للتسربات والتمديدات وتركيب الأدوات الصحية.",
    distanceKm: 3.2,
  },
  {
    id: 3,
    userId: 103,
    name: "نسمة للتكييف",
    categoryId: 3,
    categoryName: "تكييف وتبريد",
    categoryIcon: "❄️",
    city: "صنعاء",
    district: "شعوب",
    rating: 4.6,
    reviewCount: 14,
    completedJobs: 41,
    yearsExperience: 5,
    isAvailable: false,
    isVerified: true,
    avatarUrl: null,
    phone: "777333333",
    whatsapp: "777333333",
    bio: "تركيب وتنظيف وصيانة المكيفات المنزلية والتجارية.",
    distanceKm: 5.1,
  },
];

const users = new Map<string, FazaahUser>();
const sessions = new Map<string, FazaahUser>();
const otps = new Map<string, OtpEntry>();
let nextUserId = 1;

function normalizePhone(value: unknown): string {
  return String(value ?? "").trim().replace(/\s+/g, "");
}

function publicUser(user: FazaahUser) {
  return { ...user };
}

function currentUser(req: Request): FazaahUser | undefined {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return sessions.get(token);
}

function tokenFor(user: FazaahUser): string {
  const token = randomBytes(24).toString("hex");
  sessions.set(token, user);
  return token;
}

function sendError(res: Response, status: number, error: string) {
  res.status(status).json({ error });
}

export function registerFazaahApi(app: Express) {
  app.get("/api/healthz", (_req, res) => res.json({ status: "ok", mode: "fazaah-webdev" }));

  app.post("/api/auth/send-otp", (req, res) => {
    const phone = normalizePhone(req.body?.phone);
    if (phone.length < 7) return sendError(res, 400, "رقم الهاتف غير صحيح");
    const code = String(Math.floor(100000 + Math.random() * 900000));
    otps.set(phone, { code, expiresAt: Date.now() + 10 * 60 * 1000 });
    const shouldShow = process.env.NODE_ENV !== "production" || process.env.FAZAAH_SHOW_DEV_OTP === "true";
    res.json({ message: "تم تجهيز رمز التحقق", ...(shouldShow ? { otp: code } : {}) });
  });

  app.post("/api/auth/verify-otp", (req, res) => {
    const phone = normalizePhone(req.body?.phone);
    const code = String(req.body?.code ?? "");
    const entry = otps.get(phone);
    if (!entry || entry.expiresAt < Date.now() || entry.code !== code) {
      return sendError(res, 400, "رمز التحقق غير صحيح أو منتهي الصلاحية");
    }
    const existing = users.get(phone);
    if (!existing && !req.body?.name) return res.json({ needsRegistration: true, phone });
    const user = existing ?? {
      id: nextUserId++,
      name: String(req.body.name).trim(),
      phone,
      email: null,
      role: req.body.role === "provider" ? "provider" : "client",
      status: "active",
      avatarUrl: null,
      phoneVerified: true,
      emailVerified: false,
      city: req.body.city ?? "صنعاء",
      createdAt: new Date().toISOString(),
    } satisfies FazaahUser;
    if (!existing) users.set(phone, user);
    otps.delete(phone);
    res.json({ token: tokenFor(user), user: publicUser(user) });
  });

  app.get("/api/auth/me", (req, res) => {
    const user = currentUser(req);
    if (!user) return sendError(res, 401, "يجب تسجيل الدخول أولاً");
    res.json(publicUser(user));
  });

  app.post("/api/auth/login/email", (req, res) => {
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const user = Array.from(users.values()).find((item) => item.email === email);
    if (!user || req.body?.password !== "demo123") return sendError(res, 401, "البريد الإلكتروني أو كلمة المرور غير صحيحة");
    res.json({ token: tokenFor(user), user: publicUser(user) });
  });

  app.get("/api/categories", (_req, res) => res.json(categories));
  app.get("/api/providers", (req, res) => {
    const search = String(req.query.search ?? "").trim().toLowerCase();
    const categoryId = Number(req.query.categoryId ?? 0);
    const filtered = providers.filter((provider) => {
      const matchesSearch = !search || `${provider.name} ${provider.categoryName} ${provider.bio}`.toLowerCase().includes(search);
      const matchesCategory = !categoryId || provider.categoryId === categoryId;
      return matchesSearch && matchesCategory;
    });
    res.json({ providers: filtered, total: filtered.length, page: 1, pageSize: filtered.length });
  });
  app.get("/api/providers/top-rated", (_req, res) => res.json(providers.slice().sort((a, b) => b.rating - a.rating)));
  app.get("/api/providers/most-requested", (_req, res) => res.json(providers));
  app.get("/api/providers/nearby", (_req, res) => res.json(providers));
  app.get("/api/providers/:id", (req, res) => {
    const provider = providers.find((item) => item.id === Number(req.params.id));
    if (!provider) return sendError(res, 404, "المهني غير موجود");
    res.json(provider);
  });
  app.get("/api/providers/:id/reviews", (_req, res) => res.json([]));
  app.get("/api/providers/:id/portfolio", (_req, res) => res.json([]));
  app.get("/api/home-feed", (_req, res) => res.json({ categories, providers: providers.slice(0, 3), recentRequests: [] }));
  app.get("/api/ads/featured", (_req, res) => res.json([]));
  app.get("/api/subscription-plans", (_req, res) => res.json([]));
  app.get("/api/notifications", (_req, res) => res.json([]));
  app.get("/api/requests", (_req, res) => res.json([]));
  app.get("/api/favorites", (_req, res) => res.json([]));
  app.get("/api/conversations", (_req, res) => res.json([]));
}
