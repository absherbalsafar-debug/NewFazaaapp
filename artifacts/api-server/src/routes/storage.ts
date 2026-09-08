import { Readable } from "stream";
import { and, eq } from "drizzle-orm";
import { RequestUploadUrlBody, RequestUploadUrlResponse } from "@workspace/api-zod";
import {
  db,
  providersTable,
  subscriptionPaymentsTable,
} from "@workspace/db";
import { Router, type IRouter } from "express";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
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
  if (!allowedReceiptTypes.has(contentType) || size > maxReceiptSize) {
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

router.get("/storage/objects/*path", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const raw = req.params.path;
  const objectPath = `/objects/${Array.isArray(raw) ? raw.join("/") : raw}`;
  const [payment] = await db
    .select({ providerId: subscriptionPaymentsTable.providerId })
    .from(subscriptionPaymentsTable)
    .where(eq(subscriptionPaymentsTable.receiptUrl, objectPath));
  if (!payment) {
    res.status(404).json({ error: "الإيصال غير موجود" });
    return;
  }
  if (req.userRole !== "admin") {
    const [provider] = await db
      .select({ id: providersTable.id })
      .from(providersTable)
      .where(and(eq(providersTable.id, payment.providerId), eq(providersTable.userId, req.userId!)));
    if (!provider) {
      res.status(403).json({ error: "لا تملك صلاحية عرض هذا الإيصال" });
      return;
    }
  }
  try {
    const response = await objectStorageService.downloadObject(await objectStorageService.getObjectEntityFile(objectPath));
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
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