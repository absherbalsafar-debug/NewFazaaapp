import { Router, type IRouter } from "express";
import { and, asc, count, desc, eq, isNotNull } from "drizzle-orm";
import {
  db,
  providersTable,
  providerSubscriptionsTable,
  subscriptionPaymentsTable,
  paymentWalletSettingsTable,
  providerMetricsTable,
  serviceRequestsTable,
  commercialPlansTable,
} from "@workspace/db";
import { ensureCommercialPlanDefaults } from "./commercial-plans";
import {
  CreateSubscriptionPaymentBody,
} from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

export const subscriptionPlans = [
  {
    id: "free",
    name: "مجاني لأول 300 مهني",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "مقعد مجاني مدى الحياة للمهنيين الأوائل",
    benefits: ["ملف مهني", "الظهور في البحث", "استقبال الطلبات", "صور أعمال محدودة"],
  },
  {
    id: "monthly",
    name: "اشتراك شهري",
    monthlyPrice: 15,
    yearlyPrice: 0,
    description: "ظهور أفضل وأدوات متابعة الأداء",
    benefits: ["أولوية في النتائج", "صور أعمال أكثر", "إحصائيات الملف", "شارة مشترك"],
  },
  {
    id: "quarterly",
    name: "اشتراك 3 أشهر",
    monthlyPrice: 0,
    yearlyPrice: 40,
    description: "ظهور أفضل وأدوات متابعة الأداء لمدة ثلاثة أشهر",
    benefits: ["أولوية في النتائج", "صور أعمال أكثر", "إحصائيات الملف", "شارة مشترك"],
  },
  {
    id: "half_yearly",
    name: "اشتراك 6 أشهر",
    monthlyPrice: 0,
    yearlyPrice: 75,
    description: "اشتراك نصف سنوي بظهور أعلى",
    benefits: ["كل مزايا الشهري", "أولوية أعلى", "شارة مشترك"],
  },
  {
    id: "yearly",
    name: "اشتراك سنوي",
    monthlyPrice: 0,
    yearlyPrice: 150,
    description: "سعر أوفر مع ظهور أعلى طوال العام",
    benefits: ["كل مزايا الشهري", "سعر سنوي مخفض", "أولوية أعلى", "شارة مشترك سنوي"],
  },
] as const;

export const walletNames: Record<string, string> = {
  jeeb: "جيب", floosk: "فلوسك", jawali: "جوالي", cash: "كاش", one_cash: "ون كاش", hasib: "حاسب", easy: "إيزي",
};

type Wallet = string;

function serializeWalletSetting(setting: typeof paymentWalletSettingsTable.$inferSelect) {
  return {
    wallet: setting.wallet,
    displayName: setting.displayName || walletNames[setting.wallet] || setting.wallet,
    logoUrl: setting.logoUrl ?? null,
    description: setting.description,
    usage: setting.usage,
    sortOrder: setting.sortOrder,
    merchantName: setting.merchantName,
    merchantAccount: setting.merchantAccount,
    instructions: setting.instructions,
    isActive: setting.isActive,
  };
}

export async function listWalletSettings(usage?: "subscriptions" | "advertisements") {
  const rows = await db.select().from(paymentWalletSettingsTable).orderBy(paymentWalletSettingsTable.sortOrder, paymentWalletSettingsTable.displayName);
  return rows.filter((row) => row.isActive && (!usage || row.usage === "both" || row.usage === usage)).map(serializeWalletSetting);
}

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function serializeSubscription(subscription: typeof providerSubscriptionsTable.$inferSelect) {
  return {
    id: subscription.id,
    plan: subscription.plan,
    status: subscription.status,
    freeSlotNumber: subscription.freeSlotNumber ?? null,
    startsAt: subscription.startsAt?.toISOString() ?? null,
    endsAt: subscription.endsAt ?? null,
    createdAt: subscription.createdAt.toISOString(),
  };
}

export function serializePayment(payment: typeof subscriptionPaymentsTable.$inferSelect) {
  return {
    id: payment.id,
    providerId: payment.providerId,
    plan: payment.plan,
    wallet: payment.wallet,
    transactionReference: payment.transactionReference,
    receiptUrl: payment.receiptUrl ?? null,
    status: payment.status,
    adminNote: payment.adminNote ?? null,
    createdAt: payment.createdAt.toISOString(),
    reviewedAt: payment.reviewedAt?.toISOString() ?? null,
  };
}

export async function ensureProviderSubscription(providerId: number) {
  const [existing] = await db
    .select()
    .from(providerSubscriptionsTable)
    .where(eq(providerSubscriptionsTable.providerId, providerId))
    .orderBy(desc(providerSubscriptionsTable.createdAt))
    .limit(1);
  if (existing) {
    await db.update(providersTable).set({
      isSubscriptionActive: existing.status === "active",
      professionalStatus: existing.status === "active" ? "approved" : "expired",
    }).where(eq(providersTable.id, providerId));
    return existing;
  }

  const [freeCount] = await db
    .select({ count: count(providersTable.freeSlotNumber) })
    .from(providersTable)
    .where(isNotNull(providersTable.freeSlotNumber));
  const usedSlots = Number(freeCount?.count ?? 0);

  if (usedSlots < 300) {
    const freeSlotNumber = usedSlots + 1;
    await db.update(providersTable).set({ freeSlotNumber, isSubscriptionActive: true, professionalStatus: "approved" }).where(eq(providersTable.id, providerId));
    const [subscription] = await db
      .insert(providerSubscriptionsTable)
      .values({
        providerId,
        plan: "free",
        status: "active",
        freeSlotNumber,
        startsAt: new Date(),
        endsAt: null,
      })
      .returning();
    return subscription;
  }

  const [subscription] = await db
    .insert(providerSubscriptionsTable)
    .values({ providerId, plan: "monthly", status: "expired" })
    .returning();
  return subscription;
}

router.get("/subscription-plans", (_req, res) => {
  ensureCommercialPlanDefaults().then(async () => {
    const rows = await db.select().from(commercialPlansTable).where(and(eq(commercialPlansTable.kind, "subscription"), eq(commercialPlansTable.isActive, true))).orderBy(asc(commercialPlansTable.sortOrder), asc(commercialPlansTable.id));
    res.json([{ id: "free", name: "مجاني لأول 300 مهني", monthlyPrice: 0, yearlyPrice: 0, description: "مقعد مجاني مدى الحياة للمهنيين الأوائل", benefits: ["ملف مهني", "الظهور في البحث", "استقبال الطلبات", "صور أعمال محدودة"] }, ...rows.map((row) => ({ id: row.code, name: row.name, monthlyPrice: row.code === "monthly" ? Number(row.price) : 0, yearlyPrice: row.code === "monthly" ? 0 : Number(row.price), description: row.description, benefits: Array.isArray(row.benefits) ? row.benefits : [] }))]);
  }).catch(() => res.status(500).json({ error: "تعذر تحميل خطط الاشتراك" }));
});

router.get("/payment-wallets", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  if (req.userRole !== "provider") {
    res.status(403).json({ error: "وسائل الدفع متاحة للمهنيين فقط" });
    return;
  }
  res.json(await listWalletSettings());
});

router.get("/providers/me/business", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  if (req.userRole !== "provider") {
    res.status(403).json({ error: "هذا المسار للمهنيين فقط" });
    return;
  }

  const [provider] = await db.select().from(providersTable).where(eq(providersTable.userId, req.userId!));
  if (!provider) {
    res.status(404).json({ error: "لم يتم إنشاء ملف مهني بعد" });
    return;
  }

  const subscription = await ensureProviderSubscription(provider.id);
  const [metrics] = await db.select().from(providerMetricsTable).where(eq(providerMetricsTable.providerId, provider.id));
  const [requestCount] = await db.select({ count: count(serviceRequestsTable.id) }).from(serviceRequestsTable).where(eq(serviceRequestsTable.providerId, provider.id));
  const [freeCount] = await db
    .select({ count: count(providersTable.freeSlotNumber) })
    .from(providersTable)
    .where(isNotNull(providersTable.freeSlotNumber));

  res.json({
    subscription: serializeSubscription(subscription),
    metrics: {
      profileViews: metrics?.profileViews ?? 0,
      callClicks: metrics?.callClicks ?? 0,
      whatsappClicks: metrics?.whatsappClicks ?? 0,
      serviceRequests: Number(requestCount?.count ?? metrics?.serviceRequests ?? 0),
    },
    freeSlotsRemaining: Math.max(0, 300 - Number(freeCount?.count ?? 0)),
  });
});

router.get("/providers/me/payments", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  if (req.userRole !== "provider") {
    res.status(403).json({ error: "هذا المسار للمهنيين فقط" });
    return;
  }
  const [provider] = await db.select().from(providersTable).where(eq(providersTable.userId, req.userId!));
  if (!provider) {
    res.status(404).json({ error: "لم يتم إنشاء ملف مهني بعد" });
    return;
  }
  const payments = await db
    .select()
    .from(subscriptionPaymentsTable)
    .where(eq(subscriptionPaymentsTable.providerId, provider.id))
    .orderBy(desc(subscriptionPaymentsTable.createdAt));
  res.json(payments.map(serializePayment));
});

router.post("/subscriptions/checkout", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  if (req.userRole !== "provider") {
    res.status(403).json({ error: "الاشتراكات متاحة للمهنيين فقط" });
    return;
  }
  const parsed = CreateSubscriptionPaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [provider] = await db.select().from(providersTable).where(eq(providersTable.userId, req.userId!));
  if (!provider) {
    res.status(404).json({ error: "لم يتم إنشاء ملف مهني بعد" });
    return;
  }

  const data = parsed.data;
  if (data.receiptUrl && !data.receiptUrl.startsWith("/objects/uploads/")) {
    res.status(400).json({ error: "مسار الإيصال غير صالح" });
    return;
  }
  const [subscription] = await db
    .insert(providerSubscriptionsTable)
    .values({ providerId: provider.id, plan: data.plan, status: "pending" })
    .returning();
  const [payment] = await db
    .insert(subscriptionPaymentsTable)
    .values({
      providerId: provider.id,
      subscriptionId: subscription.id,
      plan: data.plan,
      wallet: data.wallet,
      transactionReference: data.transactionReference.trim(),
      receiptUrl: data.receiptUrl ?? null,
      status: "pending",
    })
    .returning();

  res.status(201).json(serializePayment(payment));
});

export default router;
