import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  decimal,
  text,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User profiles with rainwater harvesting data
export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name"),
  location: text("location"),
  city: varchar("city"),
  state: varchar("state"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  rooftopArea: decimal("rooftop_area", { precision: 10, scale: 2 }), // in square feet
  rooftopLength: decimal("rooftop_length", { precision: 8, scale: 2 }),
  rooftopWidth: decimal("rooftop_width", { precision: 8, scale: 2 }),
  rooftopType: varchar("rooftop_type"), // tile, metal, concrete, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Water calculations and savings data
export const waterCalculations = pgTable("water_calculations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userProfileId: varchar("user_profile_id").notNull().references(() => userProfiles.id),
  monthlyRainfall: decimal("monthly_rainfall", { precision: 6, scale: 2 }), // in inches
  runoffCoefficient: decimal("runoff_coefficient", { precision: 3, scale: 2 }), // typically 0.85
  monthlyCollection: decimal("monthly_collection", { precision: 10, scale: 2 }), // in liters
  monthlySavings: decimal("monthly_savings", { precision: 8, scale: 2 }), // in rupees
  annualCollection: decimal("annual_collection", { precision: 10, scale: 2 }),
  annualSavings: decimal("annual_savings", { precision: 8, scale: 2 }), // in rupees
  costRequiredRwh: decimal("cost_required_rwh", { precision: 10, scale: 2 }), // setup cost in rupees
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWaterCalculationSchema = createInsertSchema(waterCalculations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertWaterCalculation = z.infer<typeof insertWaterCalculationSchema>;
export type WaterCalculation = typeof waterCalculations.$inferSelect;
