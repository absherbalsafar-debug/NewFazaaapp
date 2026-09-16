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
  nationalId?: string;
  certificate?: string;
  workLocation?: string;
  lat?: number;
  lng?: number;
};

type OtpEntry = { code: string; expiresAt: number };
type VerificationStatus = "draft" | "submitted" | "approved" | "rejected";
type Provider = {
  id: number; userId: number; name: string; fullName?: string; nationalId?: string; certificate?: string; workLocation?: string; categoryId: number; categoryName: string; categoryIcon: string;
  city: string; district: string; rating: number; reviewCount: number; completedJobs: number;
  yearsExperience: number; isAvailable: boolean; isVerified: boolean; avatarUrl: string | null;
  phone: string; whatsapp: string; bio: string; distanceKm: number; hourlyRate?: number | null;
};
type ProviderNotification = { id: number; title: string; body: string; isRead: boolean; createdAt: string; type: "verification" | "system" };
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
const notificationsByUser = new Map<number, ProviderNotification[]>();
let nextNotificationId = 1;
function addNotification(userId: number, title: string, body: string) {
  const items = notificationsByUser.get(userId) ?? [];
  items.unshift({ id: nextNotificationId++, title, body, isRead: false, createdAt: new Date().toISOString(), type: "verification" });
  notificationsByUser.set(userId, items.slice(0, 30));
}
let nextUserId = 1;
let nextBusinessId = 1;
let nextAdId = 1;
let nextPortfolioId = 1;
let freeProviderSlotsUsed = 0;
const subscriptionPrices = { monthly: Number(process.env.FAZAAH_MONTHLY_PRICE ?? 5000), yearly: Number(process.env.FAZAAH_YEARLY_PRICE ?? 50000) };
const subscriptions = new Map<number, { id: number; plan: "free" | "monthly" | "yearly"; status: "active" | "pending" | "expired" | "cancelled"; freeSlotNumber: number | null; startsAt: string | null; endsAt: string | null; createdAt: string }>();
const subscriptionPayments = new Map<number, any[]>();
const advertisements = new Map<number, any[]>();
const portfolios = new Map<number, any[]>();
const uploadTokens = new Map<string, { userId: number; name: string; objectPath?: string }>();
const walletSettings = [
  { wallet: "jeeb", merchantName: "محفظة جيب", merchantAccount: "", instructions: "حوّل المبلغ ثم أرفق رقم العملية والإيصال.", isActive: false },
  { wallet: "floosk", merchantName: "محفظة فلوسك", merchantAccount: "", instructions: "حوّل المبلغ ثم أرفق رقم العملية والإيصال.", isActive: false },
  { wallet: "jawali", merchantName: "محفظة جوالي", merchantAccount: "", instructions: "حوّل المبلغ ثم أرفق رقم العملية والإيصال.", isActive: false },
  { wallet: "mobile_money", merchantName: "محفظة موبايل موني", merchantAccount: "", instructions: "حوّل المبلغ ثم أرفق رقم العملية والإيصال.", isActive: false },
  { wallet: "cash", merchantName: "محفظة كاش", merchantAccount: "", instructions: "حوّل المبلغ ثم أرفق رقم العملية والإيصال.", isActive: false },
  { wallet: "one_cash", merchantName: "محفظة ون كاش", merchantAccount: "", instructions: "حوّل المبلغ ثم أرفق رقم العملية والإيصال.", isActive: false },
];
function ensureSubscription(userId: number) {
  const current = subscriptions.get(userId);
  if (current) return current;
  const now = new Date().toISOString();
  const freeSlotNumber = freeProviderSlotsUsed < 250 ? ++freeProviderSlotsUsed : null;
  const created = { id: nextBusinessId++, plan: freeSlotNumber ? "free" as const : "monthly" as const, status: freeSlotNumber ? "active" as const : "pending" as const, freeSlotNumber, startsAt: freeSlotNumber ? now : null, endsAt: null, createdAt: now };
  subscriptions.set(userId, created);
  return created;
}
function hasActiveSubscription(userId: number) { const sub = ensureSubscription(userId); return sub.status === "active"; }
function isEligibleProvider(provider: Provider) { return provider.isVerified && hasActiveSubscription(provider.userId); }


function normalizePhone(value: unknown): string { return String(value ?? "").trim().replace(/\s+/g, ""); }
function publicUser(user: FazaahUser) { return { ...user }; }
function currentUser(req: Request): FazaahUser | undefined {
  const header = req.headers.authorization ?? "";
  return sessions.get(header.startsWith("Bearer ") ? header.slice(7) : "");
}
function tokenFor(user: FazaahUser): string { const token = crypto.randomBytes(24).toString("hex"); sessions.set(token, user); return token; }
function sendError(res: Response, status: number, error: string) { res.status(status).json({ error }); }
function requireAdmin(req: Request, res: Response): FazaahUser | undefined {
  const user = currentUser(req);
  if (!user || user.role !== "admin") { sendError(res, 403, "صلاحية الإدارة مطلوبة"); return undefined; }
  return user;
}
function requireProvider(req: Request, res: Response): FazaahUser | undefined {
  const user = currentUser(req);
  if (!user) { sendError(res, 401, "يجب تسجيل الدخول أولاً"); return undefined; }
  if (user.role !== "provider" && user.role !== "admin") { sendError(res, 403, "هذه الصفحة مخصصة للمهنيين"); return undefined; }
  return user;
}
function providerFor(user: FazaahUser): Provider {
  const existing = providerProfiles.get(user.id) ?? providers.find((item) => item.userId === user.id);
  if (existing) { providerProfiles.set(user.id, existing); return existing; }
  const created: Provider = { id: 1000 + user.id, userId: user.id, name: user.name, fullName: user.name, nationalId: user.nationalId, certificate: user.certificate, workLocation: user.workLocation, categoryId: 1, categoryName: "كهرباء", categoryIcon: "⚡", city: user.city ?? "صنعاء", district: "", rating: 0, reviewCount: 0, completedJobs: 0, yearsExperience: 0, isAvailable: false, isVerified: false, avatarUrl: user.avatarUrl, phone: user.phone, whatsapp: user.phone, bio: "", distanceKm: 0, hourlyRate: null };
  providerProfiles.set(user.id, created);
  return created;
}
function providerForClient(provider: Provider) { return { ...provider, verificationStatus: undefined, identityDocumentsUploaded: undefined }; }
function publicProviders() {
  const approved = Array.from(providerProfiles.values()).filter((provider) => identitySubmissions.get(provider.userId)?.status === "approved" && hasActiveSubscription(provider.userId));
  return [...providers, ...approved].map(providerForClient);
}

for (const seeded of providers) subscriptions.set(seeded.userId, { id: nextBusinessId++, plan: "free", status: "active", freeSlotNumber: null, startsAt: new Date().toISOString(), endsAt: null, createdAt: new Date().toISOString() });

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
    const user = existing ?? { id: nextUserId++, name: String(req.body.name).trim(), phone, email: null, role: req.body.role === "provider" ? "provider" : "client", status: "active", avatarUrl: null, phoneVerified: true, emailVerified: false, city: req.body.city ?? "صنعاء", createdAt: new Date().toISOString(), nationalId: req.body.nationalId, certificate: req.body.certificate, workLocation: req.body.workLocation, lat: req.body.lat, lng: req.body.lng } satisfies FazaahUser;
    if (!existing) users.set(phone, user); if (user.role === "provider") ensureSubscription(user.id); otps.delete(phone); res.json({ token: tokenFor(user), user: publicUser(user) });
  });
  app.get("/api/auth/me", (req, res) => { const user = currentUser(req); if (!user) return sendError(res, 401, "يجب تسجيل الدخول أولاً"); res.json(publicUser(user)); });
  app.post("/api/auth/login/email", (req, res) => { const email = String(req.body?.email ?? "").trim().toLowerCase(); const user = Array.from(users.values()).find((item) => item.email === email); if (!user || req.body?.password !== "demo123") return sendError(res, 401, "البريد الإلكتروني أو كلمة المرور غير صحيحة"); res.json({ token: tokenFor(user), user: publicUser(user) }); });

  app.get("/api/categories", (_req, res) => res.json(categories));
  app.get("/api/subscription-plans", (_req, res) => res.json([
    { id: "free", name: "مجاني", monthlyPrice: 0, yearlyPrice: 0, description: "لأول 250 مهنياً فقط", benefits: ["إنشاء الملف", "التقدم للتوثيق"] },
    { id: "monthly", name: "اشتراك شهري", monthlyPrice: subscriptionPrices.monthly, yearlyPrice: subscriptionPrices.yearly, description: "ظهور الملف والإعلانات لمدة شهر", benefits: ["ظهور للعملاء بعد التوثيق", "معرض أعمال", "إعلانات مدفوعة"] },
    { id: "yearly", name: "اشتراك سنوي", monthlyPrice: subscriptionPrices.monthly, yearlyPrice: subscriptionPrices.yearly, description: "اشتراك سنوي بسعر أفضل", benefits: ["ظهور مستمر", "معرض أعمال", "أولوية في الإعلانات"] },
  ]));
  app.get("/api/payment-wallets", (_req, res) => res.json(walletSettings));
  app.post("/api/storage/uploads/request-url", (req, res) => { const user = currentUser(req); if (!user) return sendError(res, 401, "يجب تسجيل الدخول أولاً"); const size = Number(req.body?.size ?? 0); if (!size || size > 10 * 1024 * 1024) return sendError(res, 400, "حجم الملف غير صالح"); const id = crypto.randomBytes(18).toString("hex"); uploadTokens.set(id, { userId: user.id, name: String(req.body?.name ?? "upload") }); res.json({ uploadURL: `${req.protocol}://${req.get("host")}/api/storage/uploads/${id}`, objectPath: `private/uploads/${user.id}/${id}` }); });
  app.put("/api/storage/uploads/:id", express.raw({ type: () => true, limit: "10mb" }), async (req, res) => { const user = currentUser(req); const token = uploadTokens.get(req.params.id); if (!user || !token || token.userId !== user.id) return sendError(res, 403, "رابط الرفع غير صالح"); try { const saved = await storagePut(`private/uploads/${user.id}/${req.params.id}-${token.name}`, req.body as Buffer, String(req.headers["content-type"] ?? "application/octet-stream")); token.objectPath = saved.key; res.status(200).json({ success: true }); } catch (error) { sendError(res, 500, error instanceof Error ? error.message : "تعذر حفظ الملف"); } });
  app.get("/api/admin/subscription-payments", (req, res) => { if (!requireAdmin(req, res)) return; res.json(Array.from(subscriptionPayments.values()).flat()); });
  app.get("/api/admin/payment-wallets", (req, res) => { if (!requireAdmin(req, res)) return; res.json(walletSettings); });
  app.patch("/api/admin/payment-wallets/:wallet", (req, res) => { if (!requireAdmin(req, res)) return; const wallet = walletSettings.find((item) => item.wallet === req.params.wallet); if (!wallet) return sendError(res, 404, "المحفظة غير موجودة"); Object.assign(wallet, { merchantName: String(req.body?.merchantName ?? wallet.merchantName), merchantAccount: String(req.body?.merchantAccount ?? ""), instructions: String(req.body?.instructions ?? wallet.instructions), isActive: Boolean(req.body?.isActive) }); res.json(wallet); });
  app.patch("/api/admin/subscription-payments/:id/review", (req, res) => { if (!requireAdmin(req, res)) return; const payment = Array.from(subscriptionPayments.values()).flat().find((item) => item.id === Number(req.params.id)); if (!payment) return sendError(res, 404, "عملية الدفع غير موجودة"); payment.status = req.body?.status === "approved" ? "approved" : "rejected"; payment.adminNote = req.body?.adminNote ?? null; payment.reviewedAt = new Date().toISOString(); const userId = Array.from(subscriptionPayments.entries()).find(([, items]) => items.includes(payment))?.[0]; if (userId) { const sub = ensureSubscription(userId); sub.status = payment.status === "approved" ? "active" : "cancelled"; sub.plan = payment.plan; sub.startsAt = sub.startsAt ?? new Date().toISOString(); addNotification(userId, payment.status === "approved" ? "تم تفعيل اشتراكك" : "تم رفض طلب الاشتراك", payment.status === "approved" ? "أصبح ملفك مؤهلاً للظهور بعد التوثيق." : payment.adminNote ?? "راجع بيانات التحويل وأعد الإرسال."); } res.json(payment); });
  app.patch("/api/admin/advertisements/:id/review", (req, res) => { if (!requireAdmin(req, res)) return; const ad = Array.from(advertisements.values()).flat().find((item) => item.id === Number(req.params.id)); if (!ad) return sendError(res, 404, "الإعلان غير موجود"); ad.status = req.body?.status === "active" ? "active" : "rejected"; ad.reviewNote = req.body?.reviewNote ?? null; ad.startsAt = ad.status === "active" ? new Date().toISOString() : null; ad.endsAt = ad.status === "active" ? new Date(Date.now() + Number(ad.durationDays) * 86400000).toISOString() : null; res.json(ad); });
  app.get("/api/providers/me/business", (req, res) => { const user = requireProvider(req, res); if (!user) return; const subscription = ensureSubscription(user.id); res.json({ subscription, metrics: { profileViews: 0, callClicks: 0, whatsappClicks: 0, serviceRequests: 0 }, freeSlotsRemaining: Math.max(0, 250 - freeProviderSlotsUsed) }); });
  app.get("/api/providers/me/payments", (req, res) => { const user = requireProvider(req, res); if (!user) return; res.json(subscriptionPayments.get(user.id) ?? []); });
  app.post("/api/providers/me/payments", (req, res) => { const user = requireProvider(req, res); if (!user) return; const { plan, wallet, transactionReference, receiptUrl } = req.body ?? {}; if (!["monthly", "yearly"].includes(plan) || !walletSettings.some((item) => item.wallet === wallet) || String(transactionReference ?? "").trim().length < 3) return sendError(res, 400, "بيانات الاشتراك غير مكتملة"); const payment = { id: nextBusinessId++, providerId: providerFor(user).id, plan, wallet, transactionReference: String(transactionReference).trim(), receiptUrl: receiptUrl ?? null, status: "pending", adminNote: null, createdAt: new Date().toISOString(), reviewedAt: null }; const items = subscriptionPayments.get(user.id) ?? []; items.unshift(payment); subscriptionPayments.set(user.id, items); const sub = ensureSubscription(user.id); sub.plan = plan; sub.status = "pending"; res.status(201).json(payment); });
  app.get("/api/providers/me/advertisements", (req, res) => { const user = requireProvider(req, res); if (!user) return; res.json(advertisements.get(user.id) ?? []); });
  app.post("/api/advertisements", (req, res) => { const user = requireProvider(req, res); if (!user) return; if (!isEligibleProvider(providerFor(user))) return sendError(res, 403, "يجب أن يكون ملفك موثقاً ولديك اشتراك فعال قبل إنشاء إعلان"); const body = req.body ?? {}; if (!String(body.title ?? "").trim() || !Number(body.budget) || Number(body.budget) <= 0) return sendError(res, 400, "بيانات الإعلان غير مكتملة"); const provider = providerFor(user); const ad = { id: nextAdId++, providerId: provider.id, providerName: provider.name, categoryName: provider.categoryName, title: String(body.title).trim(), description: String(body.description ?? "").trim(), city: String(body.city ?? provider.city), district: String(body.district ?? provider.district), targetAudience: body.targetAudience ?? null, categoryId: body.categoryId ?? provider.categoryId, plan: body.plan ?? "standard", durationDays: Number(body.durationDays ?? 7), budget: Number(body.budget), imageUrl: body.imageUrl ?? null, status: "pending", reviewNote: null, startsAt: null, endsAt: null, createdAt: new Date().toISOString() }; const items = advertisements.get(user.id) ?? []; items.unshift(ad); advertisements.set(user.id, items); res.status(201).json(ad); });
  app.get("/api/ads/featured", (_req, res) => res.json(Array.from(advertisements.values()).flat().filter((ad) => ad.status === "active" && isEligibleProvider(providers.find((item) => item.id === ad.providerId) ?? { userId: -1 } as Provider))));
  app.get("/api/providers/me/portfolio", (req, res) => { const user = requireProvider(req, res); if (!user) return; res.json(portfolios.get(user.id) ?? []); });
  app.post("/api/providers/me/portfolio", (req, res) => { const user = requireProvider(req, res); if (!user) return; const provider = providerFor(user); if (!isEligibleProvider(provider)) return sendError(res, 403, "يجب توثيق الملف وتفعيل الاشتراك قبل نشر الأعمال"); const body = req.body ?? {}; if (!String(body.imageUrl ?? "").trim()) return sendError(res, 400, "صورة العمل مطلوبة"); const item = { id: nextPortfolioId++, providerId: provider.id, imageUrl: String(body.imageUrl), description: body.description ?? null, createdAt: new Date().toISOString() }; const items = portfolios.get(user.id) ?? []; items.unshift(item); portfolios.set(user.id, items); res.status(201).json(item); });
  app.get("/api/providers/:id/portfolio", (req, res) => { const provider = [...providers, ...Array.from(providerProfiles.values())].find((item) => item.id === Number(req.params.id)); if (!provider || !isEligibleProvider(provider)) return res.json([]); res.json(portfolios.get(provider.userId) ?? []); });
  app.post("/api/providers/:id/portfolio", (req, res) => { const user = currentUser(req); if (!user) return sendError(res, 401, "يجب تسجيل الدخول أولاً"); const provider = providerFor(user); if (provider.id !== Number(req.params.id) || !isEligibleProvider(provider)) return sendError(res, 403, "يجب توثيق الملف وتفعيل الاشتراك أولاً"); const body = req.body ?? {}; if (!String(body.imageUrl ?? "").trim()) return sendError(res, 400, "صورة العمل مطلوبة"); const item = { id: nextPortfolioId++, providerId: provider.id, imageUrl: String(body.imageUrl), description: body.description ?? null, createdAt: new Date().toISOString() }; const items = portfolios.get(user.id) ?? []; items.unshift(item); portfolios.set(user.id, items); res.status(201).json(item); });
  app.get("/api/providers/me", (req, res) => { const user = requireProvider(req, res); if (!user) return; const provider = providerFor(user); const verification = identitySubmissions.get(user.id); res.json({ ...provider, verificationStatus: verification?.status ?? "draft", identityDocumentsUploaded: { front: Boolean(verification?.frontKey), back: Boolean(verification?.backKey) }, rejectionReason: verification?.rejectionReason ?? null }); });
  app.patch("/api/providers/me", (req, res) => { const user = requireProvider(req, res); if (!user) return; const provider = providerFor(user); const body = req.body ?? {}; const category = categories.find((item) => item.id === Number(body.categoryId)); Object.assign(provider, { name: body.name?.trim() || provider.name, categoryId: category?.id ?? provider.categoryId, categoryName: category?.name ?? provider.categoryName, categoryIcon: category?.icon ?? provider.categoryIcon, city: body.city?.trim() || provider.city, district: body.district?.trim() || provider.district, bio: body.bio?.trim() ?? provider.bio, yearsExperience: body.yearsExperience == null ? provider.yearsExperience : Number(body.yearsExperience), hourlyRate: body.hourlyRate == null ? provider.hourlyRate : Number(body.hourlyRate), whatsapp: body.whatsapp?.trim() || provider.whatsapp }); res.json(providerForClient(provider)); });
  app.get("/api/providers/me/verification", (req, res) => { const user = requireProvider(req, res); if (!user) return; const verification = identitySubmissions.get(user.id); res.json({ status: verification?.status ?? "draft", frontUploaded: Boolean(verification?.frontKey), backUploaded: Boolean(verification?.backKey), submittedAt: verification?.submittedAt ?? null, rejectionReason: verification?.rejectionReason ?? null }); });
  app.post("/api/providers/me/identity/:side", express.raw({ type: () => true, limit: "8mb" }), async (req, res) => { const user = requireProvider(req, res); if (!user) return; const side = req.params.side; const contentType = String(req.headers["content-type"] ?? ""); const body = req.body as Buffer; if (side !== "front" && side !== "back") return sendError(res, 400, "جهة الهوية غير صحيحة"); if (!contentType.match(/^image\/(jpeg|png|webp)$/i)) return sendError(res, 400, "ارفع صورة JPG أو PNG أو WEBP فقط"); if (!Buffer.isBuffer(body) || body.length < 100 || body.length > 8 * 1024 * 1024) return sendError(res, 400, "حجم صورة الهوية غير صالح"); try { const upload = await storagePut(`private/identity/${user.id}/${side}-${Date.now()}.bin`, body, contentType); const current = identitySubmissions.get(user.id) ?? { status: "draft" as VerificationStatus }; current[`${side}Key` as "frontKey" | "backKey"] = upload.key; current.status = current.status === "approved" ? "draft" : current.status; identitySubmissions.set(user.id, current); res.json({ success: true, side, uploaded: true }); } catch (error) { sendError(res, 500, error instanceof Error ? error.message : "تعذر حفظ وثيقة الهوية"); } });
  app.post("/api/providers/me/verification/submit", (req, res) => { const user = requireProvider(req, res); if (!user) return; const provider = providerFor(user); const verification = identitySubmissions.get(user.id) ?? { status: "draft" as VerificationStatus }; const missing: string[] = []; if (!provider.name.trim()) missing.push("اسم الملف"); if (!provider.city.trim()) missing.push("المدينة"); if (!provider.bio.trim()) missing.push("نبذة الخدمة"); if (!provider.categoryId) missing.push("مجال الخدمة"); if (!verification?.frontKey) missing.push("الوجه الأمامي للهوية"); if (!verification?.backKey) missing.push("الوجه الخلفي للهوية"); if (missing.length) return res.status(400).json({ error: `أكمل المتطلبات التالية: ${missing.join("، ")}` }); verification.status = "submitted"; verification.submittedAt = new Date().toISOString(); identitySubmissions.set(user.id, verification); addNotification(user.id, "تم استلام ملفك للمراجعة", "وصل ملفك ووثائقك إلى فريق فزعة، وسنخبرك عند صدور القرار."); res.json({ success: true, status: verification.status, message: "تم إرسال ملفك للمراجعة" }); });

  app.get("/api/providers", (req, res) => { const search = String(req.query.search ?? "").trim().toLowerCase(); const categoryId = Number(req.query.categoryId ?? 0); const filtered = publicProviders().filter((provider) => { const matchesSearch = !search || `${provider.name} ${provider.categoryName} ${provider.bio}`.toLowerCase().includes(search); return matchesSearch && (!categoryId || provider.categoryId === categoryId); }); res.json({ providers: filtered, total: filtered.length, page: 1, pageSize: filtered.length }); });
  app.get("/api/providers/top-rated", (_req, res) => res.json(publicProviders().slice().sort((a, b) => b.rating - a.rating)));
  app.get("/api/providers/most-requested", (_req, res) => res.json(publicProviders()));
  app.get("/api/providers/nearby", (_req, res) => res.json(publicProviders()));
  app.get("/api/providers/:id", (req, res) => { const provider = [...providers, ...Array.from(providerProfiles.values())].find((item) => item.id === Number(req.params.id)); if (!provider || !isEligibleProvider(provider)) return sendError(res, 404, "المهني غير متاح حالياً"); res.json(providerForClient(provider)); });
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

  app.get("/api/notifications", (req, res) => { const user = currentUser(req); if (!user) return sendError(res, 401, "يجب تسجيل الدخول أولاً"); res.json(notificationsByUser.get(user.id) ?? []); });
  app.patch("/api/notifications", (req, res) => { const user = currentUser(req); if (!user) return sendError(res, 401, "يجب تسجيل الدخول أولاً"); const items = notificationsByUser.get(user.id) ?? []; items.forEach((item) => { item.isRead = true; }); notificationsByUser.set(user.id, items); res.json({ success: true }); });
  app.get("/api/requests", (_req, res) => res.json([])); app.get("/api/favorites", (_req, res) => res.json([])); app.get("/api/conversations", (_req, res) => res.json([]));
}
