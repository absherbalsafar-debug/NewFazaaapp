import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { advertisementsTable } from "./advertisements";

export const advertisementMetricsTable = pgTable("advertisement_metrics", {
  id: serial("id").primaryKey(),
  advertisementId: integer("advertisement_id").notNull().references(() => advertisementsTable.id, { onDelete: "cascade" }),
  impressions: integer("impressions").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
  generatedRequests: integer("generated_requests").notNull().default(0),
  callClicks: integer("call_clicks").notNull().default(0),
  whatsappClicks: integer("whatsapp_clicks").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
