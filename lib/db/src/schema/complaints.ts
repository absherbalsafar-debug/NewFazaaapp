import { pgEnum, pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { providersTable } from "./providers";
import { serviceRequestsTable } from "./service_requests";

export const complaintStatusEnum = pgEnum("complaint_status", ["open", "under_review", "resolved", "rejected", "closed"]);
export const complaintPriorityEnum = pgEnum("complaint_priority", ["low", "normal", "high", "urgent"]);

export const complaintsTable = pgTable("complaints", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  providerId: integer("provider_id").notNull().references(() => providersTable.id, { onDelete: "cascade" }),
  requestId: integer("request_id").references(() => serviceRequestsTable.id, { onDelete: "set null" }),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  status: complaintStatusEnum("status").notNull().default("open"),
  priority: complaintPriorityEnum("priority").notNull().default("normal"),
  resolutionNote: text("resolution_note"),
  assignedTo: integer("assigned_to").references(() => usersTable.id, { onDelete: "set null" }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const complaintEvidenceTable = pgTable("complaint_evidence", {
  id: serial("id").primaryKey(),
  complaintId: integer("complaint_id").notNull().references(() => complaintsTable.id, { onDelete: "cascade" }),
  objectPath: text("object_path").notNull(),
  originalName: text("original_name").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
