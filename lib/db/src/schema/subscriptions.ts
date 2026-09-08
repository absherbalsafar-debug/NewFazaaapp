import { pgEnum, pgTable, serial, integer, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { providersTable } from "./providers";

export const subscriptionPlanEnum = pgEnum("subscription_plan", ["free", "monthly", "yearly"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "pending", "expired", "cancelled"]);

export const providerSubscriptionsTable = pgTable("provider_subscriptions", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull().references(() => providersTable.id, { onDelete: "cascade" }),
  plan: subscriptionPlanEnum("plan").notNull(),
  status: subscriptionStatusEnum("status").notNull().default("pending"),
  freeSlotNumber: integer("free_slot_number"),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: date("ends_at", { mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProviderSubscriptionSchema = createInsertSchema(providerSubscriptionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProviderSubscription = z.infer<typeof insertProviderSubscriptionSchema>;
export type ProviderSubscription = typeof providerSubscriptionsTable.$inferSelect;