import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, providersTable, providerVerificationDocumentsTable } from "@workspace/db";
import { requireAdmin, requireAuth, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();
const documentTypes = new Set(["id_front", "id_back", "selfie", "portfolio", "certificate"]);

async function providerForUser(userId: number) {
  const [provider] = await db.select().from(providersTable).where(eq(providersTable.userId, userId));
  return provider;
}

function serialize(row: typeof providerVerificationDocumentsTable.$inferSelect) {
  return { id: row.id, providerId: row.providerId, type: row.type, objectPath: row.objectPath, originalName: row.originalName, status: row.status, reviewerNote: row.reviewerNote ?? null, reviewedAt: row.reviewedAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString() };
}

router.get("/providers/me/verification-documents", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  if (req.userRole !== "provider") { res.status(403).json({ error: "هذا المسار للمهنيين فقط" }); return; }
  const provider = await providerForUser(req.userId!);
  if (!provider) { res.status(404).json({ error: "ملف المهني غير موجود" }); return; }
  const rows = await db.select().from(providerVerificationDocumentsTable).where(eq(providerVerificationDocumentsTable.providerId, provider.id)).orderBy(desc(providerVerificationDocumentsTable.createdAt));
  res.json(rows.map(serialize));
});

router.post("/providers/me/verification-documents", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  if (req.userRole !== "provider") { res.status(403).json({ error: "هذا المسار للمهنيين فقط" }); return; }
  const { type, objectPath, originalName = "" } = req.body ?? {};
  if (!documentTypes.has(type) || typeof objectPath !== "string" || !objectPath.startsWith("/objects/")) { res.status(400).json({ error: "بيانات الوثيقة غير صالحة" }); return; }
  const provider = await providerForUser(req.userId!);
  if (!provider) { res.status(404).json({ error: "ملف المهني غير موجود" }); return; }
  const [document] = await db.insert(providerVerificationDocumentsTable).values({ providerId: provider.id, type, objectPath, originalName: String(originalName).slice(0, 255) }).returning();
  await db.update(providersTable).set({ verificationStatus: "pending", isVerified: false }).where(eq(providersTable.id, provider.id));
  res.status(201).json(serialize(document));
});

router.get("/admin/providers/:id/verification-documents", requireAuth, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const providerId = Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  if (!Number.isInteger(providerId)) { res.status(400).json({ error: "Invalid id" }); return; }
  const rows = await db.select().from(providerVerificationDocumentsTable).where(eq(providerVerificationDocumentsTable.providerId, providerId)).orderBy(desc(providerVerificationDocumentsTable.createdAt));
  res.json(rows.map(serialize));
});

router.patch("/admin/verification-documents/:id", requireAuth, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const id = Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const { status, reviewerNote = null } = req.body ?? {};
  if (!Number.isInteger(id) || !["pending", "approved", "rejected"].includes(status)) { res.status(400).json({ error: "بيانات المراجعة غير صالحة" }); return; }
  const [document] = await db.select().from(providerVerificationDocumentsTable).where(eq(providerVerificationDocumentsTable.id, id));
  if (!document) { res.status(404).json({ error: "الوثيقة غير موجودة" }); return; }
  const [updated] = await db.update(providerVerificationDocumentsTable).set({ status, reviewerNote: reviewerNote == null ? null : String(reviewerNote).slice(0, 1000), reviewedBy: req.userId!, reviewedAt: new Date() }).where(eq(providerVerificationDocumentsTable.id, id)).returning();
  if (status === "rejected") await db.update(providersTable).set({ isVerified: false, verificationStatus: "rejected" }).where(eq(providersTable.id, document.providerId));
  if (status === "approved") {
    const pending = await db.select({ id: providerVerificationDocumentsTable.id }).from(providerVerificationDocumentsTable).where(and(eq(providerVerificationDocumentsTable.providerId, document.providerId), eq(providerVerificationDocumentsTable.status, "pending")));
    if (pending.length === 0) await db.update(providersTable).set({ isVerified: true, verificationStatus: "approved" }).where(eq(providersTable.id, document.providerId));
  }
  res.json(serialize(updated));
});

export default router;
