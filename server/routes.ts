import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertUserProfileSchema, insertWaterCalculationSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Also get user profile if it exists
      const profile = await storage.getUserProfile(userId);
      
      res.json({ user, profile });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User profile routes
  app.post('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profileData = insertUserProfileSchema.parse({
        ...req.body,
        userId,
      });

      // Check if profile already exists
      const existingProfile = await storage.getUserProfile(userId);
      if (existingProfile) {
        const updatedProfile = await storage.updateUserProfile(userId, profileData);
        return res.json(updatedProfile);
      }

      const profile = await storage.createUserProfile(profileData);
      res.json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      }
      console.error("Error creating/updating profile:", error);
      res.status(500).json({ message: "Failed to save profile" });
    }
  });

  app.get('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getUserProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Water calculation routes
  app.post('/api/calculations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getUserProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "User profile not found" });
      }

      // Calculate water collection based on rooftop area and rainfall
      const rooftopArea = parseFloat(profile.rooftopArea || "0");
      const monthlyRainfall = parseFloat(req.body.monthlyRainfall || "2.5");
      const runoffCoefficient = 0.85; // Standard coefficient for most roof materials

      // Formula: Volume (liters) = Rainfall (inches) × Roof Area (sq ft) × Runoff Coefficient × 0.623 (conversion factor)
      const monthlyCollection = monthlyRainfall * rooftopArea * runoffCoefficient * 0.623;
      const annualCollection = monthlyCollection * 12;
      
      // Estimate savings based on average water cost ($0.004 per gallon, ~$0.0015 per liter)
      const costPerLiter = 0.0015;
      const monthlySavings = monthlyCollection * costPerLiter;
      const annualSavings = annualCollection * costPerLiter;

      const calculationData = insertWaterCalculationSchema.parse({
        userProfileId: profile.id,
        monthlyRainfall,
        runoffCoefficient,
        monthlyCollection,
        monthlySavings,
        annualCollection,
        annualSavings,
      });

      // Check if calculations already exist
      const existingCalculations = await storage.getWaterCalculations(profile.id);
      if (existingCalculations) {
        const updatedCalculations = await storage.updateWaterCalculations(profile.id, calculationData);
        return res.json(updatedCalculations);
      }

      const calculations = await storage.createWaterCalculations(calculationData);
      res.json(calculations);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid calculation data", errors: error.errors });
      }
      console.error("Error creating calculations:", error);
      res.status(500).json({ message: "Failed to calculate water collection" });
    }
  });

  app.get('/api/calculations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getUserProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "User profile not found" });
      }

      const calculations = await storage.getWaterCalculations(profile.id);
      if (!calculations) {
        return res.status(404).json({ message: "Calculations not found" });
      }
      res.json(calculations);
    } catch (error) {
      console.error("Error fetching calculations:", error);
      res.status(500).json({ message: "Failed to fetch calculations" });
    }
  });

  // Weather/rainfall data endpoint (simplified - in production would integrate with weather API)
  app.get('/api/weather/:city', isAuthenticated, async (req: any, res) => {
    try {
      const { city } = req.params;
      
      // Simplified rainfall data - in production, integrate with weather API
      const rainfallData = {
        city,
        monthlyRainfall: 2.5, // inches
        annualRainfall: 30, // inches
        climateZone: "Temperate",
        nextForecast: "3 days",
        lastRain: "2 days ago"
      };
      
      res.json(rainfallData);
    } catch (error) {
      console.error("Error fetching weather data:", error);
      res.status(500).json({ message: "Failed to fetch weather data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
