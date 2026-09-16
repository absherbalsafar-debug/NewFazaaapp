import { pgEnum, pgTable, serial, text, integer, numeric, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { categoriesTable } from "./categories";

export const verificationStatusEnum = pgEnum("verification_status", ["pending", "approved", "rejected"]);
export const professionalStatusEnum = pgEnum("professional_status", ["draft", "incomplete", "awaiting_payment", "under_review", "approved", "rejected", "suspended", "expired"]);

export const providersTable = pgTable("providers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").notNull().references(() => categoriesTable.id),
  city: text("city").notNull().default("صنعاء"),
  district: text("district").notNull().default(""),
  bio: text("bio").notNull().default(""),
  yearsExperience: integer("years_experience").notNull().default(1),
  hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }),
  whatsapp: text("whatsapp"),
  freeSlotNumber: integer("free_slot_number"),
  isVerified: boolean("is_verified").notNull().default(false),
  verificationStatus: verificationStatusEnum("verification_status").notNull().default("pending"),
  professionalStatus: professionalStatusEnum("professional_status").notNull().default("incomplete"),
  isSubscriptionActive: boolean("is_subscription_active").notNull().default(false),
  isAvailable: boolean("is_available").notNull().default(true),
  lat: numeric("lat", { precision: 10, scale: 7 }),
  lng: numeric("lng", { precision: 10, scale: 7 }),
  rating: numeric("rating", { precision: 3, scale: 2 }).notNull().default("0"),
  reviewCount: integer("review_count").notNull().default(0),
  completedJobs: integer("completed_jobs").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProviderSchema = createInsertSchema(providersTable).omit({ id: true, createdAt: true, updatedAt: true, rating: true, reviewCount: true, completedJobs: true });
export type InsertProvider = z.infer<typeof insertProviderSchema>;
export type Provider = typeof providersTable.$inferSelect;
