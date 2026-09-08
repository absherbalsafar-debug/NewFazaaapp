import { pgTable, integer, timestamp } from "drizzle-orm/pg-core";
import { providersTable } from "./providers";

export const providerMetricsTable = pgTable("provider_metrics", {
  providerId: integer("provider_id").primaryKey().references(() => providersTable.id, { onDelete: "cascade" }),
  profileViews: integer("profile_views").notNull().default(0),
  callClicks: integer("call_clicks").notNull().default(0),
  whatsappClicks: integer("whatsapp_clicks").notNull().default(0),
  serviceRequests: integer("service_requests").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});