import { Router, type IRouter } from "express";
import { desc, eq, sum } from "drizzle-orm";
import { db, commissionSettingsTable, serviceCommissionsTable, serviceRequestsTable } from "@workspace/db";
import { requireAdmin, requireAuth, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/admin/commission-settings", requireAuth, requireAdmin, async (_req: AuthRequest, res): Promise<void> => {
  const [settings] = await db.select().from(commissionSettingsTable).orderBy(desc(commissionSettingsTable.updatedAt)).limit(1);
  res.json(settings ?? { type: "none", percentage: "0", fixedAmount: "0", isActive: 0 });
});

router.patch("/admin/commission-settings", requireAuth, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const { type = "none", percentage = 0, fixedAmount = 0 } = req.body ?? {};
  if (!["none", "percentage", "fixed"].includes(type) || Number(percentage) < 0 || Number(percentage) > 100 || Number(fixedAmount) < 0) {
    res.status(400).json({ error: "إعدادات العمولة غير صالحة" }); return;
  }
  const [settings] = await db.insert(commissionSettingsTable).values({ type, percentage: String(percentage), fixedAmount: String(fixedAmount), isActive: type === "none" ? 0 : 1, updatedAt: new Date() }).returning();
  res.json(settings);
});

router.get("/admin/commission-report", requireAuth, requireAdmin, async (_req: AuthRequest, res): Promise<void> => {
  const rows = await db.select().from(serviceCommissionsTable).orderBy(desc(serviceCommissionsTable.createdAt));
  const [total] = await db.select({ value: sum(serviceCommissionsTable.commissionAmount) }).from(serviceCommissionsTable);
  res.json({ total: Number(total?.value ?? 0), items: rows.map((row) => ({ ...row, serviceAmount: Number(row.serviceAmount), commissionAmount: Number(row.commissionAmount), createdAt: row.createdAt.toISOString(), settledAt: row.settledAt?.toISOString() ?? null })) });
});

export async function createCommissionForCompletedRequest(requestId: number, providerId: number, serviceAmount: string | number) {
  const [settings] = await db.select().from(commissionSettingsTable).orderBy(desc(commissionSettingsTable.updatedAt)).limit(1);
  const amount = Math.max(0, Number(serviceAmount ?? 0));
  const percentage = Number(settings?.percentage ?? 0);
  const fixed = Number(settings?.fixedAmount ?? 0);
  const commissionAmount = settings?.type === "percentage" ? amount * percentage / 100 : settings?.type === "fixed" ? fixed : 0;
  await db.insert(serviceCommissionsTable).values({ requestId, providerId, serviceAmount: String(amount), commissionAmount: String(commissionAmount) }).onConflictDoNothing();
}

export default router;
