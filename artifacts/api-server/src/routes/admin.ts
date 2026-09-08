import { Router, type IRouter } from "express";
import {
  db,
  usersTable,
  providersTable,
  categoriesTable,
  serviceRequestsTable,
  reviewsTable,
  subscriptionPaymentsTable,
  providerSubscriptionsTable,
  advertisementsTable,
} from "@workspace/db";
import { eq, and, count, ilike, desc, or, gte } from "drizzle-orm";
import { requireAuth, requireAdmin, type AuthRequest } from "../middlewares/auth";
import {
  ListAdminUsersQueryParams,
  UpdateUserStatusBody,
  UpdateUserStatusParams,
  VerifyProviderBody,
  VerifyProviderParams,
  ReviewSubscriptionPaymentBody,
  ReviewAdvertisementBody,
} from "@workspace/api-zod";
import { serializePayment } from "./subscriptions";

const router: IRouter = Router();

router.get("/admin/stats", requireAuth, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const [totalUsers] = await db.select({ cnt: count(usersTable.id) }).from(usersTable);
  const [totalProviders] = await db.select({ cnt: count(usersTable.id) }).from(usersTable).where(eq(usersTable.role, "provider"));
  const [totalClients] = await db.select({ cnt: count(usersTable.id) }).from(usersTable).where(eq(usersTable.role, "client"));
  const [totalRequests] = await db.select({ cnt: count(serviceRequestsTable.id) }).from(serviceRequestsTable);
  const [completedRequests] = await db.select({ cnt: count(serviceRequestsTable.id) }).from(serviceRequestsTable).where(eq(serviceRequestsTable.status, "completed"));
  const [pendingProviders] = await db.select({ cnt: count(providersTable.id) }).from(providersTable).where(eq(providersTable.isVerified, false));

  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);
  const [weekRequests] = await db.select({ cnt: count(serviceRequestsTable.id) }).from(serviceRequestsTable).where(gte(serviceRequestsTable.createdAt, weekAgo));
  const [monthRequests] = await db.select({ cnt: count(serviceRequestsTable.id) }).from(serviceRequestsTable).where(gte(serviceRequestsTable.createdAt, monthAgo));

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [activeToday] = await db.select({ cnt: count(serviceRequestsTable.id) }).from(serviceRequestsTable).where(gte(serviceRequestsTable.createdAt, today));

  res.json({
    totalUsers: Number(totalUsers?.cnt ?? 0),
    totalProviders: Number(totalProviders?.cnt ?? 0),
    totalClients: Number(totalClients?.cnt ?? 0),
    totalRequests: Number(totalRequests?.cnt ?? 0),
    completedRequests: Number(completedRequests?.cnt ?? 0),
    pendingProviders: Number(pendingProviders?.cnt ?? 0),
    activeToday: Number(activeToday?.cnt ?? 0),
    requestsThisWeek: Number(weekRequests?.cnt ?? 0),
    requestsThisMonth: Number(monthRequests?.cnt ?? 0),
  });
});

router.get("/admin/users", requireAuth, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const params = ListAdminUsersQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const { role, status, search, page = 1 } = params.data;
  const limit = 20;
  const offset = ((page ?? 1) - 1) * limit;

  const conditions: any[] = [];
  if (role) conditions.push(eq(usersTable.role, role as any));
  if (status) conditions.push(eq(usersTable.status, status as any));
  if (search) conditions.push(or(ilike(usersTable.name, `%${search}%`), ilike(usersTable.phone, `%${search}%`)));

  const rows = await db
    .select()
    .from(usersTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(usersTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [totalRow] = await db
    .select({ cnt: count(usersTable.id) })
    .from(usersTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const result = await Promise.all(rows.map(async (u) => {
    let categoryName: string | null = null;
    let city: string | null = null;
    let rating: number | null = null;
    let completedJobs: number | null = null;
    let isVerified: boolean | null = null;

    if (u.role === "provider") {
      const [p] = await db
        .select({ p: providersTable, c: categoriesTable })
        .from(providersTable)
        .innerJoin(categoriesTable, eq(providersTable.categoryId, categoriesTable.id))
        .where(eq(providersTable.userId, u.id));
      if (p) {
        categoryName = p.c.name;
        city = p.p.city;
        rating = parseFloat(p.p.rating ?? "0");
        completedJobs = p.p.completedJobs;
        isVerified = p.p.isVerified;
      }
    }

    return {
      id: u.id,
      name: u.name,
      phone: u.phone,
      role: u.role,
      status: u.status,
      avatarUrl: u.avatarUrl ?? null,
      categoryName,
      city,
      rating,
      completedJobs,
      isVerified,
      createdAt: u.createdAt.toISOString(),
    };
  }));

  res.json({ users: result, total: Number(totalRow?.cnt ?? 0), page: page ?? 1 });
});

router.patch("/admin/users/:id/status", requireAuth, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateUserStatusBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  await db.update(usersTable).set({ status: parsed.data.status as any }).where(eq(usersTable.id, id));
  res.json({ success: true, message: null });
});

router.patch("/admin/providers/:id/verify", requireAuth, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = VerifyProviderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  await db.update(providersTable).set({ isVerified: parsed.data.isVerified }).where(eq(providersTable.id, id));
  res.json({ success: true, message: null });
});

router.get("/admin/service-stats", requireAuth, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const cats = await db.select().from(categoriesTable);
  const result = await Promise.all(cats.map(async (cat) => {
    const [provCount] = await db.select({ cnt: count(providersTable.id) }).from(providersTable).where(eq(providersTable.categoryId, cat.id));
    const [reqCount] = await db
      .select({ cnt: count(serviceRequestsTable.id) })
      .from(serviceRequestsTable)
      .innerJoin(providersTable, eq(serviceRequestsTable.providerId, providersTable.id))
      .where(eq(providersTable.categoryId, cat.id));
    return {
      categoryName: cat.name,
      icon: cat.icon,
      providerCount: Number(provCount?.cnt ?? 0),
      requestCount: Number(reqCount?.cnt ?? 0),
    };
  }));
  res.json(result);
});

router.get("/admin/subscription-payments", requireAuth, requireAdmin, async (_req: AuthRequest, res): Promise<void> => {
  const payments = await db
    .select()
    .from(subscriptionPaymentsTable)
    .orderBy(desc(subscriptionPaymentsTable.createdAt));
  res.json(payments.map(serializePayment));
});

router.patch("/admin/subscription-payments/:id/review", requireAuth, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const id = Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  if (!Number.isInteger(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = ReviewSubscriptionPaymentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [payment] = await db.select().from(subscriptionPaymentsTable).where(eq(subscriptionPaymentsTable.id, id));
  if (!payment) { res.status(404).json({ error: "Payment not found" }); return; }
  if (payment.status !== "pending") { res.status(409).json({ error: "تمت مراجعة هذه العملية مسبقاً" }); return; }

  const now = new Date();
  await db.update(subscriptionPaymentsTable).set({
    status: parsed.data.status,
    adminNote: parsed.data.adminNote ?? null,
    reviewedBy: req.userId!,
    reviewedAt: now,
  }).where(eq(subscriptionPaymentsTable.id, id));

  if (payment.subscriptionId) {
    if (parsed.data.status === "approved") {
      const ends = new Date(now);
      ends.setMonth(ends.getMonth() + (payment.plan === "yearly" ? 12 : 1));
      await db.update(providerSubscriptionsTable).set({
        status: "active",
        startsAt: now,
        endsAt: ends.toISOString().slice(0, 10),
      }).where(eq(providerSubscriptionsTable.id, payment.subscriptionId));
    } else {
      await db.update(providerSubscriptionsTable).set({ status: "cancelled" }).where(eq(providerSubscriptionsTable.id, payment.subscriptionId));
    }
  }

  const [updated] = await db.select().from(subscriptionPaymentsTable).where(eq(subscriptionPaymentsTable.id, id));
  res.json(serializePayment(updated));
});

router.patch("/admin/advertisements/:id/review", requireAuth, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const id = Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  if (!Number.isInteger(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = ReviewAdvertisementBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [ad] = await db.select().from(advertisementsTable).where(eq(advertisementsTable.id, id));
  if (!ad) { res.status(404).json({ error: "Advertisement not found" }); return; }
  const now = new Date();
  const ends = new Date(now);
  ends.setDate(ends.getDate() + ad.durationDays);
  await db.update(advertisementsTable).set({
    status: parsed.data.status,
    reviewNote: parsed.data.reviewNote ?? null,
    startsAt: parsed.data.status === "active" ? now : null,
    endsAt: parsed.data.status === "active" ? ends : null,
  }).where(eq(advertisementsTable.id, id));

  const [updated] = await db.select().from(advertisementsTable).where(eq(advertisementsTable.id, id));
  res.json({
    id: updated.id,
    providerId: updated.providerId,
    title: updated.title,
    description: updated.description,
    city: updated.city,
    district: updated.district,
    targetAudience: updated.targetAudience ?? null,
    plan: updated.plan,
    durationDays: updated.durationDays,
    budget: Number(updated.budget),
    imageUrl: updated.imageUrl ?? null,
    status: updated.status,
    reviewNote: updated.reviewNote ?? null,
    startsAt: updated.startsAt?.toISOString() ?? null,
    endsAt: updated.endsAt?.toISOString() ?? null,
    createdAt: updated.createdAt.toISOString(),
    providerName: null,
    categoryName: null,
  });
});

export default router;
