import { Router, type IRouter } from "express";
import { db, providersTable, usersTable, categoriesTable, favoritesTable, portfolioItemsTable } from "@workspace/db";
import { eq, and, gte, ilike, or, desc, asc, count, sql } from "drizzle-orm";
import { requireAuth, optionalAuth, type AuthRequest } from "../middlewares/auth";
import {
  ListProvidersQueryParams,
  GetProviderParams,
  UpdateProviderParams,
  UpdateProviderBody,
  GetNearbyProvidersQueryParams,
  GetTopRatedProvidersQueryParams,
  GetMostRequestedProvidersQueryParams,
  GetProviderPortfolioParams,
  AddPortfolioItemParams,
  AddPortfolioItemBody,
  GetHomeFeedQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function providerSummary(p: any, user: any, cat: any, distanceKm?: number | null) {
  return {
    id: p.id,
    name: user.name,
    avatarUrl: user.avatarUrl ?? null,
    categoryName: cat?.name ?? "",
    categoryIcon: cat?.icon ?? null,
    city: p.city,
    district: p.district,
    rating: parseFloat(p.rating ?? "0"),
    reviewCount: p.reviewCount,
    completedJobs: p.completedJobs,
    yearsExperience: p.yearsExperience,
    hourlyRate: p.hourlyRate ? parseFloat(p.hourlyRate) : null,
    isVerified: p.isVerified,
    isAvailable: p.isAvailable,
    distanceKm: distanceKm ?? null,
    lat: p.lat ? parseFloat(p.lat) : null,
    lng: p.lng ? parseFloat(p.lng) : null,
  };
}

function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

router.get("/providers/nearby", async (req, res): Promise<void> => {
  const params = GetNearbyProvidersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { lat, lng, categoryId, radiusKm = 10, limit = 10 } = params.data;
  let q = db
    .select({ p: providersTable, u: usersTable, c: categoriesTable })
    .from(providersTable)
    .innerJoin(usersTable, eq(providersTable.userId, usersTable.id))
    .innerJoin(categoriesTable, eq(providersTable.categoryId, categoriesTable.id))
    .where(
      and(
        eq(usersTable.status, "active"),
        categoryId ? eq(providersTable.categoryId, categoryId) : undefined,
      )
    );

  const rows = await q;
  const withDistance = rows
    .map((r) => ({
      ...r,
      dist: r.p.lat && r.p.lng
        ? calcDistance(lat, lng, parseFloat(r.p.lat), parseFloat(r.p.lng))
        : 999,
    }))
    .filter((r) => r.dist <= (radiusKm ?? 10))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, limit ?? 10);

  res.json(withDistance.map((r) => providerSummary(r.p, r.u, r.c, r.dist)));
});

router.get("/providers/top-rated", async (req, res): Promise<void> => {
  const params = GetTopRatedProvidersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { categoryId, limit = 10 } = params.data;
  const rows = await db
    .select({ p: providersTable, u: usersTable, c: categoriesTable })
    .from(providersTable)
    .innerJoin(usersTable, eq(providersTable.userId, usersTable.id))
    .innerJoin(categoriesTable, eq(providersTable.categoryId, categoriesTable.id))
    .where(
      and(
        eq(usersTable.status, "active"),
        categoryId ? eq(providersTable.categoryId, categoryId) : undefined,
      )
    )
    .orderBy(desc(providersTable.rating))
    .limit(limit ?? 10);

  res.json(rows.map((r) => providerSummary(r.p, r.u, r.c)));
});

router.get("/providers/most-requested", async (req, res): Promise<void> => {
  const params = GetMostRequestedProvidersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { limit = 10 } = params.data;
  const rows = await db
    .select({ p: providersTable, u: usersTable, c: categoriesTable })
    .from(providersTable)
    .innerJoin(usersTable, eq(providersTable.userId, usersTable.id))
    .innerJoin(categoriesTable, eq(providersTable.categoryId, categoriesTable.id))
    .where(eq(usersTable.status, "active"))
    .orderBy(desc(providersTable.completedJobs))
    .limit(limit ?? 10);

  res.json(rows.map((r) => providerSummary(r.p, r.u, r.c)));
});

router.get("/providers", optionalAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = ListProvidersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { categoryId, city, district, search, minRating, sortBy, page = 1, limit = 20 } = params.data;

  const conditions: any[] = [eq(usersTable.status, "active")];
  if (categoryId) conditions.push(eq(providersTable.categoryId, categoryId));
  if (city) conditions.push(ilike(providersTable.city, `%${city}%`));
  if (district) conditions.push(ilike(providersTable.district, `%${district}%`));
  if (minRating) conditions.push(gte(sql`CAST(${providersTable.rating} AS DECIMAL)`, minRating));
  if (search) {
    conditions.push(
      or(
        ilike(usersTable.name, `%${search}%`),
        ilike(providersTable.city, `%${search}%`),
        ilike(providersTable.district, `%${search}%`),
      )
    );
  }

  const offset = ((page ?? 1) - 1) * (limit ?? 20);

  let orderBy: any = desc(providersTable.rating);
  if (sortBy === "experience") orderBy = desc(providersTable.yearsExperience);
  else if (sortBy === "rating") orderBy = desc(providersTable.rating);

  const rows = await db
    .select({ p: providersTable, u: usersTable, c: categoriesTable })
    .from(providersTable)
    .innerJoin(usersTable, eq(providersTable.userId, usersTable.id))
    .innerJoin(categoriesTable, eq(providersTable.categoryId, categoriesTable.id))
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(limit ?? 20)
    .offset(offset);

  const [totalRow] = await db
    .select({ cnt: count(providersTable.id) })
    .from(providersTable)
    .innerJoin(usersTable, eq(providersTable.userId, usersTable.id))
    .where(and(...conditions));

  res.json({
    providers: rows.map((r) => {
      let dist: number | null = null;
      if (params.data.lat && params.data.lng && r.p.lat && r.p.lng) {
        dist = calcDistance(params.data.lat, params.data.lng, parseFloat(r.p.lat), parseFloat(r.p.lng));
      }
      return providerSummary(r.p, r.u, r.c, dist);
    }),
    total: Number(totalRow?.cnt ?? 0),
    page: page ?? 1,
    limit: limit ?? 20,
  });
});

router.get("/providers/me", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  if (req.userRole !== "provider") { res.status(403).json({ error: "هذا المسار للمهنيين فقط" }); return; }
  const [row] = await db
    .select({ p: providersTable, u: usersTable, c: categoriesTable })
    .from(providersTable)
    .innerJoin(usersTable, eq(providersTable.userId, usersTable.id))
    .leftJoin(categoriesTable, eq(providersTable.categoryId, categoriesTable.id))
    .where(eq(providersTable.userId, req.userId!));
  if (!row) { res.status(404).json({ error: "لم يتم إنشاء ملف مهني بعد" }); return; }
  res.json({
    id: row.p.id,
    name: row.u.name,
    avatarUrl: row.u.avatarUrl ?? null,
    categoryId: row.p.categoryId,
    categoryName: row.c?.name ?? "",
    categoryIcon: row.c?.icon ?? null,
    city: row.p.city,
    district: row.p.district,
    bio: row.p.bio,
    rating: parseFloat(row.p.rating ?? "0"),
    reviewCount: row.p.reviewCount,
    completedJobs: row.p.completedJobs,
    yearsExperience: row.p.yearsExperience,
    hourlyRate: row.p.hourlyRate ? parseFloat(row.p.hourlyRate) : null,
    phone: row.u.phone,
    whatsapp: row.p.whatsapp ?? null,
    isVerified: row.p.isVerified,
    isAvailable: row.p.isAvailable,
    lat: row.p.lat ? parseFloat(row.p.lat) : null,
    lng: row.p.lng ? parseFloat(row.p.lng) : null,
    isFavorited: false,
    createdAt: row.p.createdAt.toISOString(),
  });
});

router.get("/providers/:id", optionalAuth, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [row] = await db
    .select({ p: providersTable, u: usersTable, c: categoriesTable })
    .from(providersTable)
    .innerJoin(usersTable, eq(providersTable.userId, usersTable.id))
    .innerJoin(categoriesTable, eq(providersTable.categoryId, categoriesTable.id))
    .where(eq(providersTable.id, id));

  if (!row) { res.status(404).json({ error: "Provider not found" }); return; }

  let isFavorited = false;
  if (req.userId) {
    const [fav] = await db
      .select()
      .from(favoritesTable)
      .where(and(eq(favoritesTable.userId, req.userId), eq(favoritesTable.providerId, id)));
    isFavorited = !!fav;
  }

  res.json({
    id: row.p.id,
    name: row.u.name,
    avatarUrl: row.u.avatarUrl ?? null,
    categoryId: row.p.categoryId,
    categoryName: row.c.name,
    categoryIcon: row.c.icon,
    city: row.p.city,
    district: row.p.district,
    bio: row.p.bio,
    rating: parseFloat(row.p.rating ?? "0"),
    reviewCount: row.p.reviewCount,
    completedJobs: row.p.completedJobs,
    yearsExperience: row.p.yearsExperience,
    hourlyRate: row.p.hourlyRate ? parseFloat(row.p.hourlyRate) : null,
    phone: row.u.phone,
    whatsapp: row.p.whatsapp ?? null,
    isVerified: row.p.isVerified,
    isAvailable: row.p.isAvailable,
    lat: row.p.lat ? parseFloat(row.p.lat) : null,
    lng: row.p.lng ? parseFloat(row.p.lng) : null,
    isFavorited,
    createdAt: row.p.createdAt.toISOString(),
  });
});

router.patch("/providers/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateProviderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [provider] = await db.select().from(providersTable).where(eq(providersTable.id, id));
  if (!provider) { res.status(404).json({ error: "Provider not found" }); return; }
  if (provider.userId !== req.userId && req.userRole !== "admin") {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const updateData: any = {};
  const d = parsed.data;
  if (d.bio != null) updateData.bio = d.bio;
  if (d.city != null) updateData.city = d.city;
  if (d.district != null) updateData.district = d.district;
  if (d.yearsExperience != null) updateData.yearsExperience = d.yearsExperience;
  if (d.hourlyRate != null) updateData.hourlyRate = String(d.hourlyRate);
  if (d.whatsapp != null) updateData.whatsapp = d.whatsapp;
  if (d.isAvailable != null) updateData.isAvailable = d.isAvailable;
  if (d.lat != null) updateData.lat = String(d.lat);
  if (d.lng != null) updateData.lng = String(d.lng);

  const [updated] = await db.update(providersTable).set(updateData).where(eq(providersTable.id, id)).returning();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId));
  const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, updated.categoryId));

  res.json({
    id: updated.id,
    name: user.name,
    avatarUrl: user.avatarUrl ?? null,
    categoryId: updated.categoryId,
    categoryName: cat?.name ?? "",
    categoryIcon: cat?.icon ?? null,
    city: updated.city,
    district: updated.district,
    bio: updated.bio,
    rating: parseFloat(updated.rating ?? "0"),
    reviewCount: updated.reviewCount,
    completedJobs: updated.completedJobs,
    yearsExperience: updated.yearsExperience,
    hourlyRate: updated.hourlyRate ? parseFloat(updated.hourlyRate) : null,
    phone: user.phone,
    whatsapp: updated.whatsapp ?? null,
    isVerified: updated.isVerified,
    isAvailable: updated.isAvailable,
    lat: updated.lat ? parseFloat(updated.lat) : null,
    lng: updated.lng ? parseFloat(updated.lng) : null,
    isFavorited: false,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.get("/providers/:id/portfolio", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const items = await db.select().from(portfolioItemsTable).where(eq(portfolioItemsTable.providerId, id));
  res.json(items.map((i) => ({
    id: i.id,
    imageUrl: i.imageUrl,
    description: i.description ?? null,
    providerId: i.providerId,
    createdAt: i.createdAt.toISOString(),
  })));
});

router.post("/providers/:id/portfolio", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = AddPortfolioItemBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [item] = await db.insert(portfolioItemsTable).values({
    providerId: id,
    imageUrl: parsed.data.imageUrl,
    description: parsed.data.description ?? null,
  }).returning();

  res.status(201).json({
    id: item.id,
    imageUrl: item.imageUrl,
    description: item.description ?? null,
    providerId: item.providerId,
    createdAt: item.createdAt.toISOString(),
  });
});

router.get("/home-feed", optionalAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = GetHomeFeedQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [cats, topRated, mostRequested] = await Promise.all([
    db.select().from(categoriesTable),
    db
      .select({ p: providersTable, u: usersTable, c: categoriesTable })
      .from(providersTable)
      .innerJoin(usersTable, eq(providersTable.userId, usersTable.id))
      .innerJoin(categoriesTable, eq(providersTable.categoryId, categoriesTable.id))
      .where(eq(usersTable.status, "active"))
      .orderBy(desc(providersTable.rating))
      .limit(6),
    db
      .select({ p: providersTable, u: usersTable, c: categoriesTable })
      .from(providersTable)
      .innerJoin(usersTable, eq(providersTable.userId, usersTable.id))
      .innerJoin(categoriesTable, eq(providersTable.categoryId, categoriesTable.id))
      .where(eq(usersTable.status, "active"))
      .orderBy(desc(providersTable.completedJobs))
      .limit(6),
  ]);

  const provCounts = await db
    .select({ categoryId: providersTable.categoryId, cnt: count(providersTable.id) })
    .from(providersTable)
    .groupBy(providersTable.categoryId);
  const countMap = new Map(provCounts.map((c) => [c.categoryId, Number(c.cnt)]));

  let nearbyProviders: any[] = [];
  if (params.data.lat && params.data.lng) {
    const allRows = await db
      .select({ p: providersTable, u: usersTable, c: categoriesTable })
      .from(providersTable)
      .innerJoin(usersTable, eq(providersTable.userId, usersTable.id))
      .innerJoin(categoriesTable, eq(providersTable.categoryId, categoriesTable.id))
      .where(eq(usersTable.status, "active"));
    nearbyProviders = allRows
      .map((r) => ({
        ...r,
        dist: r.p.lat && r.p.lng
          ? calcDistance(params.data.lat!, params.data.lng!, parseFloat(r.p.lat), parseFloat(r.p.lng))
          : 999,
      }))
      .filter((r) => r.dist <= 15)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 6)
      .map((r) => providerSummary(r.p, r.u, r.c, r.dist));
  }

  res.json({
    categories: cats.map((cat) => ({ id: cat.id, name: cat.name, icon: cat.icon, providerCount: countMap.get(cat.id) ?? 0 })),
    nearbyProviders,
    topRatedProviders: topRated.map((r) => providerSummary(r.p, r.u, r.c)),
    mostRequestedProviders: mostRequested.map((r) => providerSummary(r.p, r.u, r.c)),
    recentRequests: [],
  });
});

export default router;
