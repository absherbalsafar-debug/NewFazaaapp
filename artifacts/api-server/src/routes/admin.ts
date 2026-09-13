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
  paymentWalletSettingsTable,
  providerMetricsTable,
  conversationsTable,
  messagesTable,
} from "@workspace/db";
import { eq, and, count, ilike, desc, or, gte, sql, inArray } from "drizzle-orm";
import { requireAuth, requireAdmin, type AuthRequest } from "../middlewares/auth";
import {
  ListAdminUsersQueryParams,
  UpdateUserStatusBody,
  UpdateUserStatusParams,
  VerifyProviderBody,
  VerifyProviderParams,
  ReviewSubscriptionPaymentBody,
  UpdatePaymentWalletBody,
  ReviewAdvertisementBody,
} from "@workspace/api-zod";
import { listWalletSettings, serializePayment, walletNames, subscriptionPlans } from "./subscriptions";

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

const analyticsRanges = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
} as const;

type AnalyticsRange = keyof typeof analyticsRanges;

function paymentAmount(plan: string): number {
  const selectedPlan = subscriptionPlans.find((item) => item.id === plan);
  if (!selectedPlan) return 0;
  return selectedPlan.id === "yearly" ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice;
}

function analyticsDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

router.get("/admin/analytics", requireAuth, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const requestedRange = typeof req.query.range === "string" ? req.query.range : "30d";
  const range: AnalyticsRange = requestedRange in analyticsRanges ? requestedRange as AnalyticsRange : "30d";
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - analyticsRanges[range] + 1);

  const [
    totalUsers,
    totalClients,
    totalProviders,
    activeProviders,
    verifiedProviders,
    pendingProviders,
    totalRequests,
    pendingRequests,
    completedRequests,
    metricTotals,
    paymentSummaryRows,
    paymentPlanRows,
    requestSeriesRows,
    messageSeriesRows,
    paymentSeriesRows,
    providerRows,
    recentPaymentRows,
  ] = await Promise.all([
    db.select({ cnt: count(usersTable.id) }).from(usersTable),
    db.select({ cnt: count(usersTable.id) }).from(usersTable).where(eq(usersTable.role, "client")),
    db.select({ cnt: count(providersTable.id) }).from(providersTable),
    db.select({ cnt: count(providersTable.id) }).from(providersTable).where(eq(providersTable.isAvailable, true)),
    db.select({ cnt: count(providersTable.id) }).from(providersTable).where(eq(providersTable.isVerified, true)),
    db.select({ cnt: count(providersTable.id) }).from(providersTable).where(eq(providersTable.isVerified, false)),
    db.select({ cnt: count(serviceRequestsTable.id) }).from(serviceRequestsTable),
    db.select({ cnt: count(serviceRequestsTable.id) }).from(serviceRequestsTable).where(eq(serviceRequestsTable.status, "pending")),
    db.select({ cnt: count(serviceRequestsTable.id) }).from(serviceRequestsTable).where(eq(serviceRequestsTable.status, "completed")),
    db.select({
      profileViews: sql<string>`coalesce(sum(${providerMetricsTable.profileViews}), 0)`,
      callClicks: sql<string>`coalesce(sum(${providerMetricsTable.callClicks}), 0)`,
      whatsappClicks: sql<string>`coalesce(sum(${providerMetricsTable.whatsappClicks}), 0)`,
    }).from(providerMetricsTable),
    db.select({ status: subscriptionPaymentsTable.status, cnt: count(subscriptionPaymentsTable.id) })
      .from(subscriptionPaymentsTable)
      .groupBy(subscriptionPaymentsTable.status),
    db.select({ status: subscriptionPaymentsTable.status, plan: subscriptionPaymentsTable.plan, cnt: count(subscriptionPaymentsTable.id) })
      .from(subscriptionPaymentsTable)
      .groupBy(subscriptionPaymentsTable.status, subscriptionPaymentsTable.plan),
    db.select({
      date: sql<string>`to_char(${serviceRequestsTable.createdAt}, 'YYYY-MM-DD')`,
      cnt: count(serviceRequestsTable.id),
    })
      .from(serviceRequestsTable)
      .where(gte(serviceRequestsTable.createdAt, cutoff))
      .groupBy(sql`to_char(${serviceRequestsTable.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${serviceRequestsTable.createdAt}, 'YYYY-MM-DD')`),
    db.select({
      date: sql<string>`to_char(${messagesTable.createdAt}, 'YYYY-MM-DD')`,
      cnt: count(messagesTable.id),
    })
      .from(messagesTable)
      .where(gte(messagesTable.createdAt, cutoff))
      .groupBy(sql`to_char(${messagesTable.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${messagesTable.createdAt}, 'YYYY-MM-DD')`),
    db.select({
      date: sql<string>`to_char(${subscriptionPaymentsTable.createdAt}, 'YYYY-MM-DD')`,
      status: subscriptionPaymentsTable.status,
      plan: subscriptionPaymentsTable.plan,
      cnt: count(subscriptionPaymentsTable.id),
    })
      .from(subscriptionPaymentsTable)
      .where(gte(subscriptionPaymentsTable.createdAt, cutoff))
      .groupBy(sql`to_char(${subscriptionPaymentsTable.createdAt}, 'YYYY-MM-DD')`, subscriptionPaymentsTable.status, subscriptionPaymentsTable.plan)
      .orderBy(sql`to_char(${subscriptionPaymentsTable.createdAt}, 'YYYY-MM-DD')`),
    db.select({ p: providersTable, u: usersTable, c: categoriesTable, m: providerMetricsTable })
      .from(providersTable)
      .innerJoin(usersTable, eq(providersTable.userId, usersTable.id))
      .innerJoin(categoriesTable, eq(providersTable.categoryId, categoriesTable.id))
      .leftJoin(providerMetricsTable, eq(providersTable.id, providerMetricsTable.providerId)),
    db.select({ payment: subscriptionPaymentsTable, provider: providersTable, user: usersTable })
      .from(subscriptionPaymentsTable)
      .innerJoin(providersTable, eq(subscriptionPaymentsTable.providerId, providersTable.id))
      .innerJoin(usersTable, eq(providersTable.userId, usersTable.id))
      .orderBy(desc(subscriptionPaymentsTable.createdAt))
      .limit(6),
  ]);

  const [allUsers] = totalUsers;
  const [clients] = totalClients;
  const [providers] = totalProviders;
  const [available] = activeProviders;
  const [verified] = verifiedProviders;
  const [pending] = pendingProviders;
  const [requests] = totalRequests;
  const [pendingRequestCount] = pendingRequests;
  const [completed] = completedRequests;
  const [metrics] = metricTotals;
  const providerUserRows = await db.select({ userId: providersTable.userId }).from(providersTable);
  const providerUserIds = providerUserRows.map((row) => row.userId);
  const [professionalMessages] = providerUserIds.length
    ? await db
      .select({ cnt: count(messagesTable.id) })
      .from(messagesTable)
      .innerJoin(conversationsTable, eq(messagesTable.conversationId, conversationsTable.id))
      .where(or(inArray(conversationsTable.userAId, providerUserIds), inArray(conversationsTable.userBId, providerUserIds)))
    : [{ cnt: 0 }];
  const [professionalConversations] = providerUserIds.length
    ? await db
      .select({ cnt: count(conversationsTable.id) })
      .from(conversationsTable)
      .where(or(inArray(conversationsTable.userAId, providerUserIds), inArray(conversationsTable.userBId, providerUserIds)))
    : [{ cnt: 0 }];
  const paymentSummary = paymentSummaryRows.map((row) => ({
    status: row.status,
    count: Number(row.cnt),
    amount: paymentPlanRows
      .filter((item) => item.status === row.status)
      .reduce((total, item) => total + Number(item.cnt) * paymentAmount(item.plan), 0),
  }));
  const paymentCount = (status: string) => paymentSummary.find((item) => item.status === status)?.count ?? 0;
  const paymentAmountForStatus = (status: string) => paymentSummary.find((item) => item.status === status)?.amount ?? 0;

  const seriesMap = new Map<string, { requests: number; messages: number; payments: number; approvedPayments: number }>();
  for (let index = 0; index < analyticsRanges[range]; index += 1) {
    const date = new Date(cutoff);
    date.setDate(cutoff.getDate() + index);
    seriesMap.set(analyticsDate(date), { requests: 0, messages: 0, payments: 0, approvedPayments: 0 });
  }
  requestSeriesRows.forEach((row) => {
    const point = seriesMap.get(row.date);
    if (point) point.requests = Number(row.cnt);
  });
  messageSeriesRows.forEach((row) => {
    const point = seriesMap.get(row.date);
    if (point) point.messages = Number(row.cnt);
  });
  paymentSeriesRows.forEach((row) => {
    const point = seriesMap.get(row.date);
    if (!point) return;
    point.payments += Number(row.cnt);
    if (row.status === "approved") point.approvedPayments += Number(row.cnt) * paymentAmount(row.plan);
  });

  const topProviders = await Promise.all(providerRows.map(async ({ p, u, c, m }) => {
    const [providerRequests] = await db
      .select({ cnt: count(serviceRequestsTable.id) })
      .from(serviceRequestsTable)
      .where(eq(serviceRequestsTable.providerId, p.id));
    const [providerMessages] = await db
      .select({ cnt: count(messagesTable.id) })
      .from(messagesTable)
      .innerJoin(conversationsTable, eq(messagesTable.conversationId, conversationsTable.id))
      .where(or(eq(conversationsTable.userAId, u.id), eq(conversationsTable.userBId, u.id)));
    return {
      providerId: p.id,
      name: u.name,
      categoryName: c.name,
      city: p.city,
      rating: Number(p.rating ?? 0),
      completedJobs: p.completedJobs,
      isVerified: p.isVerified,
      isAvailable: p.isAvailable,
      profileViews: m?.profileViews ?? 0,
      callClicks: m?.callClicks ?? 0,
      whatsappClicks: m?.whatsappClicks ?? 0,
      messages: Number(providerMessages?.cnt ?? 0),
      requests: Number(providerRequests?.cnt ?? 0),
    };
  }));

  topProviders.sort((a, b) => (b.profileViews + b.callClicks + b.messages) - (a.profileViews + a.callClicks + a.messages));

  res.json({
    range,
    overview: {
      totalUsers: Number(allUsers?.cnt ?? 0),
      totalClients: Number(clients?.cnt ?? 0),
      totalProviders: Number(providers?.cnt ?? 0),
      activeProviders: Number(available?.cnt ?? 0),
      verifiedProviders: Number(verified?.cnt ?? 0),
      pendingProviders: Number(pending?.cnt ?? 0),
      totalRequests: Number(requests?.cnt ?? 0),
      pendingRequests: Number(pendingRequestCount?.cnt ?? 0),
      completedRequests: Number(completed?.cnt ?? 0),
      profileViews: Number(metrics?.profileViews ?? 0),
      callClicks: Number(metrics?.callClicks ?? 0),
      whatsappClicks: Number(metrics?.whatsappClicks ?? 0),
      messageCount: Number(professionalMessages?.cnt ?? 0),
      conversationCount: Number(professionalConversations?.cnt ?? 0),
      pendingPayments: paymentCount("pending"),
      approvedPayments: paymentCount("approved"),
      rejectedPayments: paymentCount("rejected"),
      approvedPaymentAmount: paymentAmountForStatus("approved"),
      pendingPaymentAmount: paymentAmountForStatus("pending"),
    },
    series: [...seriesMap.entries()].map(([date, values]) => ({ date, ...values })),
    topProviders: topProviders.slice(0, 8),
    paymentSummary,
    recentPayments: recentPaymentRows.map(({ payment, user }) => ({
      id: payment.id,
      providerName: user.name,
      plan: payment.plan,
      wallet: payment.wallet,
      status: payment.status,
      amount: paymentAmount(payment.plan),
      transactionReference: payment.transactionReference,
      createdAt: payment.createdAt.toISOString(),
    })),
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

router.get("/admin/payment-wallets", requireAuth, requireAdmin, async (_req: AuthRequest, res): Promise<void> => {
  res.json(await listWalletSettings());
});

router.patch("/admin/payment-wallets/:wallet", requireAuth, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const wallet = Array.isArray(req.params.wallet) ? req.params.wallet[0] : req.params.wallet;
  if (!Object.prototype.hasOwnProperty.call(walletNames, wallet)) {
    res.status(400).json({ error: "المحفظة غير صالحة" });
    return;
  }
  const parsed = UpdatePaymentWalletBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [setting] = await db
    .insert(paymentWalletSettingsTable)
    .values({
      wallet: wallet as keyof typeof walletNames,
      merchantName: parsed.data.merchantName.trim(),
      merchantAccount: parsed.data.merchantAccount.trim(),
      instructions: parsed.data.instructions.trim(),
      isActive: parsed.data.isActive,
    })
    .onConflictDoUpdate({
      target: paymentWalletSettingsTable.wallet,
      set: {
        merchantName: parsed.data.merchantName.trim(),
        merchantAccount: parsed.data.merchantAccount.trim(),
        instructions: parsed.data.instructions.trim(),
        isActive: parsed.data.isActive,
        updatedAt: new Date(),
      },
    })
    .returning();
  res.json({
    wallet: setting.wallet,
    merchantName: setting.merchantName,
    merchantAccount: setting.merchantAccount,
    instructions: setting.instructions,
    isActive: setting.isActive,
  });
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
