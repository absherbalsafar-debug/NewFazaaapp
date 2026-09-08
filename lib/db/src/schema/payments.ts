import { pgEnum, pgTable, serial, integer, text, timestamp, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { providersTable } from "./providers";
import { providerSubscriptionsTable } from "./subscriptions";
import { usersTable } from "./users";

export const walletProviderEnum = pgEnum("wallet_provider", ["jeeb", "floosk", "jawali", "cash", "one_cash", "hasib", "easy"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "approved", "rejected", "expired", "refunded"]);

export const subscriptionPaymentsTable = pgTable("subscription_payments", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull().references(() => providersTable.id, { onDelete: "cascade" }),
  subscriptionId: integer("subscription_id").references(() => providerSubscriptionsTable.id, { onDelete: "set null" }),
  plan: text("plan").notNull(),
  wallet: walletProviderEnum("wallet").notNull(),
  transactionReference: text("transaction_reference").notNull(),
  receiptUrl: text("receipt_url"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  reviewedBy: integer("reviewed_by").references(() => usersTable.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const paymentWalletSettingsTable = pgTable("payment_wallet_settings", {
  id: serial("id").primaryKey(),
  wallet: walletProviderEnum("wallet").notNull(),
  merchantName: text("merchant_name").notNull().default(""),
  merchantAccount: text("merchant_account").notNull().default(""),
  instructions: text("instructions").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  walletUnique: uniqueIndex("payment_wallet_settings_wallet_unique").on(table.wallet),
}));

export const insertSubscriptionPaymentSchema = createInsertSchema(subscriptionPaymentsTable).omit({ id: true, createdAt: true });
export type InsertSubscriptionPayment = z.infer<typeof insertSubscriptionPaymentSchema>;
export type SubscriptionPayment = typeof subscriptionPaymentsTable.$inferSelect;
export const insertPaymentWalletSettingSchema = createInsertSchema(paymentWalletSettingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPaymentWalletSetting = z.infer<typeof insertPaymentWalletSettingSchema>;
export type PaymentWalletSetting = typeof paymentWalletSettingsTable.$inferSelect;