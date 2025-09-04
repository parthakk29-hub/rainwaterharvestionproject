import {
  users,
  userProfiles,
  waterCalculations,
  type User,
  type UpsertUser,
  type UserProfile,
  type InsertUserProfile,
  type WaterCalculation,
  type InsertWaterCalculation,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
