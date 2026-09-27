import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const containers = pgTable("containers", {
  id: serial().primaryKey(),
  containerNumber: text("container_number").notNull(),
  originPort: text("origin_port").notNull(),
  destinationPort: text("destination_port").notNull(),
  status: text("status").notNull().default("in_transit"),
  eta: timestamp("eta").notNull(),
  arrivedAt: timestamp("arrived_at"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
