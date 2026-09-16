import { pgEnum, pgTable, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { serviceRequestsTable } from "./service_requests";
import { providersTable } from "./providers";

export const commissionTypeEnum = pgEnum("commission_type", ["none", "percentage", "fixed"]);
export const commissionStatusEnum = pgEnum("commission_status", ["pending", "settled", "refunded"]);

export const commissionSettingsTable = pgTable("commission_settings", {
  id: serial("id").primaryKey(),
  type: commissionTypeEnum("type").notNull().default("none"),
  percentage: numeric("percentage", { precision: 5, scale: 2 }).notNull().default("0"),
  fixedAmount: numeric("fixed_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  isActive: integer("is_active").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const serviceCommissionsTable = pgTable("service_commissions", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().unique().references(() => serviceRequestsTable.id, { onDelete: "cascade" }),
  providerId: integer("provider_id").notNull().references(() => providersTable.id, { onDelete: "cascade" }),
  serviceAmount: numeric("service_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  commissionAmount: numeric("commission_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  status: commissionStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  settledAt: timestamp("settled_at", { withTimezone: true }),
});
