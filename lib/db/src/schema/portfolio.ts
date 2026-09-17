import { pgEnum, pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { providersTable } from "./providers";

export const portfolioReviewStatusEnum = pgEnum("portfolio_review_status", ["pending", "approved", "rejected", "hidden"]);
export const portfolioRejectionReasonEnum = pgEnum("portfolio_rejection_reason", ["unrelated", "low_quality", "contact_info", "external_ad", "not_original", "policy_violation", "insufficient_proof", "other"]);

export const portfolioItemsTable = pgTable("portfolio_items", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull().references(() => providersTable.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  description: text("description"),
  reviewStatus: portfolioReviewStatusEnum("review_status").notNull().default("pending"),
  rejectionReason: portfolioRejectionReasonEnum("rejection_reason"),
  reviewerNote: text("reviewer_note"),
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPortfolioItemSchema = createInsertSchema(portfolioItemsTable).omit({ id: true, createdAt: true });
export type InsertPortfolioItem = z.infer<typeof insertPortfolioItemSchema>;
export type PortfolioItem = typeof portfolioItemsTable.$inferSelect;
