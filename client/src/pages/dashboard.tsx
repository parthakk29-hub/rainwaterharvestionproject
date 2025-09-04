import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
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
  Shield
} from "lucide-react";

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
}

interface WeatherData {
  city: string;
  monthlyRainfall: number;
  annualRainfall: number;
  climateZone: string;
  nextForecast: string;
  lastRain: string;
}

export default function Dashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

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
    <div className="min-h-screen bg-background">
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
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6 mb-8">
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

        {/* Educational Resources */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <h3 className="text-2xl font-semibold text-foreground mb-6">Maximize Your System</h3>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <Settings className="w-8 h-8 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">Maintenance Tips</h4>
                <p className="text-sm text-muted-foreground">Learn how to maintain your system for optimal performance</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-secondary/10 rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <Briefcase className="w-8 h-8 text-secondary" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">Upgrade Options</h4>
                <p className="text-sm text-muted-foreground">Discover advanced features to increase your collection capacity</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-accent" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">Local Incentives</h4>
                <p className="text-sm text-muted-foreground">Find rebates and tax credits available in your area</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Button className="px-6 py-3" data-testid="button-update-roof">
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
    </div>
  );
}
