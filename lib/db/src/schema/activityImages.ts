import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { activitiesTable } from "./activities";

export const activityImagesTable = pgTable("activity_images", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id")
    .notNull()
    .references(() => activitiesTable.id, { onDelete: "cascade" }),
  objectPath: text("object_path").notNull(),
  altText: text("alt_text").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ActivityImage = typeof activityImagesTable.$inferSelect;
