import { pgTable, serial, text, integer, numeric, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { providersTable } from "./providers";

export const requestStatusEnum = pgEnum("request_status", [
  "pending", "accepted", "rejected", "in_progress", "completed", "cancelled"
]);

export const serviceRequestsTable = pgTable("service_requests", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  providerId: integer("provider_id").notNull().references(() => providersTable.id, { onDelete: "cascade" }),
  status: requestStatusEnum("status").notNull().default("pending"),
  serviceType: text("service_type").notNull(),
  description: text("description").notNull(),
  city: text("city").notNull(),
  district: text("district").notNull(),
  lat: numeric("lat", { precision: 10, scale: 7 }),
  lng: numeric("lng", { precision: 10, scale: 7 }),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  isImmediate: boolean("is_immediate").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertServiceRequestSchema = createInsertSchema(serviceRequestsTable).omit({ id: true, createdAt: true, updatedAt: true, completedAt: true });
export type InsertServiceRequest = z.infer<typeof insertServiceRequestSchema>;
export type ServiceRequest = typeof serviceRequestsTable.$inferSelect;
