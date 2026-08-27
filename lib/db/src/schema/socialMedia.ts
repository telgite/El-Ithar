import { pgTable, text, serial, boolean, integer } from "drizzle-orm/pg-core";

export const socialMediaTable = pgTable("social_media", {
  id: serial("id").primaryKey(),
  platform: text("platform").notNull().unique(), // "facebook", "instagram", etc.
  name: text("name").notNull(),
  url: text("url").notNull().default(""),
  enabled: boolean("enabled").notNull().default(false),
  visible: boolean("visible").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type SocialMedia = typeof socialMediaTable.$inferSelect;
