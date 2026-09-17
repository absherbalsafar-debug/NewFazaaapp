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
  "hidden",
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

export const verificationAuditActionEnum = pgEnum("verification_audit_action", [
  "submitted",
  "review_started",
  "approved",
  "rejected",
  "changes_requested",
  "hidden",
  "unhidden",
  "contact_updated",
]);

export const providerVerificationAuditTable = pgTable("provider_verification_audit", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull().references(() => providersTable.id, { onDelete: "cascade" }),
  documentId: integer("document_id").references(() => providerVerificationDocumentsTable.id, { onDelete: "set null" }),
  actorId: integer("actor_id").notNull(),
  action: verificationAuditActionEnum("action").notNull(),
  fromStatus: text("from_status"),
  toStatus: text("to_status"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ProviderVerificationDocument = typeof providerVerificationDocumentsTable.$inferSelect;
