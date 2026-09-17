import { boolean, integer, jsonb, numeric, pgEnum, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const commercialPlanKindEnum = pgEnum("commercial_plan_kind", ["subscription", "advertisement"]);

export const commercialPlansTable = pgTable("commercial_plans", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(),
  kind: commercialPlanKindEnum("kind").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
  durationDays: integer("duration_days").notNull().default(30),
  benefits: jsonb("benefits").$type<string[]>().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({ codeKindUnique: uniqueIndex("commercial_plans_code_kind_unique").on(table.code, table.kind) }));
