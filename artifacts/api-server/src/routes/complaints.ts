import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, complaintsTable, complaintEvidenceTable, providersTable, serviceRequestsTable, usersTable } from "@workspace/db";
import { requireAdmin, requireAuth, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

function numberParam(value: string | string[]) {
  const id = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function serializeComplaint(row: any, evidence: any[] = []) {
  return {
    id: row.id,
    clientId: row.clientId,
    providerId: row.providerId,
    requestId: row.requestId ?? null,
    subject: row.subject,
    description: row.description,
    status: row.status,
    priority: row.priority,
    resolutionNote: row.resolutionNote ?? null,
    assignedTo: row.assignedTo ?? null,
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    evidence: evidence.map((item) => ({ id: item.id, objectPath: item.objectPath, originalName: item.originalName, createdAt: item.createdAt.toISOString() })),
  };
}

router.post("/complaints", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  if (req.userRole !== "client") {
    res.status(403).json({ error: "يمكن للعملاء تقديم الشكاوى فقط" });
    return;
  }
  const { providerId, requestId, subject, description, priority = "normal", evidence = [] } = req.body ?? {};
  if (!Number.isInteger(Number(providerId)) || typeof subject !== "string" || subject.trim().length < 3 || typeof description !== "string" || description.trim().length < 10) {
    res.status(400).json({ error: "بيانات الشكوى غير مكتملة" });
    return;
  }
  if (!Array.isArray(evidence) || evidence.length > 10 || !evidence.every((item) => item && typeof item.objectPath === "string" && item.objectPath.startsWith("/objects/"))) {
    res.status(400).json({ error: "الأدلة المرفقة غير صالحة" });
    return;
  }
  const [provider] = await db.select({ id: providersTable.id }).from(providersTable).where(eq(providersTable.id, Number(providerId)));
  if (!provider) { res.status(404).json({ error: "المهني غير موجود" }); return; }
  if (requestId != null) {
    const [request] = await db.select({ id: serviceRequestsTable.id }).from(serviceRequestsTable).where(and(eq(serviceRequestsTable.id, Number(requestId)), eq(serviceRequestsTable.clientId, req.userId!), eq(serviceRequestsTable.providerId, Number(providerId))));
    if (!request) { res.status(400).json({ error: "طلب الخدمة المرتبط غير صالح" }); return; }
  }
  const [complaint] = await db.insert(complaintsTable).values({
    clientId: req.userId!, providerId: Number(providerId), requestId: requestId == null ? null : Number(requestId),
    subject: subject.trim(), description: description.trim(), priority: ["low", "normal", "high", "urgent"].includes(priority) ? priority : "normal",
  }).returning();
  if (evidence.length) await db.insert(complaintEvidenceTable).values(evidence.map((item: any) => ({ complaintId: complaint.id, objectPath: item.objectPath, originalName: String(item.originalName ?? "").slice(0, 255) })));
  const savedEvidence = await db.select().from(complaintEvidenceTable).where(eq(complaintEvidenceTable.complaintId, complaint.id));
  res.status(201).json(serializeComplaint(complaint, savedEvidence));
});

router.get("/complaints/mine", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const rows = await db.select().from(complaintsTable).where(eq(complaintsTable.clientId, req.userId!)).orderBy(desc(complaintsTable.createdAt));
  const result = await Promise.all(rows.map(async (row) => serializeComplaint(row, await db.select().from(complaintEvidenceTable).where(eq(complaintEvidenceTable.complaintId, row.id)))));
  res.json(result);
});

router.get("/admin/complaints", requireAuth, requireAdmin, async (_req: AuthRequest, res): Promise<void> => {
  const rows = await db.select({ complaint: complaintsTable, client: usersTable }).from(complaintsTable).innerJoin(usersTable, eq(complaintsTable.clientId, usersTable.id)).orderBy(desc(complaintsTable.createdAt));
  res.json(await Promise.all(rows.map(async ({ complaint, client }) => ({ ...serializeComplaint(complaint, await db.select().from(complaintEvidenceTable).where(eq(complaintEvidenceTable.complaintId, complaint.id))), clientName: client.name, clientPhone: client.phone }))));
});

router.patch("/admin/complaints/:id", requireAuth, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const id = numberParam(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }
  const { status, priority, resolutionNote, suspendProvider, banProvider } = req.body ?? {};
  if (status && !["open", "under_review", "resolved", "rejected", "closed"].includes(status)) { res.status(400).json({ error: "حالة الشكوى غير صالحة" }); return; }
  const [complaint] = await db.select().from(complaintsTable).where(eq(complaintsTable.id, id));
  if (!complaint) { res.status(404).json({ error: "الشكوى غير موجودة" }); return; }
  const nextStatus = status ?? complaint.status;
  const [updated] = await db.update(complaintsTable).set({ status: nextStatus, priority: priority && ["low", "normal", "high", "urgent"].includes(priority) ? priority : complaint.priority, resolutionNote: resolutionNote == null ? complaint.resolutionNote : String(resolutionNote).slice(0, 2000), assignedTo: req.userId!, resolvedAt: ["resolved", "rejected", "closed"].includes(nextStatus) ? new Date() : null }).where(eq(complaintsTable.id, id)).returning();
  if (suspendProvider || banProvider) await db.update(usersTable).set({ status: banProvider ? "banned" : "pending" }).where(eq(usersTable.id, (await db.select({ userId: providersTable.userId }).from(providersTable).where(eq(providersTable.id, complaint.providerId)))[0]?.userId ?? -1));
  const evidence = await db.select().from(complaintEvidenceTable).where(eq(complaintEvidenceTable.complaintId, id));
  res.json(serializeComplaint(updated, evidence));
});

export default router;
