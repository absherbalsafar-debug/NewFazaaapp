import { Router, type IRouter } from "express";
import { and, desc, eq, gt, isNull, or, sql } from "drizzle-orm";
import {
  advertisementsTable,
  categoriesTable,
  db,
  providersTable,
  usersTable,
  advertisementMetricsTable,
} from "@workspace/db";
import { CreateAdvertisementBody } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { ensureProviderSubscription } from "./subscriptions";

const router: IRouter = Router();

const packageDurations = {
  standard: 7,
  featured: 14,
  homepage: 30,
  vip: 60,
} as const;

function serializeAd(row: { a: typeof advertisementsTable.$inferSelect; p?: typeof providersTable.$inferSelect; u?: typeof usersTable.$inferSelect; c?: typeof categoriesTable.$inferSelect | null; m?: typeof advertisementMetricsTable.$inferSelect | null }) {
  return {
    id: row.a.id,
    providerId: row.a.providerId,
    providerName: row.u?.name ?? null,
    providerPhone: row.u?.phone ?? null,
    categoryName: row.c?.name ?? null,
    title: row.a.title,
    description: row.a.description,
    city: row.a.city,
    district: row.a.district,
    targetAudience: row.a.targetAudience ?? null,
    plan: row.a.plan,
    durationDays: row.a.durationDays,
    budget: Number(row.a.budget),
    imageUrl: row.a.imageUrl ?? null,
    impressionsPurchased: row.a.impressionsPurchased,
    metrics: { impressions: row.m?.impressions ?? 0, clicks: row.m?.clicks ?? 0, callClicks: row.m?.callClicks ?? 0, whatsappClicks: row.m?.whatsappClicks ?? 0 },
    status: row.a.status,
    reviewNote: row.a.reviewNote ?? null,
    startsAt: row.a.startsAt?.toISOString() ?? null,
    endsAt: row.a.endsAt?.toISOString() ?? null,
    createdAt: row.a.createdAt.toISOString(),
  };
}

async function providerForUser(userId: number) {
  const [provider] = await db.select().from(providersTable).where(eq(providersTable.userId, userId));
  return provider;
}

router.get("/ads/featured", async (req, res): Promise<void> => {
  const now = new Date();
  const categoryId = Number(req.query.categoryId);
  const rows = await db
    .select({ a: advertisementsTable, p: providersTable, u: usersTable, c: categoriesTable, m: advertisementMetricsTable })
    .from(advertisementsTable)
    .innerJoin(providersTable, eq(advertisementsTable.providerId, providersTable.id))
    .innerJoin(usersTable, eq(providersTable.userId, usersTable.id))
    .leftJoin(categoriesTable, eq(advertisementsTable.categoryId, categoriesTable.id))
    .leftJoin(advertisementMetricsTable, eq(advertisementsTable.id, advertisementMetricsTable.advertisementId))
    .where(and(eq(advertisementsTable.status, "active"), or(isNull(advertisementsTable.endsAt), gt(advertisementsTable.endsAt, now)), Number.isInteger(categoryId) && categoryId > 0 ? eq(advertisementsTable.categoryId, categoryId) : undefined))
    .orderBy(sql`case when ${advertisementsTable.plan} = 'vip' then 4 when ${advertisementsTable.plan} = 'homepage' then 3 when ${advertisementsTable.plan} = 'featured' then 2 else 1 end desc`, desc(advertisementsTable.durationDays), desc(advertisementsTable.impressionsPurchased), desc(advertisementsTable.createdAt))
    .limit(12);
  res.json(rows.map(serializeAd));
});

router.get("/ads/mine", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  if (req.userRole !== "provider") {
    res.status(403).json({ error: "هذا المسار للمهنيين فقط" });
    return;
  }
  const provider = await providerForUser(req.userId!);
  if (!provider) {
    res.status(404).json({ error: "لم يتم إنشاء ملف مهني بعد" });
    return;
  }
  const rows = await db
    .select({ a: advertisementsTable, p: providersTable, u: usersTable, c: categoriesTable, m: advertisementMetricsTable })
    .from(advertisementsTable)
    .innerJoin(providersTable, eq(advertisementsTable.providerId, providersTable.id))
    .innerJoin(usersTable, eq(providersTable.userId, usersTable.id))
    .leftJoin(categoriesTable, eq(advertisementsTable.categoryId, categoriesTable.id))
    .leftJoin(advertisementMetricsTable, eq(advertisementsTable.id, advertisementMetricsTable.advertisementId))
    .where(eq(advertisementsTable.providerId, provider.id))
    .orderBy(desc(advertisementsTable.createdAt));
  res.json(rows.map(serializeAd));
});

router.post("/ads", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  if (req.userRole !== "provider") {
    res.status(403).json({ error: "الإعلانات متاحة للمهنيين فقط" });
    return;
  }
  const parsed = CreateAdvertisementBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const provider = await providerForUser(req.userId!);
  if (!provider) {
    res.status(404).json({ error: "لم يتم إنشاء ملف مهني بعد" });
    return;
  }
  const subscription = await ensureProviderSubscription(provider.id);
  if (subscription.status !== "active") {
    res.status(402).json({ error: "فعّل اشتراكك قبل إنشاء إعلان" });
    return;
  }

  const data = parsed.data;
  if (data.budget <= 0) {
    res.status(400).json({ error: "يجب أن يكون مبلغ الإعلان أكبر من صفر" });
    return;
  }
  if (data.durationDays !== packageDurations[data.plan]) {
    res.status(400).json({ error: "مدة الإعلان لا تطابق الباقة المختارة" });
    return;
  }
  const [ad] = await db
    .insert(advertisementsTable)
    .values({
      providerId: provider.id,
      categoryId: data.categoryId ?? provider.categoryId,
      title: data.title.trim(),
      description: data.description?.trim() ?? "",
      city: data.city.trim(),
      district: data.district?.trim() ?? "",
      targetAudience: data.targetAudience?.trim() || null,
      plan: data.plan,
      durationDays: data.durationDays,
      budget: String(data.budget),
      imageUrl: data.imageUrl ?? null,
      status: "pending",
    })
    .returning();
  await db.insert(advertisementMetricsTable).values({ advertisementId: ad.id }).onConflictDoNothing();
  const [row] = await db
    .select({ a: advertisementsTable, p: providersTable, u: usersTable, c: categoriesTable, m: advertisementMetricsTable })
    .from(advertisementsTable)
    .innerJoin(providersTable, eq(advertisementsTable.providerId, providersTable.id))
    .innerJoin(usersTable, eq(providersTable.userId, usersTable.id))
    .leftJoin(categoriesTable, eq(advertisementsTable.categoryId, categoriesTable.id))
    .leftJoin(advertisementMetricsTable, eq(advertisementsTable.id, advertisementMetricsTable.advertisementId))
    .where(eq(advertisementsTable.id, ad.id));
  res.status(201).json(serializeAd(row));
});

router.post("/ads/:id/track", async (req, res): Promise<void> => {
  const id = Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const event = req.body?.event;
  if (!Number.isInteger(id) || !["impression", "click", "call", "whatsapp"].includes(event)) { res.status(400).json({ error: "حدث إعلاني غير صالح" }); return; }
  const [existing] = await db.select().from(advertisementMetricsTable).where(eq(advertisementMetricsTable.advertisementId, id));
  if (!existing) await db.insert(advertisementMetricsTable).values({ advertisementId: id });
  const field = event === "impression" ? advertisementMetricsTable.impressions : event === "click" ? advertisementMetricsTable.clicks : event === "call" ? advertisementMetricsTable.callClicks : advertisementMetricsTable.whatsappClicks;
  await db.update(advertisementMetricsTable).set({ [field.name]: sql`${field} + 1`, updatedAt: new Date() }).where(eq(advertisementMetricsTable.advertisementId, id));
  res.status(204).end();
});

export default router;
