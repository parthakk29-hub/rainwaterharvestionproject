import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  decimal,
  text,
  boolean,
  integer,
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
  // Efficiency features
  governmentIncentives: decimal("government_incentives", { precision: 10, scale: 2 }), // in rupees
  subsidyAmount: decimal("subsidy_amount", { precision: 10, scale: 2 }), // in rupees
  taxBenefits: decimal("tax_benefits", { precision: 10, scale: 2 }), // in rupees
  annualMaintenanceCost: decimal("annual_maintenance_cost", { precision: 8, scale: 2 }), // in rupees
  filterReplacementCost: decimal("filter_replacement_cost", { precision: 6, scale: 2 }), // in rupees
  systemInspectionCost: decimal("system_inspection_cost", { precision: 6, scale: 2 }), // in rupees
  upgradationCost: decimal("upgradation_cost", { precision: 10, scale: 2 }), // in rupees
  capacityExpansionCost: decimal("capacity_expansion_cost", { precision: 10, scale: 2 }), // in rupees
  efficiencyImprovementCost: decimal("efficiency_improvement_cost", { precision: 10, scale: 2 }), // in rupees
  paybackPeriod: decimal("payback_period", { precision: 4, scale: 1 }), // in years
  roi: decimal("roi", { precision: 5, scale: 2 }), // return on investment percentage
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Weather forecast data
export const weatherForecasts = pgTable("weather_forecasts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userProfileId: varchar("user_profile_id").notNull().references(() => userProfiles.id),
  date: timestamp("date").notNull(),
  temperature: decimal("temperature", { precision: 4, scale: 1 }),
  maxTemperature: decimal("max_temperature", { precision: 4, scale: 1 }),
  minTemperature: decimal("min_temperature", { precision: 4, scale: 1 }),
  precipitationSum: decimal("precipitation_sum", { precision: 6, scale: 2 }), // in mm
  weatherCode: integer("weather_code"), // WMO weather code
  windSpeed: decimal("wind_speed", { precision: 5, scale: 2 }),
  rainType: varchar("rain_type"), // light, moderate, heavy, storm
  collectableRain: boolean("collectable_rain").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notification system
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // rain_alert, maintenance_reminder, system_update
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  emailSent: boolean("email_sent").default(false),
  rainType: varchar("rain_type"), // for rain alerts
  expectedRainfall: decimal("expected_rainfall", { precision: 6, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
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

export const insertWeatherForecastSchema = createInsertSchema(weatherForecasts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertWaterCalculation = z.infer<typeof insertWaterCalculationSchema>;
export type WaterCalculation = typeof waterCalculations.$inferSelect;
export type InsertWeatherForecast = z.infer<typeof insertWeatherForecastSchema>;
export type WeatherForecast = typeof weatherForecasts.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
