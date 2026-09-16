import { Router, type IRouter } from "express";
import { and, asc, eq } from "drizzle-orm";
import { db, categoriesTable, providerServicesTable, providerSpecializationsTable, servicesTable, specializationsTable, providersTable } from "@workspace/db";
import { requireAdmin, requireAuth, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();
const idOf = (value: string | string[]) => Number(Array.isArray(value) ? value[0] : value);

async function taxonomy() {
  const categories = await db.select().from(categoriesTable).where(eq(categoriesTable.isActive, true)).orderBy(asc(categoriesTable.sortOrder), asc(categoriesTable.name));
  const specializations = await db.select().from(specializationsTable).where(eq(specializationsTable.isActive, true)).orderBy(asc(specializationsTable.sortOrder), asc(specializationsTable.name));
  const services = await db.select().from(servicesTable).where(eq(servicesTable.isActive, true)).orderBy(asc(servicesTable.sortOrder), asc(servicesTable.name));
  return categories.map((category) => ({ ...category, specializations: specializations.filter((item) => item.categoryId === category.id).map((item) => ({ ...item, services: services.filter((service) => service.specializationId === item.id) })) }));
}

router.get("/taxonomy", async (_req, res) => res.json(await taxonomy()));
router.get("/categories", async (_req, res) => res.json(await taxonomy()));

router.get("/providers/me/taxonomy", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const [provider] = await db.select().from(providersTable).where(eq(providersTable.userId, req.userId!));
  if (!provider) { res.status(404).json({ error: "ملف المهني غير موجود" }); return; }
  const selectedSpecializations = await db.select().from(providerSpecializationsTable).where(eq(providerSpecializationsTable.providerId, provider.id));
  const selectedServices = await db.select().from(providerServicesTable).where(eq(providerServicesTable.providerId, provider.id));
  res.json({ primarySpecializationId: selectedSpecializations.find((item) => item.isPrimary)?.specializationId ?? null, specializationIds: selectedSpecializations.map((item) => item.specializationId), serviceIds: selectedServices.map((item) => item.serviceId) });
});

router.put("/providers/me/taxonomy", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  if (req.userRole !== "provider") { res.status(403).json({ error: "هذا المسار للمهنيين فقط" }); return; }
  const [provider] = await db.select().from(providersTable).where(eq(providersTable.userId, req.userId!));
  if (!provider) { res.status(404).json({ error: "ملف المهني غير موجود" }); return; }
  const specializationIds: number[] = [...new Set<number>((Array.isArray(req.body?.specializationIds) ? req.body.specializationIds : []).map((value: unknown) => Number(value)).filter((value: number) => Number.isInteger(value)))];
  const serviceIds: number[] = [...new Set<number>((Array.isArray(req.body?.serviceIds) ? req.body.serviceIds : []).map((value: unknown) => Number(value)).filter((value: number) => Number.isInteger(value)))];
  const primary = Number(req.body?.primarySpecializationId);
  if (!specializationIds.length || !specializationIds.includes(primary) || !serviceIds.length) { res.status(400).json({ error: "اختر تخصصًا رئيسيًا وتخصصًا واحدًا على الأقل وخدمة واحدة على الأقل" }); return; }
  const validSpecs = await db.select({ id: specializationsTable.id }).from(specializationsTable).where(and(eq(specializationsTable.isActive, true)));
  const validSpecIds = new Set(validSpecs.map((item) => item.id));
  const validServices = await db.select({ id: servicesTable.id, specializationId: servicesTable.specializationId }).from(servicesTable).where(eq(servicesTable.isActive, true));
  const validServiceIds = new Set(validServices.filter((item) => specializationIds.includes(item.specializationId)).map((item) => item.id));
  if (specializationIds.some((id) => !validSpecIds.has(id)) || serviceIds.some((id) => !validServiceIds.has(id))) { res.status(400).json({ error: "يوجد تخصص أو خدمة غير صالح" }); return; }
  await db.delete(providerSpecializationsTable).where(eq(providerSpecializationsTable.providerId, provider.id));
  await db.delete(providerServicesTable).where(eq(providerServicesTable.providerId, provider.id));
  await db.insert(providerSpecializationsTable).values(specializationIds.map((specializationId) => ({ providerId: provider.id, specializationId, isPrimary: specializationId === primary })));
  await db.insert(providerServicesTable).values(serviceIds.map((serviceId) => ({ providerId: provider.id, serviceId })));
  res.json({ primarySpecializationId: primary, specializationIds, serviceIds });
});

router.post("/admin/specializations", requireAuth, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const { categoryId, name, sortOrder = 0 } = req.body ?? {};
  if (!Number.isInteger(Number(categoryId)) || typeof name !== "string" || name.trim().length < 2) { res.status(400).json({ error: "بيانات التخصص غير صالحة" }); return; }
  const [item] = await db.insert(specializationsTable).values({ categoryId: Number(categoryId), name: name.trim(), sortOrder: Number(sortOrder) || 0 }).returning();
  res.status(201).json(item);
});
router.post("/admin/services", requireAuth, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const { specializationId, name, sortOrder = 0 } = req.body ?? {};
  if (!Number.isInteger(Number(specializationId)) || typeof name !== "string" || name.trim().length < 2) { res.status(400).json({ error: "بيانات الخدمة غير صالحة" }); return; }
  const [item] = await db.insert(servicesTable).values({ specializationId: Number(specializationId), name: name.trim(), sortOrder: Number(sortOrder) || 0 }).returning();
  res.status(201).json(item);
});
router.patch("/admin/specializations/:id", requireAuth, requireAdmin, async (req: AuthRequest, res) => { const id = idOf(req.params.id); const [item] = await db.update(specializationsTable).set({ name: String(req.body?.name ?? "").trim(), isActive: Boolean(req.body?.isActive), sortOrder: Number(req.body?.sortOrder) || 0 }).where(eq(specializationsTable.id, id)).returning(); res.json(item); });
router.patch("/admin/services/:id", requireAuth, requireAdmin, async (req: AuthRequest, res) => { const id = idOf(req.params.id); const [item] = await db.update(servicesTable).set({ name: String(req.body?.name ?? "").trim(), isActive: Boolean(req.body?.isActive), sortOrder: Number(req.body?.sortOrder) || 0 }).where(eq(servicesTable.id, id)).returning(); res.json(item); });
router.patch("/admin/categories/:id", requireAuth, requireAdmin, async (req: AuthRequest, res) => { const id = idOf(req.params.id); const [item] = await db.update(categoriesTable).set({ name: String(req.body?.name ?? "").trim(), icon: String(req.body?.icon ?? "🔧"), isActive: Boolean(req.body?.isActive), sortOrder: Number(req.body?.sortOrder) || 0 }).where(eq(categoriesTable.id, id)).returning(); res.json(item); });

export default router;
