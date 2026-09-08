import { pgEnum, pgTable, serial, integer, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { providersTable } from "./providers";
import { categoriesTable } from "./categories";

export const advertisementPlanEnum = pgEnum("advertisement_plan", ["standard", "featured", "homepage"]);
export const advertisementStatusEnum = pgEnum("advertisement_status", ["pending", "active", "rejected", "expired"]);

export const advertisementsTable = pgTable("advertisements", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull().references(() => providersTable.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").references(() => categoriesTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  city: text("city").notNull(),
  district: text("district").notNull().default(""),
  targetAudience: text("target_audience"),
  plan: advertisementPlanEnum("plan").notNull().default("standard"),
  durationDays: integer("duration_days").notNull().default(7),
  budget: numeric("budget", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  status: advertisementStatusEnum("status").notNull().default("pending"),
  reviewNote: text("review_note"),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAdvertisementSchema = createInsertSchema(advertisementsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAdvertisement = z.infer<typeof insertAdvertisementSchema>;
export type Advertisement = typeof advertisementsTable.$inferSelect;