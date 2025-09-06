import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Droplets, 
  DollarSign, 
  Home, 
  Settings, 
  Download, 
  Share,
  BarChart3,
  Briefcase,
  Shield,
  Sun,
  Moon,
  Bell,
  CloudRain,
  Cloud,
  Thermometer,
  Wind,
  Calendar,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { useLocation } from "wouter";

interface UserProfile {
  id: string;
  name: string;
  location: string;
  city: string;
  rooftopArea: string;
  latitude?: string;
  longitude?: string;
}

interface WaterCalculation {
  monthlyRainfall: string;
  runoffCoefficient: string;
  monthlyCollection: string;
  monthlySavings: string;
  annualCollection: string;
  annualSavings: string;
  costRequiredRwh?: string;
}

interface WeatherData {
  city: string;
  monthlyRainfall: number;
  annualRainfall: number;
  climateZone: string;
  nextForecast: string;
  lastRain: string;
}

interface WeatherForecast {
  id: string;
  userProfileId: string;
  date: string;
  maxTemperature: number;
  minTemperature: number;
  precipitationSum: number;
  weatherCode: number;
  windSpeed: number;
  rainType: string;
  collectableRain: boolean;
}

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  emailSent: boolean;
  rainType?: string;
  expectedRainfall?: number;
  createdAt: string;
}

export default function Dashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const [, setRoute] = useLocation();
  const [selectedAction, setSelectedAction] = useState<'maintenance' | 'upgrade' | 'incentives' | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Fetch water calculations
  const { data: calculations, isLoading: calculationsLoading } = useQuery<WaterCalculation>({
    queryKey: ["/api/calculations"],
    enabled: isAuthenticated && !!profile,
    retry: false,
  });

  // Fetch weather data
  const { data: weather } = useQuery<WeatherData>({
    queryKey: ["/api/weather", profile?.city, profile?.latitude, profile?.longitude],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (profile?.latitude && profile?.longitude) {
        params.set('lat', profile.latitude);
        params.set('lon', profile.longitude);
      }
      const url = `/api/weather/${profile?.city}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch weather data');
      return response.json();
    },
    enabled: isAuthenticated && !!profile?.city,
    retry: false,
  });

  // Fetch 7-day weather forecast
  const { data: forecasts, isLoading: forecastLoading } = useQuery<{ forecasts: WeatherForecast[] }>({
    queryKey: ["/api/weather", profile?.id],
    queryFn: async () => {
      const response = await fetch(`/api/weather/${profile?.id}`);
      if (!response.ok) throw new Error('Failed to fetch weather forecast');
      return response.json();
    },
    enabled: isAuthenticated && !!profile?.id,
    retry: false,
    refetchInterval: 3600000, // Auto-refresh every hour
  });

  // Fetch notifications
  const { data: notifications } = useQuery<{ notifications: Notification[] }>({
    queryKey: ["/api/notifications"],
    enabled: isAuthenticated,
    retry: false,
    refetchInterval: 60000, // Auto-refresh every minute
  });

  // Fetch notification count
  const { data: notificationCount } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/count"],
    enabled: isAuthenticated,
    retry: false,
    refetchInterval: 60000, // Auto-refresh every minute
  });

  // Create calculations mutation
  const createCalculationsMutation = useMutation({
    mutationFn: async (data: { monthlyRainfall: number }) => {
      const response = await apiRequest("POST", "/api/calculations", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calculations"] });
      toast({
        title: "Calculations updated",
        description: "Your water collection calculations have been updated.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to calculate water collection. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Excel download handler
  const handleDownloadExcel = async () => {
    try {
      const response = await fetch('/api/export/excel', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${document.cookie}`, // This will be handled by session
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to download Excel report');
      }
      
      // Get the filename from headers or create default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'AquaHarvest_Report.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/i);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download complete",
        description: "Your Excel report has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Download failed",
        description: "Failed to download Excel report. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle maximize system actions
  const handleMaximizeAction = (action: 'maintenance' | 'upgrade' | 'incentives') => {
    setSelectedAction(action);
    setIsDialogOpen(true);
  };

  const getActionInfo = (action: 'maintenance' | 'upgrade' | 'incentives') => {
    const actionInfo = {
      maintenance: {
        title: "Maintenance Tips",
        description: "Regular maintenance ensures optimal water collection:",
        items: [
          "Clean gutters and filters monthly",
          "Inspect roof for damage after storms",
          "Check storage tank for sediment buildup",
          "Ensure proper mosquito-proofing",
          "Maintain first-flush diverters"
        ]
      },
      upgrade: {
        title: "Upgrade Options", 
        description: "Enhance your rainwater harvesting system:",
        items: [
          "Install larger storage capacity tanks",
          "Add water filtration systems",
          "Include smart monitoring sensors",
          "Upgrade to UV sterilization",
          "Install automated pumps for distribution"
        ]
      },
      incentives: {
        title: "Local Incentives",
        description: "Available benefits for rainwater harvesting in India:",
        items: [
          "Government subsidies up to ₹50,000",
          "Property tax rebates (5-10%)",
          "Water bill discounts in many cities",
          "Fast-track building approvals",
          "Carbon credit opportunities"
        ]
      }
    };
    return actionInfo[action];
  };

  // Auto-calculate if we have profile but no calculations
  useEffect(() => {
    if (profile && !calculations && !calculationsLoading && weather) {
      createCalculationsMutation.mutate({
        monthlyRainfall: weather.monthlyRainfall,
      });
    }
  }, [profile, calculations, calculationsLoading, weather]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Loading dashboard...</div>
      </div>
    );
  }

  if (!isAuthenticated || !profile) {
    return null;
  }

  const monthlyCollection = calculations ? parseFloat(calculations.monthlyCollection) : 0;
  const monthlySavings = calculations ? parseFloat(calculations.monthlySavings) : 0;
  const annualCollection = calculations ? parseFloat(calculations.annualCollection) : 0;
  const annualSavings = calculations ? parseFloat(calculations.annualSavings) : 0;
  const costRequiredRwh = calculations?.costRequiredRwh ? parseFloat(calculations.costRequiredRwh) : 150000; // Default ₹1.5 lakhs
  const rooftopArea = parseFloat(profile.rooftopArea || "0");

  // Mock monthly data for chart
  const monthlyData = [
    { month: "Jan", liters: Math.round(monthlyCollection * 0.65) },
    { month: "Feb", liters: Math.round(monthlyCollection * 0.75) },
    { month: "Mar", liters: Math.round(monthlyCollection * 0.85) },
    { month: "Apr", liters: Math.round(monthlyCollection * 0.95) },
    { month: "May", liters: Math.round(monthlyCollection * 1.0) },
    { month: "Jun", liters: Math.round(monthlyCollection * 0.9) },
    { month: "Jul", liters: Math.round(monthlyCollection * 0.8) },
    { month: "Aug", liters: Math.round(monthlyCollection * 0.7) },
    { month: "Sep", liters: Math.round(monthlyCollection * 0.8) },
    { month: "Oct", liters: Math.round(monthlyCollection * 0.9) },
    { month: "Nov", liters: Math.round(monthlyCollection * 0.85) },
    { month: "Dec", liters: Math.round(monthlyCollection * 0.7) },
  ];

  const maxMonthly = Math.max(...monthlyData.map(d => d.liters));

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Dynamic Weather-based Background Animation */}
      <div className="fixed inset-0 pointer-events-none z-[-1]">
        {/* Show loading animation while fetching */}
        {forecastLoading && (
          <div className="cloud-animation">
            <div className="cloud"></div>
            <div className="cloud cloud-delayed"></div>
          </div>
        )}
        
        {/* Show weather-based animations when data is available */}
        {!forecastLoading && forecasts?.forecasts && (
          <>
            {/* Rain Animation - Show when there's upcoming rain in next 3 days */}
            {forecasts.forecasts.slice(0, 3).some(f => f.precipitationSum > 0) ? (
              <div className="rain-animation">
                {(() => {
                  const maxRain = Math.max(...forecasts.forecasts.slice(0, 3).map(f => f.precipitationSum));
                  const rainIntensity = maxRain > 10 ? 80 : maxRain > 5 ? 60 : 40;
                  return [...Array(rainIntensity)].map((_, i) => (
                    <div 
                      key={i} 
                      className="raindrop" 
                      style={{
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 2}s`,
                        animationDuration: `${0.4 + Math.random() * 0.6}s`
                      }}
                    />
                  ));
                })()}
              </div>
            ) : (
              /* Sunny Day Animation - Show when no significant rain expected */
              <div className="sun-animation">
                <div className="sun-rays"></div>
              </div>
            )}
          </>
        )}
        
        {/* Default animation when no forecast data available */}
        {!forecastLoading && (!forecasts || !forecasts.forecasts || forecasts.forecasts.length === 0) && (
          <div className="cloud-animation">
            <div className="cloud"></div>
            <div className="cloud cloud-delayed"></div>
          </div>
        )}
      </div>
      {/* Dashboard Navigation */}
      <nav className="bg-card shadow-sm border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <Droplets className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Boondh Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Notification Bell */}
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8"
                  data-testid="button-notifications"
                >
                  <Bell className="h-4 w-4" />
                  {notificationCount?.count && notificationCount.count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {notificationCount.count > 9 ? '9+' : notificationCount.count}
                    </span>
                  )}
                </Button>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={toggleTheme}
                className="h-8 w-8"
                data-testid="button-theme-toggle"
              >
                {theme === "light" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>
              <span className="text-sm font-medium text-muted-foreground" data-testid="text-welcome">
                Welcome, {profile.name || (user as any)?.user?.firstName || "User"}
              </span>
              <a 
                href="/api/logout"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-logout"
              >
                Logout
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Overview Cards */}
        <div className="grid lg:grid-cols-5 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Monthly Collection</h3>
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Droplets className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground mb-1" data-testid="text-monthly-collection">
                {monthlyCollection.toFixed(0)} L
              </div>
              <p className="text-sm text-secondary">Based on current setup</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Cost Savings</h3>
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-accent" />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground mb-1" data-testid="text-monthly-savings">
                ₹{monthlySavings.toFixed(0)}
              </div>
              <p className="text-sm text-secondary">Monthly water bill reduction</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Rooftop Area</h3>
                <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Home className="w-5 h-5 text-secondary" />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground mb-1" data-testid="text-rooftop-area">
                {rooftopArea.toFixed(0)} ft²
              </div>
              <p className="text-sm text-muted-foreground">Collection surface area</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Efficiency Rate</h3>
                <div className="w-10 h-10 bg-chart-4/10 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-chart-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">85%</div>
              <p className="text-sm text-muted-foreground">Runoff coefficient</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Setup Cost</h3>
                <div className="w-10 h-10 bg-chart-5/10 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-chart-5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground mb-1" data-testid="text-setup-cost">
                ₹{(costRequiredRwh / 1000).toFixed(0)}k
              </div>
              <p className="text-sm text-muted-foreground">RWH system investment</p>
            </CardContent>
          </Card>
        </div>

        {/* Water Calculation Display */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-6">Water Collection Formula</h3>
              
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-lg font-mono text-foreground mb-2">
                      Volume = Rainfall × Roof Area × Runoff Coefficient
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Standard rainwater harvesting calculation
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-primary mb-1" data-testid="text-monthly-rainfall">
                      {weather?.monthlyRainfall?.toFixed(1) || "2.5"}"
                    </div>
                    <div className="text-xs text-muted-foreground">Monthly Rainfall</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-secondary mb-1">
                      {rooftopArea.toFixed(0)}ft²
                    </div>
                    <div className="text-xs text-muted-foreground">Roof Area</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-accent mb-1">0.85</div>
                    <div className="text-xs text-muted-foreground">Runoff Coeff.</div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-2">Results in</div>
                  <div className="text-3xl font-bold text-foreground" data-testid="text-calculation-result">
                    {monthlyCollection.toFixed(0)} Liters
                  </div>
                  <div className="text-sm text-muted-foreground">per month</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Annual Projection Chart */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-6">Annual Projection</h3>
              
              <div className="space-y-4">
                {monthlyData.slice(0, 5).map((month, index) => (
                  <div key={month.month} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{month.month}</span>
                    <div className="flex-1 mx-4 bg-muted rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all" 
                        style={{ width: `${(month.liters / maxMonthly) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-foreground">{month.liters}L</span>
                  </div>
                ))}
                
                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-foreground">Annual Total</span>
                    <span className="text-xl font-bold text-primary" data-testid="text-annual-total">
                      {annualCollection.toFixed(0)}L
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-muted-foreground">Estimated Savings</span>
                    <span className="text-lg font-semibold text-secondary" data-testid="text-annual-savings">
                      ₹{annualSavings.toFixed(0)}/year
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-6">Usage Breakdown</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                        <Droplets className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">Garden Irrigation</div>
                        <div className="text-sm text-muted-foreground">Daily watering needs</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-foreground">{Math.round(monthlyCollection * 0.55)}L</div>
                      <div className="text-sm text-muted-foreground">55% of collection</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                        <Home className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">Household Use</div>
                        <div className="text-sm text-muted-foreground">Cleaning & washing</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-foreground">{Math.round(monthlyCollection * 0.34)}L</div>
                      <div className="text-sm text-muted-foreground">34% of collection</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">Reserve</div>
                        <div className="text-sm text-muted-foreground">Emergency storage</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-foreground">{Math.round(monthlyCollection * 0.11)}L</div>
                      <div className="text-sm text-muted-foreground">11% of collection</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weather & Location Info */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Location Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">City</span>
                    <span className="font-medium text-foreground" data-testid="text-city">
                      {profile.city || profile.location}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Climate Zone</span>
                    <span className="font-medium text-foreground">
                      {weather?.climateZone || "Temperate"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg. Annual Rainfall</span>
                    <span className="font-medium text-foreground">
                      {weather?.annualRainfall || 30} inches
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">System Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tank Level</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-2 bg-muted rounded-full">
                        <div className="w-12 h-2 bg-gradient-to-r from-primary to-secondary rounded-full"></div>
                      </div>
                      <span className="font-medium text-foreground">75%</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Rain</span>
                    <span className="font-medium text-foreground">
                      {weather?.lastRain || "2 days ago"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Next Forecast</span>
                    <span className="font-medium text-foreground">
                      {weather?.nextForecast || "3 days"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Water Usage Applications */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <h3 className="text-2xl font-semibold text-foreground mb-6">How You Can Use Your Harvested Water</h3>
            
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <Droplets className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">Drinking Water</h4>
                <p className="text-sm text-muted-foreground">{Math.round(monthlyCollection * 0.1)} L/month</p>
                <p className="text-xs text-muted-foreground">After proper filtration</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <Home className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">Bathing</h4>
                <p className="text-sm text-muted-foreground">{Math.round(monthlyCollection * 0.4)} L/month</p>
                <p className="text-xs text-muted-foreground">Daily bath needs</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <Settings className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">Washing</h4>
                <p className="text-sm text-muted-foreground">{Math.round(monthlyCollection * 0.3)} L/month</p>
                <p className="text-xs text-muted-foreground">Clothes & dishes</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">Gardening</h4>
                <p className="text-sm text-muted-foreground">{Math.round(monthlyCollection * 0.2)} L/month</p>
                <p className="text-xs text-muted-foreground">Plant watering</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 7-Day Weather Forecast */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <h3 className="text-2xl font-semibold text-foreground mb-6">7-Day Weather Forecast</h3>
            
            {forecastLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : forecasts?.forecasts?.length ? (
              <div className="grid grid-cols-7 gap-3">
                {forecasts.forecasts.map((forecast, index) => {
                  const date = new Date(forecast.date);
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                  const weatherIcon = forecast.precipitationSum > 0 ? CloudRain : Cloud;
                  
                  return (
                    <div key={forecast.id} className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">{dayName}</div>
                      <div className="flex justify-center mb-2">
                        {React.createElement(weatherIcon, { className: "w-6 h-6 text-primary" })}
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        {Math.round(forecast.maxTemperature)}°/{Math.round(forecast.minTemperature)}°
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {forecast.precipitationSum}mm
                      </div>
                      {forecast.precipitationSum > 0 && (
                        <div className={`text-xs px-2 py-1 rounded-full mt-2 ${
                          forecast.collectableRain ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {forecast.rainType}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No weather forecast available. Please check your location settings.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rain Collection Recommendations */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <h3 className="text-2xl font-semibold text-foreground mb-6">Rain Collection Recommendations</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Upcoming Rain Alerts */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-foreground">Upcoming Rain Events</h4>
                {forecasts?.forecasts?.filter(f => f.precipitationSum > 0)?.slice(0, 3).map((forecast, index) => {
                  const date = new Date(forecast.date);
                  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  const potentialCollection = (forecast.precipitationSum * parseFloat(profile.rooftopArea || "0") * 0.85 * 0.623).toFixed(0);
                  
                  return (
                    <div key={forecast.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          forecast.collectableRain ? 'bg-green-100 dark:bg-green-900' : 'bg-yellow-100 dark:bg-yellow-900'
                        }`}>
                          {forecast.collectableRain ? (
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{dateStr} - {forecast.rainType} rain</div>
                          <div className="text-sm text-muted-foreground">{forecast.precipitationSum}mm expected</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-foreground">{potentialCollection}L</div>
                        <div className="text-sm text-muted-foreground">
                          {forecast.collectableRain ? 'Collect' : 'Too light'}
                        </div>
                      </div>
                    </div>
                  );
                }) || (
                  <div className="text-center py-4 text-muted-foreground">
                    No significant rain expected in the next 7 days
                  </div>
                )}
              </div>

              {/* Collection Tips */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-foreground">Collection Tips</h4>
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Thermometer className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="font-medium text-blue-900 dark:text-blue-100">Temperature Range</span>
                    </div>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {forecasts?.forecasts?.[0] ? `${Math.round(forecasts.forecasts[0].minTemperature)}° - ${Math.round(forecasts.forecasts[0].maxTemperature)}°C today` : 'Temperature data loading...'}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Wind className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="font-medium text-green-900 dark:text-green-100">Wind Conditions</span>
                    </div>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      {forecasts?.forecasts?.[0] ? `${Math.round(forecasts.forecasts[0].windSpeed)} km/h wind speed` : 'Wind data loading...'}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="font-medium text-purple-900 dark:text-purple-100">Best Collection Days</span>
                    </div>
                    <p className="text-sm text-purple-800 dark:text-purple-200">
                      {forecasts?.forecasts?.filter(f => f.collectableRain).length || 0} out of 7 days are optimal for collection
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Educational Resources */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <h3 className="text-2xl font-semibold text-foreground mb-6">Maximize Your System</h3>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleMaximizeAction('maintenance')} data-testid="card-maintenance-tips">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-xl mx-auto mb-4 flex items-center justify-center">
                    <Settings className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">Maintenance Tips</h4>
                  <p className="text-sm text-muted-foreground">Learn how to maintain your system for optimal performance</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleMaximizeAction('upgrade')} data-testid="card-upgrade-options">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-secondary/10 rounded-xl mx-auto mb-4 flex items-center justify-center">
                    <Briefcase className="w-8 h-8 text-secondary" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">Upgrade Options</h4>
                  <p className="text-sm text-muted-foreground">Discover advanced features to increase your collection capacity</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleMaximizeAction('incentives')} data-testid="card-local-incentives">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-accent/10 rounded-xl mx-auto mb-4 flex items-center justify-center">
                    <BarChart3 className="w-8 h-8 text-accent" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">Local Incentives</h4>
                  <p className="text-sm text-muted-foreground">Find rebates and tax credits available in your area</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Button 
            className="px-6 py-3" 
            data-testid="button-update-roof"
            onClick={() => setRoute('/rooftop')}
          >
            Update Roof Area
          </Button>
          <Button 
            variant="secondary" 
            className="px-6 py-3" 
            data-testid="button-download"
            onClick={handleDownloadExcel}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Excel Report
          </Button>
          <Button variant="outline" className="px-6 py-3" data-testid="button-share">
            <Share className="w-4 h-4 mr-2" />
            Share Results
          </Button>
        </div>
      </div>

      {/* Centered Maximize Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              {selectedAction && getActionInfo(selectedAction).title}
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              {selectedAction && getActionInfo(selectedAction).description}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {selectedAction && (
              <ul className="space-y-3">
                {getActionInfo(selectedAction).items.map((item, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
