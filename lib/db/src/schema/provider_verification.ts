import { pgEnum, pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { providersTable } from "./providers";

export const verificationDocumentTypeEnum = pgEnum("verification_document_type", [
  "id_front",
  "id_back",
  "selfie",
  "portfolio",
  "certificate",
]);

export const verificationDocumentStatusEnum = pgEnum("verification_document_status", [
  "pending",
  "approved",
  "rejected",
]);

export const providerVerificationDocumentsTable = pgTable("provider_verification_documents", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull().references(() => providersTable.id, { onDelete: "cascade" }),
  type: verificationDocumentTypeEnum("type").notNull(),
  objectPath: text("object_path").notNull(),
  originalName: text("original_name").notNull().default(""),
  status: verificationDocumentStatusEnum("status").notNull().default("pending"),
  reviewerNote: text("reviewer_note"),
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ProviderVerificationDocument = typeof providerVerificationDocumentsTable.$inferSelect;
