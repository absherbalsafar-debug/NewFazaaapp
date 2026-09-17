import { Readable } from "stream";
import { and, eq } from "drizzle-orm";
import { RequestUploadUrlBody, RequestUploadUrlResponse } from "@workspace/api-zod";
import {
  db,
  providersTable,
  subscriptionPaymentsTable,
  portfolioItemsTable,
  providerVerificationDocumentsTable,
  usersTable,
} from "@workspace/db";
import { Router, type IRouter } from "express";
import { optionalAuth, requireAuth, type AuthRequest } from "../middlewares/auth";
import { ObjectNotFoundError, ObjectStorageService } from "../lib/objectStorage";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();
const allowedReceiptTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const maxReceiptSize = 10 * 1024 * 1024;

router.post("/storage/uploads/request-url", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = RequestUploadUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "بيانات الملف غير صالحة" });
    return;
  }
  const { name, size, contentType } = parsed.data;
  const cleanName = name.trim();
  if (!cleanName || cleanName.length > 180 || /[\u0000-\u001f\\/]/.test(cleanName) || !allowedReceiptTypes.has(contentType) || size > maxReceiptSize) {
    res.status(400).json({ error: "يسمح بصور JPG أو PNG أو WEBP وملفات PDF حتى 10 ميجابايت" });
    return;
  }
  try {
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
    res.json(RequestUploadUrlResponse.parse({
      uploadURL,
      objectPath,
      metadata: { name, size, contentType },
    }));
  } catch (error) {
    req.log?.error?.({ err: error }, "Error generating upload URL");
    res.status(500).json({ error: "تعذر تجهيز رفع الملف" });
  }
});

router.get("/storage/objects/*path", optionalAuth, async (req: AuthRequest, res): Promise<void> => {
  const raw = req.params.path;
  const objectPath = `/objects/${Array.isArray(raw) ? raw.join("/") : raw}`;
  const [currentUser] = req.userId ? await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, req.userId)) : [null];
  const role = currentUser?.role;
  const [payment] = await db
    .select({ providerId: subscriptionPaymentsTable.providerId })
    .from(subscriptionPaymentsTable)
    .where(eq(subscriptionPaymentsTable.receiptUrl, objectPath));
  const [portfolio] = await db.select({ id: portfolioItemsTable.id, providerId: portfolioItemsTable.providerId, reviewStatus: portfolioItemsTable.reviewStatus }).from(portfolioItemsTable).where(eq(portfolioItemsTable.imageUrl, objectPath));
  const [verification] = await db.select({ id: providerVerificationDocumentsTable.id, providerId: providerVerificationDocumentsTable.providerId }).from(providerVerificationDocumentsTable).where(eq(providerVerificationDocumentsTable.objectPath, objectPath));
  let allowed = Boolean(portfolio?.reviewStatus === "approved");
  if (payment && (role === "admin" || !req.userId)) allowed = role === "admin";
  if (payment && req.userId && role !== "admin") {
    const [provider] = await db
      .select({ id: providersTable.id })
      .from(providersTable)
      .where(and(eq(providersTable.id, payment.providerId), eq(providersTable.userId, req.userId!)));
    allowed = Boolean(provider);
  }
  if (verification && role === "admin") allowed = true;
  if (verification && req.userId && role !== "admin") {
    const [provider] = await db.select({ id: providersTable.id }).from(providersTable).where(and(eq(providersTable.id, verification.providerId), eq(providersTable.userId, req.userId)));
    allowed = Boolean(provider);
  }
  if (!payment && !portfolio && !verification) { res.status(404).json({ error: "الملف غير موجود" }); return; }
  if (!allowed) { res.status(403).json({ error: "لا تملك صلاحية عرض هذا الملف" }); return; }
  try {
    const response = await objectStorageService.downloadObject(await objectStorageService.getObjectEntityFile(objectPath));
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (!portfolio) res.setHeader("Content-Disposition", "attachment");
    if (response.body) Readable.fromWeb(response.body as ReadableStream<Uint8Array>).pipe(res);
    else res.end();
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      res.status(404).json({ error: "الإيصال غير موجود" });
      return;
    }
    req.log?.error?.({ err: error }, "Error serving object");
    res.status(500).json({ error: "تعذر عرض الإيصال" });
  }
});

export default router;
