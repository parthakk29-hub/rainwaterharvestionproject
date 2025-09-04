import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertUserProfileSchema, insertWaterCalculationSchema } from "@shared/schema";
import { z } from "zod";
import * as XLSX from "xlsx";

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
      
      // Estimate savings based on average water cost in India (₹0.12 per liter)
      const costPerLiter = 0.12;
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

  // Weather/rainfall data endpoint with OpenWeatherMap API integration
  app.get('/api/weather/:city', isAuthenticated, async (req: any, res) => {
    try {
      const { city } = req.params;
      const { lat, lon } = req.query;
      
      // Check if we have API key
      if (!process.env.OPENWEATHER_API_KEY) {
        // Fallback to mock data if no API key
        const rainfallData = {
          city,
          monthlyRainfall: 2.5,
          annualRainfall: 30,
          climateZone: "Temperate",
          nextForecast: "3 days",
          lastRain: "2 days ago"
        };
        return res.json(rainfallData);
      }

      // Use coordinates if provided, otherwise geocode city name
      let weatherData;
      if (lat && lon) {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=imperial`
        );
        weatherData = await response.json();
      } else {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.OPENWEATHER_API_KEY}&units=imperial`
        );
        weatherData = await response.json();
      }
      
      // Get historical/statistical data (this would require a paid plan for real historical data)
      // For now, we'll use current conditions and estimate monthly/annual
      const currentRain = weatherData.rain?.['1h'] || 0; // mm/h
      const humidity = weatherData.main.humidity;
      const cloudiness = weatherData.clouds.all;
      
      // Estimate monthly rainfall based on current conditions and humidity
      // This is a simplified calculation - real implementation would use historical data
      const estimatedMonthlyRainfall = Math.max(0.5, (humidity / 100) * (cloudiness / 100) * 4 + (currentRain * 0.1));
      
      const rainfallData = {
        city: weatherData.name,
        monthlyRainfall: parseFloat(estimatedMonthlyRainfall.toFixed(1)),
        annualRainfall: parseFloat((estimatedMonthlyRainfall * 12).toFixed(1)),
        climateZone: getClimateZone(weatherData.coord.lat),
        nextForecast: "Available via weather API",
        lastRain: currentRain > 0 ? "Currently raining" : "Unknown",
        currentConditions: weatherData.weather[0].description,
        temperature: Math.round(weatherData.main.temp),
        humidity,
        coordinates: weatherData.coord
      };
      
      res.json(rainfallData);
    } catch (error) {
      console.error("Error fetching weather data:", error);
      // Fallback to mock data on error
      const rainfallData = {
        city: req.params.city,
        monthlyRainfall: 2.5,
        annualRainfall: 30,
        climateZone: "Temperate",
        nextForecast: "3 days",
        lastRain: "2 days ago"
      };
      res.json(rainfallData);
    }
  });

  // Helper function to determine climate zone based on latitude
  function getClimateZone(lat: number): string {
    const absLat = Math.abs(lat);
    if (absLat <= 23.5) return "Tropical";
    if (absLat <= 35) return "Subtropical";
    if (absLat <= 50) return "Temperate";
    if (absLat <= 60) return "Continental";
    return "Polar";
  }

  // Excel export endpoint
  app.get('/api/export/excel', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const profile = await storage.getUserProfile(userId);
      
      if (!user || !profile) {
        return res.status(404).json({ message: "User data not found" });
      }

      const calculations = await storage.getWaterCalculations(profile.id);
      
      if (!calculations) {
        return res.status(404).json({ message: "Calculations not found" });
      }

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      
      // User Information Sheet
      const userInfoData = [
        ["Boondh - Water Collection Report"],
        [""],
        ["User Information"],
        ["Name", profile.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A'],
        ["Email", user.email || 'N/A'],
        ["Location", profile.location || 'N/A'],
        ["City", profile.city || 'N/A'],
        ["Rooftop Area (sq ft)", profile.rooftopArea || 'N/A'],
        ["Report Generated", new Date().toLocaleDateString()],
        [""],
        ["Water Collection Data"],
        ["Monthly Rainfall (inches)", calculations.monthlyRainfall],
        ["Runoff Coefficient", calculations.runoffCoefficient],
        ["Monthly Collection (liters)", calculations.monthlyCollection],
        ["Annual Collection (liters)", calculations.annualCollection],
        ["Monthly Savings (₹)", calculations.monthlySavings],
        ["Annual Savings (₹)", calculations.annualSavings],
        [""],
        ["Calculation Formula"],
        ["Volume (L) = Rainfall (in) × Roof Area (sq ft) × Runoff Coefficient × 0.623"]
      ];
      
      // Monthly breakdown data
      const monthlyData = [];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const baseCollection = parseFloat(calculations.monthlyCollection);
      const seasonalFactors = [0.65, 0.75, 0.85, 0.95, 1.0, 0.9, 0.8, 0.7, 0.8, 0.9, 0.85, 0.7];
      
      monthlyData.push(["Monthly Breakdown"]);
      monthlyData.push([""]);
      monthlyData.push(["Month", "Collection (Liters)", "Savings (₹)"]);
      
      let totalAnnual = 0;
      let totalSavings = 0;
      
      months.forEach((month, index) => {
        const monthlyCollection = Math.round(baseCollection * seasonalFactors[index]);
        const monthlySavings = (monthlyCollection * 0.12).toFixed(2);
        totalAnnual += monthlyCollection;
        totalSavings += parseFloat(monthlySavings);
        monthlyData.push([month, monthlyCollection, monthlySavings]);
      });
      
      monthlyData.push([""]);
      monthlyData.push(["Total Annual", totalAnnual, totalSavings.toFixed(2)]);
      
      // Combine all data
      const allData = [...userInfoData, [""], [""], ...monthlyData];
      
      const worksheet = XLSX.utils.aoa_to_sheet(allData);
      
      // Style the worksheet
      const range = XLSX.utils.decode_range(worksheet['!ref']!);
      
      // Set column widths
      worksheet['!cols'] = [
        { wch: 30 }, // Column A
        { wch: 20 }, // Column B
        { wch: 15 }  // Column C
      ];
      
      XLSX.utils.book_append_sheet(workbook, worksheet, "Water Collection Report");
      
      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      // Set response headers
      const fileName = `Boondh_Report_${(profile.name || 'User').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', excelBuffer.length);
      
      res.send(excelBuffer);
    } catch (error) {
      console.error("Error generating Excel report:", error);
      res.status(500).json({ message: "Failed to generate Excel report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
