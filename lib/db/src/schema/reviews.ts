import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { providersTable } from "./providers";
import { serviceRequestsTable } from "./service_requests";

export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  providerId: integer("provider_id").notNull().references(() => providersTable.id, { onDelete: "cascade" }),
  requestId: integer("request_id").references(() => serviceRequestsTable.id, { onDelete: "set null" }),
  rating: integer("rating").notNull(),
  quality: integer("quality").notNull().default(0),
  punctuality: integer("punctuality").notNull().default(0),
  professionalism: integer("professionalism").notNull().default(0),
  communication: integer("communication").notNull().default(0),
  priceFairness: integer("price_fairness").notNull().default(0),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({ id: true, createdAt: true });
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;
