import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertUserProfileSchema, insertWaterCalculationSchema, insertNotificationSchema, type User, type UserProfile, type WaterCalculation } from "@shared/schema";
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
      
      // Use fallback rooftop area if not provided (average Indian house: 1000 sq ft)
      const effectiveRooftopArea = rooftopArea > 0 ? rooftopArea : 1000;
      
      // Adjust runoff coefficient based on roof type
      let runoffCoefficient = 0.85; // Default coefficient
      if (profile.rooftopType) {
        switch (profile.rooftopType) {
          case 'metal': runoffCoefficient = 0.95; break;
          case 'concrete': runoffCoefficient = 0.90; break;
          case 'tile': runoffCoefficient = 0.80; break;
          case 'asbestos': runoffCoefficient = 0.85; break;
          case 'thatched': runoffCoefficient = 0.60; break;
          default: runoffCoefficient = 0.85;
        }
      }

      // Formula: Volume (liters) = Rainfall (inches) × Roof Area (sq ft) × Runoff Coefficient × 0.623 (conversion factor)
      const monthlyCollection = monthlyRainfall * effectiveRooftopArea * runoffCoefficient * 0.623;
      const annualCollection = monthlyCollection * 12;
      
      // Estimate savings based on average water cost in India (₹0.12 per liter)
      const costPerLiter = 0.12;
      const monthlySavings = monthlyCollection * costPerLiter;
      const annualSavings = annualCollection * costPerLiter;

      // Calculate efficiency features
      const setupCost = req.body.costRequiredRwh || (effectiveRooftopArea * 2.5); // ₹2.5 per sq ft as default
      
      // Government incentives (typically 30-50% of setup cost)
      const governmentIncentives = setupCost * 0.4; // 40% incentive
      const subsidyAmount = setupCost * 0.2; // 20% subsidy
      const taxBenefits = setupCost * 0.1; // 10% tax benefits
      
      // Maintenance costs (2-3% of setup cost annually)
      const annualMaintenanceCost = setupCost * 0.025;
      const filterReplacementCost = 2000; // ₹2000 annually for filter replacement
      const systemInspectionCost = 1500; // ₹1500 annually for inspection
      
      // Upgradation costs
      const upgradationCost = setupCost * 0.3; // 30% of original for major upgrades
      const capacityExpansionCost = setupCost * 0.4; // 40% for capacity expansion
      const efficiencyImprovementCost = setupCost * 0.15; // 15% for efficiency improvements
      
      // Financial metrics
      const netSetupCost = setupCost - governmentIncentives - subsidyAmount - taxBenefits;
      const netAnnualSavings = annualSavings - annualMaintenanceCost - filterReplacementCost - (systemInspectionCost / 2);
      const paybackPeriod = netSetupCost / Math.max(netAnnualSavings, 1);
      const roi = (netAnnualSavings / netSetupCost) * 100;

      const calculationData = insertWaterCalculationSchema.parse({
        userProfileId: profile.id,
        monthlyRainfall: monthlyRainfall.toString(),
        runoffCoefficient: runoffCoefficient.toString(),
        monthlyCollection: monthlyCollection.toString(),
        monthlySavings: monthlySavings.toString(),
        annualCollection: annualCollection.toString(),
        annualSavings: annualSavings.toString(),
        costRequiredRwh: setupCost.toString(),
        governmentIncentives: governmentIncentives.toString(),
        subsidyAmount: subsidyAmount.toString(),
        taxBenefits: taxBenefits.toString(),
        annualMaintenanceCost: annualMaintenanceCost.toString(),
        filterReplacementCost: filterReplacementCost.toString(),
        systemInspectionCost: systemInspectionCost.toString(),
        upgradationCost: upgradationCost.toString(),
        capacityExpansionCost: capacityExpansionCost.toString(),
        efficiencyImprovementCost: efficiencyImprovementCost.toString(),
        paybackPeriod: paybackPeriod.toString(),
        roi: roi.toString(),
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

  // Weather/rainfall data endpoint using Open-Meteo API (free, no API key required)
  app.get('/api/weather/:city', isAuthenticated, async (req: any, res) => {
    try {
      const { city } = req.params;
      const { lat, lon } = req.query;
      
      // Get coordinates - use provided lat/lon or get from city
      let latitude, longitude;
      if (lat && lon) {
        latitude = parseFloat(lat as string);
        longitude = parseFloat(lon as string);
      } else {
        // Get coordinates from city
        const cityCoords = getCityCoordinates(city);
        if (cityCoords) {
          latitude = cityCoords.lat;
          longitude = cityCoords.lng;
        } else {
          // Use geocoding API for unknown cities
          try {
            const geocodeResponse = await fetch(
              `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
            );
            const geocodeData = await geocodeResponse.json();
            if (geocodeData.results && geocodeData.results.length > 0) {
              latitude = geocodeData.results[0].latitude;
              longitude = geocodeData.results[0].longitude;
            }
          } catch (geocodeError) {
            console.warn('Geocoding failed for city:', city, geocodeError);
          }
        }
      }
      
      // Fallback to Delhi coordinates if no location found
      if (!latitude || !longitude) {
        latitude = 28.7041;
        longitude = 77.1025;
        console.log(`Using fallback coordinates (Delhi) for city: ${city}`);
      }
      
      // Fetch current weather and historical precipitation data
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,cloud_cover&daily=precipitation_sum&past_days=30&forecast_days=1&timezone=auto`;
      
      console.log(`Fetching weather data from: ${weatherUrl}`);
      const response = await fetch(weatherUrl);
      const weatherData = await response.json();
      
      if (!response.ok || !weatherData.current) {
        throw new Error(`Weather API response error: ${response.status}`);
      }
      
      // Calculate monthly rainfall from historical data
      const pastPrecipitation = weatherData.daily?.precipitation_sum || [];
      const totalPastPrecipitation = pastPrecipitation.reduce((sum: number, val: number) => sum + (val || 0), 0);
      const avgDailyPrecipitation = totalPastPrecipitation / pastPrecipitation.length;
      const monthlyRainfall = (avgDailyPrecipitation * 30.44) / 25.4; // Convert mm to inches and scale to month
      
      // Get current conditions
      const current = weatherData.current;
      const currentTemp = Math.round((current.temperature_2m * 9/5) + 32); // Convert C to F
      const humidity = current.relative_humidity_2m;
      const currentPrecipitation = current.precipitation || 0;
      
      // Determine weather description from weather code
      const weatherDescription = getWeatherDescription(current.weather_code);
      
      // Determine next rain forecast
      const nextRainForecast = currentPrecipitation > 0 ? "Currently raining" : 
                             avgDailyPrecipitation > 2 ? "2-3 days" : "5-7 days";
      
      // Determine last rain
      let lastRainDay = "Unknown";
      for (let i = pastPrecipitation.length - 1; i >= 0; i--) {
        if (pastPrecipitation[i] > 0.5) { // At least 0.5mm
          const daysAgo = pastPrecipitation.length - 1 - i;
          lastRainDay = daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo} days ago`;
          break;
        }
      }
      
      const rainfallData = {
        city: city,
        monthlyRainfall: Math.max(0.1, parseFloat(monthlyRainfall.toFixed(1))),
        annualRainfall: parseFloat((monthlyRainfall * 12).toFixed(1)),
        climateZone: getClimateZone(latitude),
        nextForecast: nextRainForecast,
        lastRain: lastRainDay,
        currentConditions: weatherDescription,
        temperature: currentTemp,
        humidity: Math.round(humidity),
        coordinates: { lat: latitude, lon: longitude },
        cloudCover: current.cloud_cover || 0,
        currentPrecipitation: currentPrecipitation
      };
      
      console.log(`Weather data for ${city}:`, rainfallData);
      res.json(rainfallData);
    } catch (error) {
      console.error("Error fetching weather data:", error);
      // Enhanced fallback data based on common Indian rainfall patterns
      const monthlyRainfallFallback = getSeasonalRainfall(req.params.city);
      const rainfallData = {
        city: req.params.city,
        monthlyRainfall: monthlyRainfallFallback,
        annualRainfall: monthlyRainfallFallback * 12,
        climateZone: "Subtropical",
        nextForecast: "3-5 days",
        lastRain: "2 days ago",
        currentConditions: "partly cloudy",
        temperature: 78,
        humidity: 65,
        coordinates: getCityCoordinates(req.params.city) || { lat: 28.7041, lon: 77.1025 }
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

  // Helper function to get weather description from WMO weather code
  function getWeatherDescription(code: number): string {
    const weatherCodes: { [key: number]: string } = {
      0: "clear sky",
      1: "mainly clear",
      2: "partly cloudy",
      3: "overcast",
      45: "fog",
      48: "depositing rime fog",
      51: "light drizzle",
      53: "moderate drizzle",
      55: "dense drizzle",
      56: "light freezing drizzle",
      57: "dense freezing drizzle",
      61: "slight rain",
      63: "moderate rain",
      65: "heavy rain",
      66: "light freezing rain",
      67: "heavy freezing rain",
      71: "slight snow fall",
      73: "moderate snow fall",
      75: "heavy snow fall",
      77: "snow grains",
      80: "slight rain showers",
      81: "moderate rain showers",
      82: "violent rain showers",
      85: "slight snow showers",
      86: "heavy snow showers",
      95: "thunderstorm",
      96: "thunderstorm with slight hail",
      99: "thunderstorm with heavy hail"
    };
    return weatherCodes[code] || "unknown conditions";
  }

  // Helper function to get seasonal rainfall patterns for Indian cities
  function getSeasonalRainfall(city: string): number {
    const now = new Date();
    const month = now.getMonth(); // 0-11
    
    // Define monsoon and dry season patterns for different regions
    const cityPatterns: { [key: string]: { monsoon: number; dry: number } } = {
      'Mumbai': { monsoon: 8.5, dry: 0.2 },
      'Delhi': { monsoon: 6.2, dry: 0.8 },
      'Bangalore': { monsoon: 4.8, dry: 0.5 },
      'Chennai': { monsoon: 5.2, dry: 1.2 },
      'Kolkata': { monsoon: 7.1, dry: 0.6 },
      'Hyderabad': { monsoon: 4.5, dry: 0.3 },
      'Pune': { monsoon: 5.8, dry: 0.4 },
      'Ahmedabad': { monsoon: 6.8, dry: 0.1 },
      'Jaipur': { monsoon: 4.2, dry: 0.2 },
      'Lucknow': { monsoon: 5.5, dry: 0.7 }
    };
    
    const normalizedCity = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
    const pattern = cityPatterns[normalizedCity] || { monsoon: 5.0, dry: 0.5 }; // Default pattern
    
    // Monsoon months: June (5) to September (8)
    const isMonsoon = month >= 5 && month <= 8;
    return isMonsoon ? pattern.monsoon : pattern.dry;
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
      const baseCollection = parseFloat(calculations.monthlyCollection || "0");
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

  // Weather forecast routes
  app.get('/api/weather/:userProfileId', isAuthenticated, async (req: any, res) => {
    try {
      const { userProfileId } = req.params;
      
      // Get user profile to get location
      const profile = await storage.getUserProfile(req.user.claims.sub);
      if (!profile || profile.id !== userProfileId) {
        return res.status(404).json({ message: "Profile not found" });
      }

      // First try to fetch existing forecasts from database
      let forecasts = await storage.getWeatherForecasts(userProfileId);
      
      // If we have recent forecasts (within the last 6 hours), return them
      if (forecasts.length > 0) {
        const latestForecast = forecasts[0];
        const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
        
        if (latestForecast.updatedAt && new Date(latestForecast.updatedAt) > sixHoursAgo) {
          return res.json({ forecasts });
        }
      }

      // Get coordinates from city if not available directly
      let lat, lng;
      if (profile.latitude && profile.longitude) {
        lat = parseFloat(profile.latitude);
        lng = parseFloat(profile.longitude);
      } else if (profile.city) {
        // Use city-based coordinates for major cities
        const cityCoordinates = getCityCoordinates(profile.city);
        if (cityCoordinates) {
          lat = cityCoordinates.lat;
          lng = cityCoordinates.lng;
        }
      }
      
      // Fallback to Delhi coordinates if no location is found
      if (!lat || !lng) {
        lat = 28.7041;
        lng = 77.1025;
        console.log('Using fallback coordinates for Delhi');
      }
      
      // Try to fetch fresh data from API if we have coordinates
      if (lat && lng) {
        try {
          const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,wind_speed_10m_max&timezone=auto&forecast_days=7`;
          
          console.log(`Fetching weather data from: ${weatherUrl}`);
          const response = await fetch(weatherUrl);
          const weatherData = await response.json();
          
          if (response.ok && weatherData.daily) {
            console.log('Successfully fetched weather data', weatherData.daily);
            // Process and classify rain data
            const freshForecasts = weatherData.daily.time.map((date: string, index: number) => {
              const precipitation = weatherData.daily.precipitation_sum[index] || 0;
              const rainType = classifyRainType(precipitation);
              const collectableRain = precipitation > 0.5; // Minimum 0.5mm to be worth collecting
              
              return {
                userProfileId,
                date: new Date(date),
                maxTemperature: weatherData.daily.temperature_2m_max[index],
                minTemperature: weatherData.daily.temperature_2m_min[index],
                precipitationSum: precipitation,
                weatherCode: weatherData.daily.weather_code[index],
                windSpeed: weatherData.daily.wind_speed_10m_max[index],
                rainType,
                collectableRain
              };
            });

            // Store fresh forecasts in database
            await storage.updateWeatherForecasts(userProfileId, freshForecasts);
            forecasts = freshForecasts;
            console.log(`Stored ${freshForecasts.length} weather forecasts`);
          } else {
            console.error('Weather API response not ok:', response.status, weatherData);
          }
        } catch (apiError) {
          console.warn("API fetch failed, using cached data:", apiError);
        }
      }

      // If no forecasts exist, create mock data for demonstration
      if (forecasts.length === 0) {
        console.log('Creating mock weather forecast data');
        const mockForecasts: any[] = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date();
          date.setDate(date.getDate() + i);
          
          // Generate realistic weather patterns
          const baseTemp = 25; // Base temperature in Celsius
          const tempVariation = Math.random() * 10 - 5; // ±5°C variation
          const maxTemp = Math.round(baseTemp + tempVariation + Math.random() * 5);
          const minTemp = Math.round(maxTemp - 5 - Math.random() * 5);
          
          // Generate precipitation (higher chance in monsoon season)
          const month = date.getMonth();
          const isMonsoon = month >= 5 && month <= 9; // June to October
          const precipitationChance = isMonsoon ? 0.7 : 0.3;
          const precipitation = Math.random() < precipitationChance ? 
            Math.random() * (isMonsoon ? 15 : 5) : 0;
          
          mockForecasts.push({
            userProfileId,
            date: date,
            temperature: null,
            maxTemperature: maxTemp.toString(),
            minTemperature: minTemp.toString(),
            precipitationSum: precipitation.toFixed(1),
            weatherCode: precipitation > 5 ? 61 : precipitation > 0 ? 51 : 0,
            windSpeed: Math.round(Math.random() * 15 + 5).toString(),
            rainType: classifyRainType(precipitation),
            collectableRain: precipitation > 0.5
          });
        }
        
        // Store mock forecasts in database
        try {
          await storage.updateWeatherForecasts(userProfileId, mockForecasts);
          forecasts = await storage.getWeatherForecasts(userProfileId); // Get them with proper IDs
          console.log(`Created and stored ${mockForecasts.length} mock weather forecasts`);
        } catch (storeError) {
          console.error('Failed to store mock forecasts:', storeError);
          // Create forecast-like objects for frontend display
          forecasts = mockForecasts.map((forecast, index) => ({
            ...forecast,
            id: `mock-${index}`,
            createdAt: new Date(),
            updatedAt: new Date()
          }));
        }
      }

      // Return whatever forecast data we have (fresh, cached, or mock)
      res.json({ forecasts });
    } catch (error) {
      console.error("Error fetching weather:", error);
      res.status(500).json({ message: "Failed to fetch weather data" });
    }
  });

  // Weather alerts endpoint
  app.get('/api/weather/alerts/:userProfileId', isAuthenticated, async (req: any, res) => {
    try {
      const { userProfileId } = req.params;
      
      // Get user profile to get location
      const profile = await storage.getUserProfile(req.user.claims.sub);
      if (!profile || profile.id !== userProfileId) {
        return res.status(404).json({ message: "Profile not found" });
      }

      // Get coordinates
      let lat, lng;
      if (profile.latitude && profile.longitude) {
        lat = parseFloat(profile.latitude);
        lng = parseFloat(profile.longitude);
      } else if (profile.city) {
        const cityCoordinates = getCityCoordinates(profile.city);
        if (cityCoordinates) {
          lat = cityCoordinates.lat;
          lng = cityCoordinates.lng;
        }
      }
      
      // Fallback to Delhi coordinates
      if (!lat || !lng) {
        lat = 28.7041;
        lng = 77.1025;
      }

      // Get current weather and forecast for alert generation
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,precipitation,weather_code,wind_speed_10m&daily=precipitation_sum,weather_code,wind_speed_10m_max&timezone=auto&forecast_days=3`;
      
      const response = await fetch(weatherUrl);
      const weatherData = await response.json();
      
      let alerts: Array<{
        id: string;
        type: 'warning' | 'info' | 'critical';
        title: string;
        message: string;
        timestamp: string;
      }> = [];

      if (response.ok && weatherData) {
        const current = weatherData.current;
        const daily = weatherData.daily;
        
        // Check for current weather alerts
        if (current.wind_speed_10m > 25) {
          alerts.push({
            id: 'high-wind',
            type: 'warning',
            title: 'High Wind Warning',
            message: `Strong winds detected (${Math.round(current.wind_speed_10m)} km/h). Check and secure your rainwater collection system.`,
            timestamp: new Date().toISOString()
          });
        }
        
        if (current.precipitation > 10) {
          alerts.push({
            id: 'heavy-rain',
            type: 'info',
            title: 'Heavy Rain Detected',
            message: `Heavy rainfall in progress (${current.precipitation}mm). Excellent collection opportunity!`,
            timestamp: new Date().toISOString()
          });
        }
        
        // Check forecast for upcoming alerts
        if (daily && daily.precipitation_sum) {
          for (let i = 0; i < Math.min(daily.precipitation_sum.length, 3); i++) {
            const dayPrecip = daily.precipitation_sum[i];
            const date = new Date(daily.time[i]);
            
            if (dayPrecip > 15) {
              const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString();
              alerts.push({
                id: `heavy-rain-${i}`,
                type: 'info',
                title: 'Heavy Rain Expected',
                message: `${dayName}: Expected ${Math.round(dayPrecip)}mm of rain. Prepare your collection system!`,
                timestamp: new Date().toISOString()
              });
            }
          }
        }
        
        // System maintenance alerts based on season/weather
        const now = new Date();
        const month = now.getMonth();
        
        // Monsoon preparation (May-June in India)
        if (month >= 4 && month <= 5) {
          alerts.push({
            id: 'monsoon-prep',
            type: 'warning',
            title: 'Monsoon Preparation',
            message: 'Monsoon season approaching. Clean gutters, check filters, and inspect your collection system.',
            timestamp: new Date().toISOString()
          });
        }
        
        // Winter maintenance (November-January)
        if (month >= 10 || month <= 1) {
          alerts.push({
            id: 'winter-maintenance',
            type: 'info',
            title: 'Winter Maintenance',
            message: 'Protect pipes from freezing. Check for debris accumulation and system efficiency.',
            timestamp: new Date().toISOString()
          });
        }
      }
      
      // If no specific alerts, add a general status
      if (alerts.length === 0) {
        alerts.push({
          id: 'system-ok',
          type: 'info',
          title: 'System Status: Normal',
          message: 'No immediate weather alerts. Your rainwater harvesting system is operating normally.',
          timestamp: new Date().toISOString()
        });
      }
      
      res.json({ alerts, location: profile.city || 'Unknown' });
    } catch (error) {
      console.error("Error fetching weather alerts:", error);
      res.status(500).json({ message: "Failed to fetch weather alerts" });
    }
  });

  // Helper function to get coordinates for major cities
  function getCityCoordinates(city: string): { lat: number; lng: number } | null {
    const cityMap: { [key: string]: { lat: number; lng: number } } = {
      // India
      'Delhi': { lat: 28.7041, lng: 77.1025 },
      'New Delhi': { lat: 28.6139, lng: 77.2090 },
      'Mumbai': { lat: 19.0760, lng: 72.8777 },
      'Bangalore': { lat: 12.9716, lng: 77.5946 },
      'Bengaluru': { lat: 12.9716, lng: 77.5946 },
      'Chennai': { lat: 13.0827, lng: 80.2707 },
      'Kolkata': { lat: 22.5726, lng: 88.3639 },
      'Hyderabad': { lat: 17.3850, lng: 78.4867 },
      'Pune': { lat: 18.5204, lng: 73.8567 },
      'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
      'Jaipur': { lat: 26.9124, lng: 75.7873 },
      'Lucknow': { lat: 26.8467, lng: 80.9462 },
      'Kanpur': { lat: 26.4499, lng: 80.3319 },
      'Nagpur': { lat: 21.1458, lng: 79.0882 },
      'Indore': { lat: 22.7196, lng: 75.8577 },
      'Thane': { lat: 19.2183, lng: 72.9781 },
      'Bhopal': { lat: 23.2599, lng: 77.4126 },
      'Visakhapatnam': { lat: 17.6868, lng: 83.2185 },
      'Pimpri-Chinchwad': { lat: 18.6298, lng: 73.7997 },
      'Patna': { lat: 25.5941, lng: 85.1376 },
      'Vadodara': { lat: 22.3072, lng: 73.1812 },
      'Surat': { lat: 21.1702, lng: 72.8311 },
      'Coimbatore': { lat: 11.0168, lng: 76.9558 },
      'Kochi': { lat: 9.9312, lng: 76.2673 },
      'Gurgaon': { lat: 28.4595, lng: 77.0266 },
      'Noida': { lat: 28.5355, lng: 77.3910 },
      // International cities
      'London': { lat: 51.5074, lng: -0.1278 },
      'New York': { lat: 40.7128, lng: -74.0060 },
      'Los Angeles': { lat: 34.0522, lng: -118.2437 },
      'Singapore': { lat: 1.3521, lng: 103.8198 },
      'Dubai': { lat: 25.2048, lng: 55.2708 },
      'Toronto': { lat: 43.651070, lng: -79.347015 },
      'Sydney': { lat: -33.8688, lng: 151.2093 }
    };
    
    // Try exact match first
    const normalizedCity = city.trim();
    if (cityMap[normalizedCity]) {
      return cityMap[normalizedCity];
    }
    
    // Try case-insensitive match
    const lowerCity = normalizedCity.toLowerCase();
    for (const [key, coords] of Object.entries(cityMap)) {
      if (key.toLowerCase() === lowerCity) {
        return coords;
      }
    }
    
    // Try partial match for cities
    for (const [key, coords] of Object.entries(cityMap)) {
      if (key.toLowerCase().includes(lowerCity) || lowerCity.includes(key.toLowerCase())) {
        return coords;
      }
    }
    
    return null;
  }

  // Helper function to classify rain type
  function classifyRainType(precipitation: number): string {
    if (precipitation === 0) return 'none';
    if (precipitation < 2.5) return 'light';
    if (precipitation < 10) return 'moderate';
    if (precipitation < 50) return 'heavy';
    return 'storm';
  }

  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getUserNotifications(userId);
      res.json({ notifications });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get('/api/notifications/count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching notification count:", error);
      res.status(500).json({ message: "Failed to fetch notification count" });
    }
  });

  app.post('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notificationData = insertNotificationSchema.parse({
        ...req.body,
        userId,
      });

      const notification = await storage.createNotification(notificationData);
      res.json(notification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid notification data", errors: error.errors });
      }
      console.error("Error creating notification:", error);
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const notification = await storage.markNotificationAsRead(id);
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Admin-only routes for author access
  const isAuthor = (req: any, res: any, next: any) => {
    if (!req.user || !req.user.claims) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Check if user is the author (you can replace this with your actual author email/ID)
    const authorEmail = "niravkumarbhargav@gmail.com"; // Replace with actual author email
    const userEmail = req.user.claims.email;
    
    if (userEmail !== authorEmail) {
      return res.status(403).json({ message: "Access denied - Author only" });
    }
    
    next();
  };

  app.get('/api/admin/export/users', isAuthenticated, isAuthor, async (req: any, res) => {
    try {
      // Get all users and their profiles
      const users = await storage.getAllUsers();
      const profiles = await storage.getAllUserProfiles();
      const calculations = await storage.getAllCalculations();
      
      // Prepare data for Excel export
      const exportData = users.map((user: User) => {
        const profile = profiles.find((p: UserProfile) => p.userId === user.id);
        const calculation = calculations.find((c: WaterCalculation) => c.userProfileId === profile?.id);
        
        return {
          'User ID': user.id,
          'Email': user.email,
          'First Name': user.firstName || '',
          'Last Name': user.lastName || '',
          'Location': profile?.location || '',
          'City': profile?.city || '',
          'State': profile?.state || '',
          'Latitude': profile?.latitude || '',
          'Longitude': profile?.longitude || '',
          'Rooftop Area (sq ft)': profile?.rooftopArea || '',
          'Rooftop Length': profile?.rooftopLength || '',
          'Rooftop Width': profile?.rooftopWidth || '',
          'Rooftop Type': profile?.rooftopType || '',
          'Monthly Collection (L)': calculation?.monthlyCollection || '',
          'Annual Collection (L)': calculation?.annualCollection || '',
          'Monthly Savings (₹)': calculation?.monthlySavings || '',
          'Annual Savings (₹)': calculation?.annualSavings || '',
          'Created At': user.createdAt?.toISOString().split('T')[0] || '',
        };
      });

      // Create Excel workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Auto-size columns
      const colWidths = Object.keys(exportData[0] || {}).map(key => ({
        wch: Math.max(key.length, 15)
      }));
      ws['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, 'User Data');
      
      // Generate buffer
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      // Set headers for file download
      const timestamp = new Date().toISOString().split('T')[0];
      res.setHeader('Content-Disposition', `attachment; filename="boondh-users-${timestamp}.xlsx"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      
      res.send(buffer);
    } catch (error) {
      console.error("Error exporting users:", error);
      res.status(500).json({ message: "Failed to export user data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
