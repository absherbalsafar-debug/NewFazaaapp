import { Router, type IRouter } from "express";
import { db, reviewsTable, usersTable, providersTable, serviceRequestsTable } from "@workspace/db";
import { eq, avg, count, desc, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { CreateReviewBody, GetProviderReviewsParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/providers/:id/reviews", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const reviews = await db
    .select({ r: reviewsTable, u: usersTable })
    .from(reviewsTable)
    .innerJoin(usersTable, eq(reviewsTable.clientId, usersTable.id))
    .where(eq(reviewsTable.providerId, id))
    .orderBy(desc(reviewsTable.createdAt));

  res.json(reviews.map(({ r, u }) => ({
    id: r.id,
    clientId: r.clientId,
    clientName: u.name,
    clientAvatarUrl: u.avatarUrl ?? null,
    providerId: r.providerId,
    requestId: r.requestId ?? null,
    rating: r.rating,
    quality: r.quality,
    punctuality: r.punctuality,
    professionalism: r.professionalism,
    communication: r.communication,
    priceFairness: r.priceFairness,
    comment: r.comment ?? null,
    createdAt: r.createdAt.toISOString(),
  })));
});

router.post("/reviews", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const score = (key: string) => {
    const value = Number(req.body?.[key] ?? parsed.data.rating);
    return Number.isInteger(value) && value >= 1 && value <= 5 ? value : null;
  };
  const quality = score("quality");
  const punctuality = score("punctuality");
  const professionalism = score("professionalism");
  const communication = score("communication");
  const priceFairness = score("priceFairness");
  if ([quality, punctuality, professionalism, communication, priceFairness].some((value) => value == null)) {
    res.status(400).json({ error: "يجب تقييم الجودة والالتزام والاحترافية والتعامل والسعر من 1 إلى 5" });
    return;
  }

  const [request] = await db
    .select()
    .from(serviceRequestsTable)
    .where(and(
      eq(serviceRequestsTable.id, parsed.data.requestId),
      eq(serviceRequestsTable.clientId, req.userId!),
      eq(serviceRequestsTable.providerId, parsed.data.providerId),
      eq(serviceRequestsTable.status, "completed"),
    ));
  if (!request) {
    res.status(400).json({ error: "يمكن التقييم بعد اكتمال طلب خدمة تابع لك فقط" });
    return;
  }
  const [existingReview] = await db
    .select({ id: reviewsTable.id })
    .from(reviewsTable)
    .where(and(eq(reviewsTable.requestId, parsed.data.requestId), eq(reviewsTable.clientId, req.userId!)));
  if (existingReview) {
    res.status(409).json({ error: "تم تقييم هذا الطلب مسبقاً" });
    return;
  }

  const [review] = await db.insert(reviewsTable).values({
    clientId: req.userId!,
    providerId: parsed.data.providerId,
    requestId: parsed.data.requestId ?? null,
    rating: parsed.data.rating,
    quality: quality!,
    punctuality: punctuality!,
    professionalism: professionalism!,
    communication: communication!,
    priceFairness: priceFairness!,
    comment: parsed.data.comment ?? null,
  }).returning();

  // Recalculate provider rating
  const [stats] = await db
    .select({ avgRating: avg(reviewsTable.rating), cnt: count(reviewsTable.id) })
    .from(reviewsTable)
    .where(eq(reviewsTable.providerId, parsed.data.providerId));

  await db
    .update(providersTable)
    .set({
      rating: stats.avgRating ? String(parseFloat(String(stats.avgRating)).toFixed(2)) : "0",
      reviewCount: Number(stats.cnt),
    })
    .where(eq(providersTable.id, parsed.data.providerId));

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));

  res.status(201).json({
    id: review.id,
    clientId: review.clientId,
    clientName: user?.name ?? "",
    clientAvatarUrl: user?.avatarUrl ?? null,
    providerId: review.providerId,
    requestId: review.requestId ?? null,
    rating: review.rating,
    quality: review.quality,
    punctuality: review.punctuality,
    professionalism: review.professionalism,
    communication: review.communication,
    priceFairness: review.priceFairness,
    comment: review.comment ?? null,
    createdAt: review.createdAt.toISOString(),
  });
});

export default router;
