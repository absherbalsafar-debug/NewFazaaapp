import { integer, pgTable, serial, text, timestamp, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { providersTable } from "./providers";
import { categoriesTable } from "./categories";

export const specializationsTable = pgTable("specializations", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => categoriesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({ nameByCategory: uniqueIndex("specializations_category_name_unique").on(table.categoryId, table.name) }));

export const servicesTable = pgTable("professional_services", {
  id: serial("id").primaryKey(),
  specializationId: integer("specialization_id").notNull().references(() => specializationsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({ nameBySpecialization: uniqueIndex("services_specialization_name_unique").on(table.specializationId, table.name) }));

export const providerSpecializationsTable = pgTable("provider_specializations", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull().references(() => providersTable.id, { onDelete: "cascade" }),
  specializationId: integer("specialization_id").notNull().references(() => specializationsTable.id, { onDelete: "cascade" }),
  isPrimary: boolean("is_primary").notNull().default(false),
}, (table) => ({ providerSpecializationUnique: uniqueIndex("provider_specialization_unique").on(table.providerId, table.specializationId) }));

export const providerServicesTable = pgTable("provider_services", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull().references(() => providersTable.id, { onDelete: "cascade" }),
  serviceId: integer("service_id").notNull().references(() => servicesTable.id, { onDelete: "cascade" }),
}, (table) => ({ providerServiceUnique: uniqueIndex("provider_service_unique").on(table.providerId, table.serviceId) }));
