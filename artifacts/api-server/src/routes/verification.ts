import { Router, type IRouter } from "express";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db, providersTable, providerVerificationDocumentsTable, providerVerificationAuditTable, usersTable, categoriesTable, portfolioItemsTable } from "@workspace/db";
import { requireAdmin, requireAuth, requireVerificationStaff, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();
const documentTypes = new Set(["id_front", "id_back", "selfie", "portfolio", "certificate"]);
const objectUrl = (path: string) => path.startsWith("/objects/") ? `/api/storage/objects/${path.slice("/objects/".length)}` : path;

async function providerForUser(userId: number) {
  const [provider] = await db.select().from(providersTable).where(eq(providersTable.userId, userId));
  return provider;
}

function serialize(row: typeof providerVerificationDocumentsTable.$inferSelect) {
  return { id: row.id, providerId: row.providerId, type: row.type, objectPath: row.objectPath, originalName: row.originalName, status: row.status, reviewerNote: row.reviewerNote ?? null, reviewedAt: row.reviewedAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString() };
}

async function audit(providerId: number, actorId: number, action: typeof providerVerificationAuditTable.$inferInsert["action"], details: { documentId?: number; portfolioId?: number; fromStatus?: string | null; toStatus?: string | null; note?: string | null } = {}) {
  await db.insert(providerVerificationAuditTable).values({ providerId, actorId, action, documentId: details.documentId, portfolioId: details.portfolioId, fromStatus: details.fromStatus ?? null, toStatus: details.toStatus ?? null, note: details.note ?? null });
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
  await db.update(providersTable).set({ verificationStatus: "under_review", isVerified: false }).where(eq(providersTable.id, provider.id));
  await audit(provider.id, req.userId!, "submitted", { documentId: document.id, toStatus: "pending" });
  res.status(201).json(serialize(document));
});

router.get("/admin/verification/queue", requireAuth, requireVerificationStaff, async (_req: AuthRequest, res): Promise<void> => {
  const rows = await db.select({ provider: providersTable, user: usersTable, category: categoriesTable })
    .from(providersTable)
    .innerJoin(usersTable, eq(providersTable.userId, usersTable.id))
    .innerJoin(categoriesTable, eq(providersTable.categoryId, categoriesTable.id))
    .where(inArray(providersTable.verificationStatus, ["pending", "under_review", "changes_requested"]))
    .orderBy(desc(providersTable.updatedAt));
  res.json(rows.map(({ provider, user, category }) => ({
    providerId: provider.id,
    userId: user.id,
    name: user.name,
    phone: user.phone,
    categoryName: category.name,
    city: provider.city,
    verificationStatus: provider.verificationStatus,
    verificationContacted: provider.verificationContacted,
    verificationContactNote: provider.verificationContactNote,
    updatedAt: provider.updatedAt.toISOString(),
  })));
});

router.get("/admin/providers/:id/verification-documents", requireAuth, requireVerificationStaff, async (req: AuthRequest, res): Promise<void> => {
  const providerId = Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  if (!Number.isInteger(providerId)) { res.status(400).json({ error: "Invalid id" }); return; }
  const rows = await db.select().from(providerVerificationDocumentsTable).where(eq(providerVerificationDocumentsTable.providerId, providerId)).orderBy(desc(providerVerificationDocumentsTable.createdAt));
  res.json(rows.map(serialize));
});

router.patch("/admin/verification-documents/:id", requireAuth, requireVerificationStaff, async (req: AuthRequest, res): Promise<void> => {
  const id = Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const { status, reviewerNote = null } = req.body ?? {};
  if (!Number.isInteger(id) || !["pending", "approved", "rejected", "hidden"].includes(status)) { res.status(400).json({ error: "بيانات المراجعة غير صالحة" }); return; }
  const [document] = await db.select().from(providerVerificationDocumentsTable).where(eq(providerVerificationDocumentsTable.id, id));
  if (!document) { res.status(404).json({ error: "الوثيقة غير موجودة" }); return; }
  const [updated] = await db.update(providerVerificationDocumentsTable).set({ status, reviewerNote: reviewerNote == null ? null : String(reviewerNote).slice(0, 1000), reviewedBy: req.userId!, reviewedAt: new Date() }).where(eq(providerVerificationDocumentsTable.id, id)).returning();
  await audit(document.providerId, req.userId!, status === "hidden" ? "hidden" : status === "approved" ? "approved" : "rejected", { documentId: id, fromStatus: document.status, toStatus: status, note: reviewerNote });
  if (status === "rejected") await db.update(providersTable).set({ isVerified: false, verificationStatus: "changes_requested" }).where(eq(providersTable.id, document.providerId));
  if (status === "approved") {
    const pending = await db.select({ id: providerVerificationDocumentsTable.id }).from(providerVerificationDocumentsTable).where(and(eq(providerVerificationDocumentsTable.providerId, document.providerId), eq(providerVerificationDocumentsTable.status, "pending")));
    if (pending.length === 0) await db.update(providersTable).set({ isVerified: true, verificationStatus: "approved" }).where(eq(providersTable.id, document.providerId));
  }
  res.json(serialize(updated));
});

router.patch("/admin/providers/:id/verification", requireAuth, requireVerificationStaff, async (req: AuthRequest, res): Promise<void> => {
  const providerId = Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const { status, contacted, contactNote } = req.body ?? {};
  const allowed = ["under_review", "changes_requested", "approved", "rejected", "suspended", "expired"];
  if (!Number.isInteger(providerId) || (status !== undefined && !allowed.includes(status)) || (contacted !== undefined && typeof contacted !== "boolean")) { res.status(400).json({ error: "بيانات التحقق غير صالحة" }); return; }
  const [provider] = await db.select().from(providersTable).where(eq(providersTable.id, providerId));
  if (!provider) { res.status(404).json({ error: "المهني غير موجود" }); return; }
  const nextStatus = status ?? provider.verificationStatus;
  const isApproved = nextStatus === "approved";
  const [updated] = await db.update(providersTable).set({
    verificationStatus: nextStatus,
    isVerified: isApproved,
    verificationContacted: contacted ?? provider.verificationContacted,
    verificationContactedAt: contacted === true ? new Date() : provider.verificationContactedAt,
    verificationContactedBy: contacted === true ? req.userId! : provider.verificationContactedBy,
    verificationContactNote: contactNote == null ? provider.verificationContactNote : String(contactNote).slice(0, 1000),
  }).where(eq(providersTable.id, providerId)).returning();
  if (status && status !== provider.verificationStatus) await audit(providerId, req.userId!, status === "approved" ? "approved" : status === "changes_requested" ? "changes_requested" : status === "rejected" ? "rejected" : "review_started", { fromStatus: provider.verificationStatus, toStatus: status, note: contactNote });
  if (contacted !== undefined || contactNote !== undefined) await audit(providerId, req.userId!, "contact_updated", { note: contactNote });
  res.json({ providerId: updated.id, verificationStatus: updated.verificationStatus, isVerified: updated.isVerified, verificationContacted: updated.verificationContacted, verificationContactNote: updated.verificationContactNote });
});

router.get("/admin/providers/:id/verification-audit", requireAuth, requireVerificationStaff, async (req: AuthRequest, res): Promise<void> => {
  const providerId = Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  if (!Number.isInteger(providerId)) { res.status(400).json({ error: "Invalid id" }); return; }
  const rows = await db.select().from(providerVerificationAuditTable).where(eq(providerVerificationAuditTable.providerId, providerId)).orderBy(desc(providerVerificationAuditTable.createdAt));
  res.json(rows);
});

router.get("/admin/portfolio-review/queue", requireAuth, requireVerificationStaff, async (_req: AuthRequest, res): Promise<void> => {
  const rows = await db.select({ item: portfolioItemsTable, provider: providersTable, user: usersTable, category: categoriesTable })
    .from(portfolioItemsTable)
    .innerJoin(providersTable, eq(portfolioItemsTable.providerId, providersTable.id))
    .innerJoin(usersTable, eq(providersTable.userId, usersTable.id))
    .innerJoin(categoriesTable, eq(providersTable.categoryId, categoriesTable.id))
    .where(eq(portfolioItemsTable.reviewStatus, "pending"))
    .orderBy(desc(portfolioItemsTable.createdAt));
  res.json(rows.map(({ item, provider, user, category }) => ({
    id: item.id, providerId: provider.id, providerName: user.name, phone: user.phone, categoryName: category.name,
    city: provider.city, imageUrl: objectUrl(item.imageUrl), description: item.description ?? null, reviewStatus: item.reviewStatus,
    rejectionReason: item.rejectionReason ?? null, reviewerNote: item.reviewerNote ?? null, createdAt: item.createdAt.toISOString(),
  })));
});

router.patch("/admin/portfolio-items/:id", requireAuth, requireVerificationStaff, async (req: AuthRequest, res): Promise<void> => {
  const id = Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const { status, rejectionReason = null, reviewerNote = null } = req.body ?? {};
  const reasons = ["unrelated", "low_quality", "contact_info", "external_ad", "not_original", "policy_violation", "insufficient_proof", "other"];
  if (!Number.isInteger(id) || !["pending", "approved", "rejected", "hidden"].includes(status) || (rejectionReason !== null && !reasons.includes(rejectionReason))) { res.status(400).json({ error: "بيانات مراجعة الصورة غير صالحة" }); return; }
  const [item] = await db.select().from(portfolioItemsTable).where(eq(portfolioItemsTable.id, id));
  if (!item) { res.status(404).json({ error: "صورة العمل غير موجودة" }); return; }
  const [updated] = await db.update(portfolioItemsTable).set({ reviewStatus: status, rejectionReason: status === "rejected" ? rejectionReason : null, reviewerNote: reviewerNote == null ? null : String(reviewerNote).slice(0, 1000), reviewedBy: req.userId!, reviewedAt: new Date() }).where(eq(portfolioItemsTable.id, id)).returning();
  const action = status === "approved" ? "approved" : status === "hidden" ? "hidden" : status === "rejected" ? "rejected" : "review_started";
  await audit(item.providerId, req.userId!, action, { portfolioId: id, fromStatus: item.reviewStatus, toStatus: status, note: reviewerNote || rejectionReason });
  res.json({ id: updated.id, providerId: updated.providerId, reviewStatus: updated.reviewStatus, rejectionReason: updated.rejectionReason, reviewerNote: updated.reviewerNote, reviewedAt: updated.reviewedAt?.toISOString() ?? null });
});

export default router;
