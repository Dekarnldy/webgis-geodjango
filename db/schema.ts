import { pgTable, serial, text, doublePrecision, timestamp } from "drizzle-orm/pg-core";

export const points = pgTable("points", {
  id: serial().primaryKey(),
  name: text().notNull(),
  description: text(),
  longitude: doublePrecision().notNull(),
  latitude: doublePrecision().notNull(),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
});
