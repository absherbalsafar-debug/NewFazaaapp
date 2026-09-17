import { pgTable, serial, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userRoleEnum = pgEnum("user_role", ["client", "provider", "admin", "verification_staff"]);
export const userStatusEnum = pgEnum("user_status", ["active", "pending", "banned"]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  email: text("email").unique(),
  passwordHash: text("password_hash"),
  googleId: text("google_id").unique(),
  phoneVerified: boolean("phone_verified").notNull().default(false),
  emailVerified: boolean("email_verified").notNull().default(false),
  role: userRoleEnum("role").notNull().default("client"),
  status: userStatusEnum("status").notNull().default("active"),
  avatarUrl: text("avatar_url"),
  city: text("city"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
