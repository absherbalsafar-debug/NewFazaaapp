import { Router, type IRouter } from "express";
import { and, desc, eq, gt, isNull, or } from "drizzle-orm";
import {
  advertisementsTable,
  categoriesTable,
  db,
  providersTable,
  usersTable,
} from "@workspace/db";
import { CreateAdvertisementBody } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { ensureProviderSubscription } from "./subscriptions";

const router: IRouter = Router();

function serializeAd(row: { a: typeof advertisementsTable.$inferSelect; p?: typeof providersTable.$inferSelect; u?: typeof usersTable.$inferSelect; c?: typeof categoriesTable.$inferSelect | null }) {
  return {
    id: row.a.id,
    providerId: row.a.providerId,
    providerName: row.u?.name ?? null,
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

router.get("/ads/featured", async (_req, res): Promise<void> => {
  const now = new Date();
  const rows = await db
    .select({ a: advertisementsTable, p: providersTable, u: usersTable, c: categoriesTable })
    .from(advertisementsTable)
    .innerJoin(providersTable, eq(advertisementsTable.providerId, providersTable.id))
    .innerJoin(usersTable, eq(providersTable.userId, usersTable.id))
    .leftJoin(categoriesTable, eq(advertisementsTable.categoryId, categoriesTable.id))
    .where(and(eq(advertisementsTable.status, "active"), or(isNull(advertisementsTable.endsAt), gt(advertisementsTable.endsAt, now))))
    .orderBy(desc(advertisementsTable.plan), desc(advertisementsTable.createdAt))
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
    .select({ a: advertisementsTable, p: providersTable, u: usersTable, c: categoriesTable })
    .from(advertisementsTable)
    .innerJoin(providersTable, eq(advertisementsTable.providerId, providersTable.id))
    .innerJoin(usersTable, eq(providersTable.userId, usersTable.id))
    .leftJoin(categoriesTable, eq(advertisementsTable.categoryId, categoriesTable.id))
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
  const [row] = await db
    .select({ a: advertisementsTable, p: providersTable, u: usersTable, c: categoriesTable })
    .from(advertisementsTable)
    .innerJoin(providersTable, eq(advertisementsTable.providerId, providersTable.id))
    .innerJoin(usersTable, eq(providersTable.userId, usersTable.id))
    .leftJoin(categoriesTable, eq(advertisementsTable.categoryId, categoriesTable.id))
    .where(eq(advertisementsTable.id, ad.id));
  res.status(201).json(serializeAd(row));
});

export default router;