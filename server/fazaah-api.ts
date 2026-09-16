import crypto from "node:crypto";
import express, { type Express, type Request, type Response } from "express";
import { storagePut } from "./storage";

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
type VerificationStatus = "draft" | "submitted" | "approved" | "rejected";
type Provider = {
  id: number; userId: number; name: string; categoryId: number; categoryName: string; categoryIcon: string;
  city: string; district: string; rating: number; reviewCount: number; completedJobs: number;
  yearsExperience: number; isAvailable: boolean; isVerified: boolean; avatarUrl: string | null;
  phone: string; whatsapp: string; bio: string; distanceKm: number; hourlyRate?: number | null;
};
type IdentitySubmission = {
  frontKey?: string; backKey?: string; submittedAt?: string; reviewedAt?: string;
  status: VerificationStatus; rejectionReason?: string | null;
};

const categories = [
  { id: 1, name: "كهرباء", icon: "⚡" }, { id: 2, name: "سباكة", icon: "💧" },
  { id: 3, name: "تكييف وتبريد", icon: "❄️" }, { id: 4, name: "نقل وتوصيل", icon: "🚚" },
  { id: 5, name: "دهان وديكور", icon: "🎨" }, { id: 6, name: "صيانة منزلية", icon: "🔧" },
];

const providers: Provider[] = [
  { id: 1, userId: 101, name: "مؤسسة النخبة للكهرباء", categoryId: 1, categoryName: "كهرباء", categoryIcon: "⚡", city: "صنعاء", district: "حدة", rating: 4.9, reviewCount: 28, completedJobs: 86, yearsExperience: 9, isAvailable: true, isVerified: true, avatarUrl: null, phone: "777111111", whatsapp: "777111111", bio: "فريق متخصص في التمديدات الكهربائية والصيانة المنزلية بخبرة موثقة.", distanceKm: 1.8 },
  { id: 2, userId: 102, name: "سباك فزعة", categoryId: 2, categoryName: "سباكة", categoryIcon: "💧", city: "صنعاء", district: "الزبيري", rating: 4.7, reviewCount: 19, completedJobs: 54, yearsExperience: 6, isAvailable: true, isVerified: true, avatarUrl: null, phone: "777222222", whatsapp: "777222222", bio: "حلول سريعة للتسربات والتمديدات وتركيب الأدوات الصحية.", distanceKm: 3.2 },
  { id: 3, userId: 103, name: "نسمة للتكييف", categoryId: 3, categoryName: "تكييف وتبريد", categoryIcon: "❄️", city: "صنعاء", district: "شعوب", rating: 4.6, reviewCount: 14, completedJobs: 41, yearsExperience: 5, isAvailable: false, isVerified: true, avatarUrl: null, phone: "777333333", whatsapp: "777333333", bio: "تركيب وتنظيف وصيانة المكيفات المنزلية والتجارية.", distanceKm: 5.1 },
];

const users = new Map<string, FazaahUser>();
const sessions = new Map<string, FazaahUser>();
const otps = new Map<string, OtpEntry>();
const providerProfiles = new Map<number, Provider>();
const identitySubmissions = new Map<number, IdentitySubmission>();
let nextUserId = 1;

function normalizePhone(value: unknown): string { return String(value ?? "").trim().replace(/\s+/g, ""); }
function publicUser(user: FazaahUser) { return { ...user }; }
function currentUser(req: Request): FazaahUser | undefined {
  const header = req.headers.authorization ?? "";
  return sessions.get(header.startsWith("Bearer ") ? header.slice(7) : "");
}
function tokenFor(user: FazaahUser): string { const token = crypto.randomBytes(24).toString("hex"); sessions.set(token, user); return token; }
function sendError(res: Response, status: number, error: string) { res.status(status).json({ error }); }
function requireProvider(req: Request, res: Response): FazaahUser | undefined {
  const user = currentUser(req);
  if (!user) { sendError(res, 401, "يجب تسجيل الدخول أولاً"); return undefined; }
  if (user.role !== "provider" && user.role !== "admin") { sendError(res, 403, "هذه الصفحة مخصصة للمهنيين"); return undefined; }
  return user;
}
function providerFor(user: FazaahUser): Provider {
  const existing = providerProfiles.get(user.id) ?? providers.find((item) => item.userId === user.id);
  if (existing) { providerProfiles.set(user.id, existing); return existing; }
  const created: Provider = { id: 1000 + user.id, userId: user.id, name: user.name, categoryId: 1, categoryName: "كهرباء", categoryIcon: "⚡", city: user.city ?? "صنعاء", district: "", rating: 0, reviewCount: 0, completedJobs: 0, yearsExperience: 0, isAvailable: false, isVerified: false, avatarUrl: user.avatarUrl, phone: user.phone, whatsapp: user.phone, bio: "", distanceKm: 0, hourlyRate: null };
  providerProfiles.set(user.id, created);
  return created;
}
function providerForClient(provider: Provider) { return { ...provider, verificationStatus: undefined, identityDocumentsUploaded: undefined }; }
function publicProviders() {
  const approved = Array.from(providerProfiles.values()).filter((provider) => identitySubmissions.get(provider.userId)?.status === "approved");
  return [...providers, ...approved].map(providerForClient);
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
    const phone = normalizePhone(req.body?.phone); const code = String(req.body?.code ?? ""); const entry = otps.get(phone);
    if (!entry || entry.expiresAt < Date.now() || entry.code !== code) return sendError(res, 400, "رمز التحقق غير صحيح أو منتهي الصلاحية");
    const existing = users.get(phone);
    if (!existing && !req.body?.name) return res.json({ needsRegistration: true, phone });
    const user = existing ?? { id: nextUserId++, name: String(req.body.name).trim(), phone, email: null, role: req.body.role === "provider" ? "provider" : "client", status: "active", avatarUrl: null, phoneVerified: true, emailVerified: false, city: req.body.city ?? "صنعاء", createdAt: new Date().toISOString() } satisfies FazaahUser;
    if (!existing) users.set(phone, user); otps.delete(phone); res.json({ token: tokenFor(user), user: publicUser(user) });
  });
  app.get("/api/auth/me", (req, res) => { const user = currentUser(req); if (!user) return sendError(res, 401, "يجب تسجيل الدخول أولاً"); res.json(publicUser(user)); });
  app.post("/api/auth/login/email", (req, res) => { const email = String(req.body?.email ?? "").trim().toLowerCase(); const user = Array.from(users.values()).find((item) => item.email === email); if (!user || req.body?.password !== "demo123") return sendError(res, 401, "البريد الإلكتروني أو كلمة المرور غير صحيحة"); res.json({ token: tokenFor(user), user: publicUser(user) }); });

  app.get("/api/categories", (_req, res) => res.json(categories));
  app.get("/api/providers/me", (req, res) => { const user = requireProvider(req, res); if (!user) return; const provider = providerFor(user); const verification = identitySubmissions.get(user.id); res.json({ ...provider, verificationStatus: verification?.status ?? "draft", identityDocumentsUploaded: { front: Boolean(verification?.frontKey), back: Boolean(verification?.backKey) }, rejectionReason: verification?.rejectionReason ?? null }); });
  app.patch("/api/providers/me", (req, res) => { const user = requireProvider(req, res); if (!user) return; const provider = providerFor(user); const body = req.body ?? {}; const category = categories.find((item) => item.id === Number(body.categoryId)); Object.assign(provider, { name: body.name?.trim() || provider.name, categoryId: category?.id ?? provider.categoryId, categoryName: category?.name ?? provider.categoryName, categoryIcon: category?.icon ?? provider.categoryIcon, city: body.city?.trim() || provider.city, district: body.district?.trim() || provider.district, bio: body.bio?.trim() ?? provider.bio, yearsExperience: body.yearsExperience == null ? provider.yearsExperience : Number(body.yearsExperience), hourlyRate: body.hourlyRate == null ? provider.hourlyRate : Number(body.hourlyRate), whatsapp: body.whatsapp?.trim() || provider.whatsapp }); res.json(providerForClient(provider)); });
  app.get("/api/providers/me/verification", (req, res) => { const user = requireProvider(req, res); if (!user) return; const verification = identitySubmissions.get(user.id); res.json({ status: verification?.status ?? "draft", frontUploaded: Boolean(verification?.frontKey), backUploaded: Boolean(verification?.backKey), submittedAt: verification?.submittedAt ?? null, rejectionReason: verification?.rejectionReason ?? null }); });
  app.post("/api/providers/me/identity/:side", express.raw({ type: () => true, limit: "8mb" }), async (req, res) => { const user = requireProvider(req, res); if (!user) return; const side = req.params.side; const contentType = String(req.headers["content-type"] ?? ""); const body = req.body as Buffer; if (side !== "front" && side !== "back") return sendError(res, 400, "جهة الهوية غير صحيحة"); if (!contentType.match(/^image\/(jpeg|png|webp)$/i)) return sendError(res, 400, "ارفع صورة JPG أو PNG أو WEBP فقط"); if (!Buffer.isBuffer(body) || body.length < 100 || body.length > 8 * 1024 * 1024) return sendError(res, 400, "حجم صورة الهوية غير صالح"); try { const upload = await storagePut(`private/identity/${user.id}/${side}-${Date.now()}.bin`, body, contentType); const current = identitySubmissions.get(user.id) ?? { status: "draft" as VerificationStatus }; current[`${side}Key` as "frontKey" | "backKey"] = upload.key; current.status = current.status === "approved" ? "draft" : current.status; identitySubmissions.set(user.id, current); res.json({ success: true, side, uploaded: true }); } catch (error) { sendError(res, 500, error instanceof Error ? error.message : "تعذر حفظ وثيقة الهوية"); } });
  app.post("/api/providers/me/verification/submit", (req, res) => { const user = requireProvider(req, res); if (!user) return; const provider = providerFor(user); const verification = identitySubmissions.get(user.id) ?? { status: "draft" as VerificationStatus }; const missing: string[] = []; if (!provider.name.trim()) missing.push("اسم الملف"); if (!provider.city.trim()) missing.push("المدينة"); if (!provider.bio.trim()) missing.push("نبذة الخدمة"); if (!provider.categoryId) missing.push("مجال الخدمة"); if (!verification?.frontKey) missing.push("الوجه الأمامي للهوية"); if (!verification?.backKey) missing.push("الوجه الخلفي للهوية"); if (missing.length) return res.status(400).json({ error: `أكمل المتطلبات التالية: ${missing.join("، ")}` }); verification.status = "submitted"; verification.submittedAt = new Date().toISOString(); identitySubmissions.set(user.id, verification); res.json({ success: true, status: verification.status, message: "تم إرسال ملفك للمراجعة" }); });

  app.get("/api/providers", (req, res) => { const search = String(req.query.search ?? "").trim().toLowerCase(); const categoryId = Number(req.query.categoryId ?? 0); const filtered = publicProviders().filter((provider) => { const matchesSearch = !search || `${provider.name} ${provider.categoryName} ${provider.bio}`.toLowerCase().includes(search); return matchesSearch && (!categoryId || provider.categoryId === categoryId); }); res.json({ providers: filtered, total: filtered.length, page: 1, pageSize: filtered.length }); });
  app.get("/api/providers/top-rated", (_req, res) => res.json(publicProviders().slice().sort((a, b) => b.rating - a.rating)));
  app.get("/api/providers/most-requested", (_req, res) => res.json(publicProviders()));
  app.get("/api/providers/nearby", (_req, res) => res.json(publicProviders()));
  app.get("/api/providers/:id", (req, res) => { const provider = providers.find((item) => item.id === Number(req.params.id)); if (!provider) return sendError(res, 404, "المهني غير موجود"); res.json(providerForClient(provider)); });
  app.get("/api/providers/:id/reviews", (_req, res) => res.json([])); app.get("/api/providers/:id/portfolio", (_req, res) => res.json([]));
  app.patch("/api/admin/providers/:id/verify", (req, res) => {
    const reviewer = currentUser(req);
    if (!reviewer || reviewer.role !== "admin") return sendError(res, 403, "صلاحية الإدارة مطلوبة");
    const provider = Array.from(providerProfiles.values()).find((item) => item.id === Number(req.params.id));
    if (!provider) return sendError(res, 404, "ملف المهني غير موجود");
    const verification = identitySubmissions.get(provider.userId);
    const approved = Boolean(req.body?.isVerified);
    if (approved && (!verification?.frontKey || !verification?.backKey)) return sendError(res, 400, "لا يمكن اعتماد الملف قبل وجود وثيقتي الهوية");
    const next: IdentitySubmission = verification ?? { status: "draft" };
    next.status = approved ? "approved" : "rejected";
    next.rejectionReason = approved ? null : String(req.body?.rejectionReason ?? "يرجى تحديث البيانات وإعادة الإرسال");
    next.reviewedAt = new Date().toISOString();
    identitySubmissions.set(provider.userId, next);
    provider.isVerified = approved;
    res.json({ success: true, status: next.status });
  });

  app.get("/api/home-feed", (_req, res) => res.json({ categories, providers: publicProviders().slice(0, 3), recentRequests: [] }));
  app.get("/api/ads/featured", (_req, res) => res.json([])); app.get("/api/subscription-plans", (_req, res) => res.json([])); app.get("/api/notifications", (_req, res) => res.json([])); app.get("/api/requests", (_req, res) => res.json([])); app.get("/api/favorites", (_req, res) => res.json([])); app.get("/api/conversations", (_req, res) => res.json([]));
}
