import {
  users,
  userProfiles,
  waterCalculations,
  weatherForecasts,
  notifications,
  type User,
  type UpsertUser,
  type UserProfile,
  type InsertUserProfile,
  type WaterCalculation,
  type InsertWaterCalculation,
  type WeatherForecast,
  type InsertWeatherForecast,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, and } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // User profile operations
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: string, profile: Partial<InsertUserProfile>): Promise<UserProfile>;
  
  // Water calculation operations
  getWaterCalculations(userProfileId: string): Promise<WaterCalculation | undefined>;
  createWaterCalculations(calculations: InsertWaterCalculation): Promise<WaterCalculation>;
  updateWaterCalculations(userProfileId: string, calculations: Partial<InsertWaterCalculation>): Promise<WaterCalculation>;
  
  // Weather forecast operations
  getWeatherForecasts(userProfileId: string): Promise<WeatherForecast[]>;
  createWeatherForecast(forecast: InsertWeatherForecast): Promise<WeatherForecast>;
  updateWeatherForecasts(userProfileId: string, forecasts: InsertWeatherForecast[]): Promise<WeatherForecast[]>;
  
  // Notification operations
  getUserNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(notificationId: string): Promise<Notification>;
  getUnreadNotificationCount(userId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // User profile operations
  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId));
    return profile;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [newProfile] = await db
      .insert(userProfiles)
      .values(profile)
      .returning();
    return newProfile;
  }

  async updateUserProfile(userId: string, profile: Partial<InsertUserProfile>): Promise<UserProfile> {
    const [updatedProfile] = await db
      .update(userProfiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return updatedProfile;
  }

  // Water calculation operations
  async getWaterCalculations(userProfileId: string): Promise<WaterCalculation | undefined> {
    const [calculations] = await db
      .select()
      .from(waterCalculations)
      .where(eq(waterCalculations.userProfileId, userProfileId));
    return calculations;
  }

  async createWaterCalculations(calculations: InsertWaterCalculation): Promise<WaterCalculation> {
    const [newCalculations] = await db
      .insert(waterCalculations)
      .values(calculations)
      .returning();
    return newCalculations;
  }

  async updateWaterCalculations(userProfileId: string, calculations: Partial<InsertWaterCalculation>): Promise<WaterCalculation> {
    const [updatedCalculations] = await db
      .update(waterCalculations)
      .set({ ...calculations, updatedAt: new Date() })
      .where(eq(waterCalculations.userProfileId, userProfileId))
      .returning();
    return updatedCalculations;
  }

  // Weather forecast operations
  async getWeatherForecasts(userProfileId: string): Promise<WeatherForecast[]> {
    const forecasts = await db
      .select()
      .from(weatherForecasts)
      .where(eq(weatherForecasts.userProfileId, userProfileId))
      .orderBy(desc(weatherForecasts.date))
      .limit(7);
    return forecasts;
  }

  async createWeatherForecast(forecast: InsertWeatherForecast): Promise<WeatherForecast> {
    const [newForecast] = await db
      .insert(weatherForecasts)
      .values(forecast)
      .returning();
    return newForecast;
  }

  async updateWeatherForecasts(userProfileId: string, forecasts: InsertWeatherForecast[]): Promise<WeatherForecast[]> {
    // Delete existing forecasts for this user profile
    await db.delete(weatherForecasts).where(eq(weatherForecasts.userProfileId, userProfileId));
    
    // Insert new forecasts
    const newForecasts = await db
      .insert(weatherForecasts)
      .values(forecasts)
      .returning();
    return newForecasts;
  }

  // Notification operations
  async getUserNotifications(userId: string): Promise<Notification[]> {
    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
    return userNotifications;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async markNotificationAsRead(notificationId: string): Promise<Notification> {
    const [updatedNotification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId))
      .returning();
    return updatedNotification;
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result.count;
  }
}

export const storage = new DatabaseStorage();
