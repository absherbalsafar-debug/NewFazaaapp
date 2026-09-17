import { Router, type IRouter } from "express";
import { asc, and, eq } from "drizzle-orm";
import { db, commercialPlansTable } from "@workspace/db";
import { requireAdmin, requireAuth, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

const defaults = [
  ["monthly", "subscription", "اشتراك شهري", "ظهور أفضل وأدوات متابعة الأداء", 15, 30, ["أولوية في النتائج", "صور أعمال أكثر", "إحصائيات الملف", "شارة مشترك"]],
  ["quarterly", "subscription", "اشتراك 3 أشهر", "ظهور أفضل لمدة ثلاثة أشهر", 40, 90, ["أولوية في النتائج", "صور أعمال أكثر", "إحصائيات الملف", "شارة مشترك"]],
  ["half_yearly", "subscription", "اشتراك 6 أشهر", "اشتراك نصف سنوي بظهور أعلى", 75, 180, ["كل مزايا الشهري", "أولوية أعلى", "شارة مشترك"]],
  ["yearly", "subscription", "اشتراك سنوي", "سعر أوفر مع ظهور أعلى طوال العام", 150, 365, ["كل مزايا الشهري", "سعر سنوي مخفض", "أولوية أعلى", "شارة مشترك سنوي"]],
  ["standard", "advertisement", "إعلان عادي", "ظهور أساسي داخل نتائج الفئة", 0, 7, ["ظهور داخل نتائج الفئة"]],
  ["featured", "advertisement", "إعلان مميز", "ترتيب أعلى وشارة إعلان ممول", 0, 14, ["ترتيب أعلى", "شارة إعلان ممول"]],
  ["homepage", "advertisement", "إعلان رئيسي", "ظهور أوسع في الصفحة الرئيسية والفئة", 0, 30, ["الصفحة الرئيسية", "أعلى نتائج الفئة", "شارة إعلان ممول"]],
  ["vip", "advertisement", "إعلان VIP", "ظهور أكبر وعدد مرات ظهور أعلى", 0, 60, ["أعلى الصفحة الرئيسية", "ظهور مضاعف", "أولوية قصوى", "شارة VIP"]],
] as const;

export async function ensureCommercialPlanDefaults() {
  const [existing] = await db.select({ id: commercialPlansTable.id }).from(commercialPlansTable).limit(1);
  if (existing) return;
  for (const [sortOrder, [code, kind, name, description, price, durationDays, benefits]] of defaults.entries()) {
    await db.insert(commercialPlansTable).values({ code, kind, name, description, price: String(price), durationDays, benefits: [...benefits], sortOrder });
  }
}

function serialize(row: typeof commercialPlansTable.$inferSelect) {
  return { ...row, price: Number(row.price), benefits: Array.isArray(row.benefits) ? row.benefits : [] };
}

router.get("/commercial-plans", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  if (req.userRole !== "provider" && req.userRole !== "admin") { res.status(403).json({ error: "الباقات متاحة للمهنيين والإدارة فقط" }); return; }
  await ensureCommercialPlanDefaults();
  const requestedKind = Array.isArray(req.query.kind) ? req.query.kind[0] : req.query.kind;
  const kind: "subscription" | "advertisement" | undefined = requestedKind === "subscription" || requestedKind === "advertisement" ? requestedKind : undefined;
  const rows = await db.select().from(commercialPlansTable).where(kind ? and(eq(commercialPlansTable.kind, kind), eq(commercialPlansTable.isActive, true)) : eq(commercialPlansTable.isActive, true)).orderBy(asc(commercialPlansTable.sortOrder), asc(commercialPlansTable.id));
  res.json(rows.map(serialize));
});

router.get("/admin/commercial-plans", requireAuth, requireAdmin, async (_req: AuthRequest, res): Promise<void> => {
  await ensureCommercialPlanDefaults();
  const rows = await db.select().from(commercialPlansTable).orderBy(asc(commercialPlansTable.kind), asc(commercialPlansTable.sortOrder), asc(commercialPlansTable.id));
  res.json(rows.map(serialize));
});

router.patch("/admin/commercial-plans/:id", requireAuth, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const id = Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const body = req.body ?? {};
  if (!Number.isInteger(id) || typeof body.name !== "string" || !body.name.trim()) { res.status(400).json({ error: "بيانات الباقة غير صالحة" }); return; }
  const benefits = Array.isArray(body.benefits) ? body.benefits.filter((item: unknown): item is string => typeof item === "string" && item.trim().length > 0).map((item: string) => item.trim()) : [];
  const [row] = await db.update(commercialPlansTable).set({ name: body.name.trim(), description: typeof body.description === "string" ? body.description.trim() : "", price: String(Math.max(0, Number(body.price) || 0)), durationDays: Math.max(1, Number(body.durationDays) || 30), benefits, isActive: body.isActive !== false, sortOrder: Number.isInteger(Number(body.sortOrder)) ? Number(body.sortOrder) : 0, updatedAt: new Date() }).where(eq(commercialPlansTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "الباقة غير موجودة" }); return; }
  res.json(serialize(row));
});

export default router;
