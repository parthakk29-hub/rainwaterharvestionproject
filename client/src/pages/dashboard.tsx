import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from "recharts";
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
  CheckCircle,
  ChevronDown,
  User,
  MapPin,
  Square,
  LogOut,
  Eye,
  MoreVertical,
  TrendingUp,
  Gauge,
  Target,
  Activity
} from "lucide-react";
import { useLocation } from "wouter";
import type { InsertUserProfile } from "@shared/schema";
import AllInOnePopup from "@/components/AllInOnePopup";

interface UserProfile {
  id: string;
  name: string;
  location: string;
  city: string;
  rooftopArea: string;
  rooftopType?: string;
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
  governmentIncentives?: string;
  subsidyAmount?: string;
  taxBenefits?: string;
  annualMaintenanceCost?: string;
  filterReplacementCost?: string;
  systemInspectionCost?: string;
  upgradationCost?: string;
  capacityExpansionCost?: string;
  efficiencyImprovementCost?: string;
  paybackPeriod?: string;
  roi?: string;
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
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showIncentives, setShowIncentives] = useState(false);
  const [settingsData, setSettingsData] = useState({
    name: '',
    location: '',
    rooftopArea: '',
    rooftopLength: '',
    rooftopWidth: '',
    rooftopType: ''
  });

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

  // Sync settings data when profile loads
  useEffect(() => {
    if (profile) {
      setSettingsData({
        name: profile.name || '',
        location: profile.location || '',
        rooftopArea: profile.rooftopArea || '',
        rooftopLength: (profile as any).rooftopLength || '',
        rooftopWidth: (profile as any).rooftopWidth || '',
        rooftopType: profile.rooftopType || ''
      });
    }
  }, [profile]);

  // Auto-calculate rooftop area when length and width change
  useEffect(() => {
    const length = parseFloat(settingsData.rooftopLength);
    const width = parseFloat(settingsData.rooftopWidth);
    
    if (!isNaN(length) && !isNaN(width) && length > 0 && width > 0) {
      const calculatedArea = (length * width).toString();
      if (calculatedArea !== settingsData.rooftopArea) {
        setSettingsData(prev => ({
          ...prev,
          rooftopArea: calculatedArea
        }));
      }
    }
  }, [settingsData.rooftopLength, settingsData.rooftopWidth]);

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

  // Fetch 7-day weather forecast - FIXED
  const { data: forecasts, isLoading: forecastLoading, error: forecastError } = useQuery<{ forecasts: WeatherForecast[] }>({
    queryKey: ["/api/weather", profile?.id],
    queryFn: async () => {
      const response = await fetch(`/api/weather/${profile?.id}`);
      if (!response.ok) {
        console.error('Weather forecast fetch failed:', response.status, response.statusText);
        // Return empty forecasts instead of throwing error to prevent breaking the UI
        return { forecasts: [] };
      }
      return response.json();
    },
    enabled: isAuthenticated && !!profile?.id,
    retry: 2,
    refetchInterval: 3600000, // Auto-refresh every hour
  });

  // Fetch notification count
  const { data: notificationCount } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/count"],
    enabled: isAuthenticated,
    retry: false,
    refetchInterval: 60000, // Auto-refresh every minute
  });

  // Fetch notifications list
  const { data: notificationsData } = useQuery<{ notifications: Notification[] }>({
    queryKey: ["/api/notifications"],
    enabled: isAuthenticated,
    retry: false,
    refetchInterval: 60000, // Auto-refresh every minute
  });

  // Create calculations mutation
  const createCalculationsMutation = useMutation({
    mutationFn: async (calculationData: any) => {
      const response = await apiRequest('POST', '/api/calculations', calculationData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calculations"] });
    },
    onError: (error) => {
      console.error('Failed to create calculations:', error);
      toast({
        title: "Error",
        description: "Failed to create calculations",
        variant: "destructive",
      });
    },
  });

  // Create calculations when weather data is available
  useEffect(() => {
    if (weather && profile && !calculations && !calculationsLoading && !createCalculationsMutation.isPending) {
      const rooftopArea = parseFloat(profile.rooftopArea || '0');
      const monthlyRainfall = parseFloat(String(weather?.monthlyRainfall || '0'));
      
      if (rooftopArea > 0 && monthlyRainfall > 0) {
        createCalculationsMutation.mutate({
          monthlyRainfall: monthlyRainfall.toString()
        });
      }
    }
  }, [weather, profile, calculations, calculationsLoading, createCalculationsMutation.isPending]);

  if (profileLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Complete Your Profile</h2>
          <p className="text-muted-foreground mb-6">Please complete your profile to view the dashboard.</p>
          <Button onClick={() => setRoute('/registration')}>
            Go to Registration
          </Button>
        </div>
      </div>
    );
  }

  // Show loading if calculations are being created
  if (!calculations && (calculationsLoading || createCalculationsMutation.isPending)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Setting up your calculations...</p>
        </div>
      </div>
    );
  }

  // Calculate values - provide defaults if calculations aren't ready yet
  const monthlyCollection = parseFloat(calculations?.monthlyCollection || "0");
  const monthlySavings = parseFloat(calculations?.monthlySavings || "0");
  const annualCollection = parseFloat(calculations?.annualCollection || "0");
  const annualSavings = parseFloat(calculations?.annualSavings || "0");
  const rooftopArea = parseFloat(profile.rooftopArea || "0");
  const costRequiredRwh = parseFloat(calculations?.costRequiredRwh || "0");

  // Generate monthly data for visualization
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const monthlyData = monthNames.map((month, index) => {
    const baseCollection = monthlyCollection;
    const seasonalMultiplier = index >= 5 && index <= 8 ? 1.5 : 0.7; // Monsoon months
    const liters = Math.round(baseCollection * seasonalMultiplier);
    return { month, liters };
  });

  const maxMonthly = Math.max(...monthlyData.map(m => m.liters));

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
              {/* Enhanced Notification Bell with Dropdown */}
              <DropdownMenu open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 relative"
                    data-testid="button-notifications"
                  >
                    <Bell className="h-4 w-4" />
                    {notificationCount?.count && notificationCount.count > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {notificationCount.count > 9 ? '9+' : notificationCount.count}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {notificationCount?.count && notificationCount.count > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {notificationCount.count} unread
                      </span>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-96 overflow-y-auto">
                    {notificationsData?.notifications && notificationsData.notifications.length > 0 ? (
                      notificationsData.notifications.slice(0, 10).map((notification) => (
                        <DropdownMenuItem
                          key={notification.id}
                          className={`cursor-pointer p-3 flex items-start space-x-3 ${
                            !notification.isRead ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-100 dark:bg-blue-900">
                            <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`text-sm font-medium truncate ${
                                !notification.isRead ? 'text-foreground' : 'text-muted-foreground'
                              }`}>
                                {notification.title}
                              </p>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {notification.message}
                            </p>
                          </div>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No notifications yet</p>
                      </div>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Settings Dropdown */}
              <DropdownMenu open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8"
                    data-testid="button-settings"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Account Settings</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="settings-name">Name</Label>
                      <Input
                        id="settings-name"
                        value={settingsData.name}
                        onChange={(e) => setSettingsData({...settingsData, name: e.target.value})}
                        placeholder="Enter your name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="settings-location">Location</Label>
                      <Input
                        id="settings-location"
                        value={settingsData.location}
                        onChange={(e) => setSettingsData({...settingsData, location: e.target.value})}
                        placeholder="Enter your location"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="settings-area">Rooftop Area (sq ft)</Label>
                      <Input
                        id="settings-area"
                        type="number"
                        value={settingsData.rooftopArea}
                        onChange={(e) => setSettingsData({...settingsData, rooftopArea: e.target.value})}
                        placeholder="Enter rooftop area"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="settings-length">Length (ft)</Label>
                        <Input
                          id="settings-length"
                          type="number"
                          value={settingsData.rooftopLength}
                          onChange={(e) => setSettingsData({...settingsData, rooftopLength: e.target.value})}
                          placeholder="Length"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="settings-width">Width (ft)</Label>
                        <Input
                          id="settings-width"
                          type="number"
                          value={settingsData.rooftopWidth}
                          onChange={(e) => setSettingsData({...settingsData, rooftopWidth: e.target.value})}
                          placeholder="Width"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="settings-type">Rooftop Type</Label>
                      <Select
                        value={settingsData.rooftopType}
                        onValueChange={(value) => setSettingsData({...settingsData, rooftopType: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select rooftop type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="concrete">Concrete</SelectItem>
                          <SelectItem value="tile">Tile</SelectItem>
                          <SelectItem value="metal">Metal</SelectItem>
                          <SelectItem value="shingle">Shingle</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Separator />
                    <div className="flex flex-col space-y-2">
                      <Button
                        className="w-full"
                        onClick={async () => {
                          try {
                            // Calculate rooftop area from length and width if both are provided
                            let updatedSettingsData = { ...settingsData };
                            const length = parseFloat(settingsData.rooftopLength);
                            const width = parseFloat(settingsData.rooftopWidth);
                            
                            if (!isNaN(length) && !isNaN(width) && length > 0 && width > 0) {
                              updatedSettingsData.rooftopArea = (length * width).toString();
                            }
                            
                            await apiRequest('POST', '/api/profile', updatedSettingsData);
                            toast({
                              title: "Success",
                              description: "Settings updated successfully",
                            });
                            queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
                            queryClient.invalidateQueries({ queryKey: ["/api/calculations"] });
                            setIsSettingsOpen(false);
                          } catch (error) {
                            toast({
                              title: "Error",
                              description: "Failed to update settings",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        Save Changes
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => window.location.href = '/api/logout'}
                        className="w-full flex items-center space-x-2"
                        data-testid="button-logout"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </Button>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

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
                ₹{costRequiredRwh > 0 ? (costRequiredRwh / 1000).toFixed(0) : (rooftopArea * 2.5 / 1000).toFixed(0)}k
              </div>
              <p className="text-sm text-muted-foreground">RWH system investment</p>
            </CardContent>
          </Card>
        </div>

        {/* Merged Water Collection Formula & Usage */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <h3 className="text-2xl font-semibold text-foreground mb-6 flex items-center space-x-2">
              <Droplets className="h-6 w-6 text-primary" />
              <span>Water Collection & Usage Guide</span>
            </h3>
            
            {/* Formula Section */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-foreground mb-4">📐 How We Calculate Your Water Collection</h4>
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6 mb-6">
                <div className="text-center">
                  <div className="text-xl font-mono text-foreground mb-3">
                    💧 Volume = 🌧️ Rainfall × 🏠 Roof Area × ⚡ Efficiency
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Simple math to predict your water collection!
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center mb-6">
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
                  <div className="text-4xl mb-2">🌧️</div>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 mb-1" data-testid="text-monthly-rainfall">
                    {weather?.monthlyRainfall?.toFixed(1) || "2.5"}"
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">Monthly Rainfall</div>
                </div>
                <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
                  <div className="text-4xl mb-2">🏠</div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300 mb-1">
                    {rooftopArea.toFixed(0)}ft²
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">Roof Area</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4">
                  <div className="text-4xl mb-2">⚡</div>
                  <div className="text-2xl font-bold text-purple-700 dark:text-purple-300 mb-1">85%</div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">Efficiency</div>
                </div>
              </div>

              <div className="text-center bg-gradient-to-r from-primary to-secondary rounded-lg p-6 text-white">
                <div className="text-sm mb-2">🎉 Your Monthly Collection</div>
                <div className="text-4xl font-bold mb-2" data-testid="text-calculation-result">
                  {monthlyCollection.toFixed(0)} Liters
                </div>
                <div className="text-sm opacity-90">That's {Math.round(monthlyCollection/20)} buckets of water! 🪣</div>
              </div>
            </div>

            {/* Usage Section */}
            <div>
              <h4 className="text-lg font-semibold text-foreground mb-4">🚰 How You Can Use Your Harvested Water</h4>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center group hover:scale-105 transition-transform">
                  <div className="text-6xl mb-4">🚰</div>
                  <h5 className="font-semibold text-foreground mb-2">Drinking Water</h5>
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-1">
                    {Math.round(monthlyCollection * 0.1)} L
                  </div>
                  <p className="text-xs text-muted-foreground">≈ {Math.round(monthlyCollection * 0.1 / 2)} bottles per month</p>
                  <p className="text-xs text-muted-foreground">After proper filtration</p>
                </div>

                <div className="text-center group hover:scale-105 transition-transform">
                  <div className="text-6xl mb-4">🛁</div>
                  <h5 className="font-semibold text-foreground mb-2">Bathing</h5>
                  <div className="text-lg font-bold text-green-600 dark:text-green-400 mb-1">
                    {Math.round(monthlyCollection * 0.4)} L
                  </div>
                  <p className="text-xs text-muted-foreground">≈ {Math.round(monthlyCollection * 0.4 / 150)} baths per month</p>
                  <p className="text-xs text-muted-foreground">Daily bath needs</p>
                </div>

                <div className="text-center group hover:scale-105 transition-transform">
                  <div className="text-6xl mb-4">🧽</div>
                  <h5 className="font-semibold text-foreground mb-2">Washing</h5>
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400 mb-1">
                    {Math.round(monthlyCollection * 0.3)} L
                  </div>
                  <p className="text-xs text-muted-foreground">≈ {Math.round(monthlyCollection * 0.3 / 50)} loads per month</p>
                  <p className="text-xs text-muted-foreground">Clothes & dishes</p>
                </div>

                <div className="text-center group hover:scale-105 transition-transform">
                  <div className="text-6xl mb-4">🌱</div>
                  <h5 className="font-semibold text-foreground mb-2">Gardening</h5>
                  <div className="text-lg font-bold text-orange-600 dark:text-orange-400 mb-1">
                    {Math.round(monthlyCollection * 0.2)} L
                  </div>
                  <p className="text-xs text-muted-foreground">≈ {Math.round(monthlyCollection * 0.2 / 10)} plants per month</p>
                  <p className="text-xs text-muted-foreground">Plant watering</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kid-Friendly Annual Projection Chart */}
        <Card className="overflow-hidden mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-foreground flex items-center space-x-2">
                <div className="text-2xl">📊</div>
                <span>Annual Water Collection</span>
              </h3>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <div className="text-xl">📅</div>
                <span>12 months forecast</span>
              </div>
            </div>
            
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 rounded-lg p-4 text-center">
                <div className="text-4xl mb-2">💧</div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300" data-testid="text-annual-total">
                  {(annualCollection / 1000).toFixed(1)}K L
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">Liters per Year</div>
                <div className="text-xs text-blue-500 mt-1">That's like {Math.round(annualCollection/20)} buckets! 🪣</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 rounded-lg p-4 text-center">
                <div className="text-4xl mb-2">💰</div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300" data-testid="text-annual-savings">
                  ₹{(annualSavings / 1000).toFixed(1)}K
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">Money Saved per Year</div>
                <div className="text-xs text-green-500 mt-1">You can buy {Math.round(annualSavings/100)} ice creams! 🍦</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 rounded-lg p-4 text-center">
                <div className="text-4xl mb-2">🌟</div>
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {Math.round((annualCollection / (rooftopArea * 12 * 2.5 * 0.85)) * 100)}%
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400">Super Smart System!</div>
                <div className="text-xs text-purple-500 mt-1">Your roof is a water collector! 🎯</div>
              </div>
            </div>

            {/* Monthly Collection Chart */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">🗓️ Monthly Collection (Liters)</span>
                <span className="text-muted-foreground">🏆 Best Month: {maxMonthly}L</span>
              </div>
              
              {/* Bar Chart */}
              <div className="h-80 w-full">
                <ChartContainer
                  config={{
                    liters: {
                      label: "Liters",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-full w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="month" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <ChartTooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0];
                            const currentMonth = new Date().getMonth();
                            const monthIndex = monthlyData.findIndex(m => m.month === label);
                            const isCurrentMonth = monthIndex === currentMonth;
                            const seasonEmoji = monthIndex >= 5 && monthIndex <= 8 ? '🌧️' : '☀️';
                            const savings = (data.value as number * 0.002).toFixed(0);
                            
                            return (
                              <div className="rounded-lg border bg-background p-3 shadow-md">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="text-lg">{seasonEmoji}</span>
                                  <span className="font-medium">{label}</span>
                                  {isCurrentMonth && (
                                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                                      Current
                                    </span>
                                  )}
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Collection:</span>
                                    <span className="font-semibold">{data.value}L 💧</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Savings:</span>
                                    <span className="font-semibold">₹{savings} 💰</span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="liters" 
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                        className="fill-primary"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </div>
              
            {/* Summary Statistics */}
            <div className="mt-6 pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <span className="text-xl">📈</span>
                    <span className="text-sm text-muted-foreground">Average Monthly</span>
                  </div>
                  <span className="text-lg font-bold text-foreground">
                    {(annualCollection / 12).toFixed(0)}L
                  </span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <span className="text-xl">🛡️</span>
                    <span className="text-sm text-muted-foreground">Water Security</span>
                  </div>
                  <span className={`text-lg font-bold ${
                    annualCollection > 10000 ? 'text-green-600' :
                    annualCollection > 5000 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {annualCollection > 10000 ? '🟢 Super!' :
                     annualCollection > 5000 ? '🟡 Good' : '🔴 Okay'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Efficiency & Analytics */}
        <Card className="mb-8 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/50 dark:to-emerald-900/50 border-green-200 dark:border-green-800">
          <CardContent className="p-8">
            <h3 className="text-2xl font-semibold text-green-800 dark:text-green-200 mb-6 flex items-center space-x-2">
              <div className="text-2xl">💰</div>
              <span>Financial Efficiency & ROI</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* ROI Card */}
              <Card className="bg-white/70 dark:bg-gray-900/50 border-green-200/50 dark:border-green-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-green-800 dark:text-green-200">ROI</h4>
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300" data-testid="text-roi">
                    {calculations?.roi ? `${parseFloat(calculations.roi).toFixed(1)}%` : 'N/A'}
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400">Return on Investment</p>
                </CardContent>
              </Card>

              {/* Payback Period Card */}
              <Card className="bg-white/70 dark:bg-gray-900/50 border-green-200/50 dark:border-green-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-green-800 dark:text-green-200">Payback</h4>
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300" data-testid="text-payback-period">
                    {calculations?.paybackPeriod ? `${parseFloat(calculations.paybackPeriod).toFixed(1)} yrs` : 'N/A'}
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400">Investment Recovery Time</p>
                </CardContent>
              </Card>

              {/* Government Incentives Card */}
              <Card className="bg-white/70 dark:bg-gray-900/50 border-green-200/50 dark:border-green-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-green-800 dark:text-green-200">Incentives</h4>
                    <Target className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300" data-testid="text-incentives">
                    ₹{calculations?.governmentIncentives ? (parseFloat(calculations.governmentIncentives) / 1000).toFixed(0) : '0'}k
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400">Total Benefits Available</p>
                </CardContent>
              </Card>

              {/* Annual Maintenance Card */}
              <Card className="bg-white/70 dark:bg-gray-900/50 border-green-200/50 dark:border-green-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-green-800 dark:text-green-200">Maintenance</h4>
                    <Settings className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300" data-testid="text-maintenance-cost">
                    ₹{calculations?.annualMaintenanceCost ? (parseFloat(calculations.annualMaintenanceCost) / 1000).toFixed(1) : '0'}k
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400">Annual Upkeep Cost</p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Incentives Breakdown */}
              <div className="bg-white/70 dark:bg-gray-900/50 rounded-lg p-6 border border-green-200/50 dark:border-green-700/50">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-2xl">🎯</span>
                  <h4 className="font-semibold text-green-800 dark:text-green-200">Available Incentives</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-700 dark:text-green-300">Government Subsidy</span>
                    <span className="font-medium text-green-800 dark:text-green-200">
                      ₹{calculations?.subsidyAmount ? (parseFloat(calculations.subsidyAmount) / 1000).toFixed(0) : '0'}k
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-700 dark:text-green-300">Tax Benefits</span>
                    <span className="font-medium text-green-800 dark:text-green-200">
                      ₹{calculations?.taxBenefits ? (parseFloat(calculations.taxBenefits) / 1000).toFixed(0) : '0'}k
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-700 dark:text-green-300">Total Incentives</span>
                    <span className="font-bold text-green-800 dark:text-green-200">
                      ₹{calculations?.governmentIncentives ? (parseFloat(calculations.governmentIncentives) / 1000).toFixed(0) : '0'}k
                    </span>
                  </div>
                </div>
              </div>

              {/* Maintenance Breakdown */}
              <div className="bg-white/70 dark:bg-gray-900/50 rounded-lg p-6 border border-green-200/50 dark:border-green-700/50">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-2xl">🔧</span>
                  <h4 className="font-semibold text-green-800 dark:text-green-200">Annual Maintenance</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-700 dark:text-green-300">Filter Replacement</span>
                    <span className="font-medium text-green-800 dark:text-green-200">
                      ₹{calculations?.filterReplacementCost ? (parseFloat(calculations.filterReplacementCost) / 1000).toFixed(1) : '2.0'}k
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-700 dark:text-green-300">System Inspection</span>
                    <span className="font-medium text-green-800 dark:text-green-200">
                      ₹{calculations?.systemInspectionCost ? (parseFloat(calculations.systemInspectionCost) / 1000).toFixed(1) : '1.5'}k
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-700 dark:text-green-300">General Maintenance</span>
                    <span className="font-medium text-green-800 dark:text-green-200">
                      ₹{calculations?.annualMaintenanceCost ? ((parseFloat(calculations.annualMaintenanceCost) - parseFloat(calculations.filterReplacementCost || '2000') - parseFloat(calculations.systemInspectionCost || '1500')) / 1000).toFixed(1) : '1.5'}k
                    </span>
                  </div>
                </div>
              </div>

              {/* Upgradation Options */}
              <div className="bg-white/70 dark:bg-gray-900/50 rounded-lg p-6 border border-green-200/50 dark:border-green-700/50">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-2xl">⚡</span>
                  <h4 className="font-semibold text-green-800 dark:text-green-200">Upgrade Options</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-700 dark:text-green-300">Capacity Expansion</span>
                    <span className="font-medium text-green-800 dark:text-green-200">
                      ₹{calculations?.capacityExpansionCost ? (parseFloat(calculations.capacityExpansionCost) / 1000).toFixed(0) : '0'}k
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-700 dark:text-green-300">Efficiency Improvement</span>
                    <span className="font-medium text-green-800 dark:text-green-200">
                      ₹{calculations?.efficiencyImprovementCost ? (parseFloat(calculations.efficiencyImprovementCost) / 1000).toFixed(0) : '0'}k
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-700 dark:text-green-300">Complete Upgrade</span>
                    <span className="font-medium text-green-800 dark:text-green-200">
                      ₹{calculations?.upgradationCost ? (parseFloat(calculations.upgradationCost) / 1000).toFixed(0) : '0'}k
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Maximize Your System Block */}
        <Card className="mb-8 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-blue-200 dark:border-blue-800">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="text-2xl font-semibold text-blue-800 dark:text-blue-200 flex items-center space-x-2">
                <div className="text-2xl">🚀</div>
                <span>Maximize Your System</span>
              </div>
              <div className="text-4xl">⚡</div>
            </div>
            
            <div className="flex justify-center">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl">
                {/* Efficiency Tips */}
                <div className="bg-white/70 dark:bg-gray-900/50 rounded-lg p-4 border border-blue-200/50 dark:border-blue-700/50">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-2xl">💡</span>
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200">Efficiency Tips</h4>
                </div>
                <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                  <li className="flex items-start space-x-2 p-2 rounded">
                    <span className="text-blue-500">•</span>
                    <span>Clean gutters monthly for maximum flow</span>
                  </li>
                  <li className="flex items-start space-x-2 p-2 rounded">
                    <span className="text-blue-500">•</span>
                    <span>Install first-flush diverters for better quality</span>
                  </li>
                  <li className="flex items-start space-x-2 p-2 rounded">
                    <span className="text-blue-500">•</span>
                    <span>Use mesh filters to prevent debris</span>
                  </li>
                </ul>
              </div>

                {/* Upgrade Suggestions */}
                <div className="bg-white/70 dark:bg-gray-900/50 rounded-lg p-4 border border-blue-200/50 dark:border-blue-700/50">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-2xl">🔧</span>
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200">Upgrades</h4>
                </div>
                <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                  <li className="flex items-start space-x-2 p-2 rounded">
                    <span className="text-blue-500">•</span>
                    <span>Add larger storage tanks (+30% capacity)</span>
                  </li>
                  <li className="flex items-start space-x-2 p-2 rounded">
                    <span className="text-blue-500">•</span>
                    <span>Install pump systems for higher pressure</span>
                  </li>
                  <li className="flex items-start space-x-2 p-2 rounded">
                    <span className="text-blue-500">•</span>
                    <span>Connect multiple downspouts</span>
                  </li>
                </ul>
                </div>

                {/* Incentives */}
                <div className="bg-white/70 dark:bg-gray-900/50 rounded-lg p-4 border border-blue-200/50 dark:border-blue-700/50">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-2xl">🎁</span>
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200">Incentives</h4>
                  </div>
                  <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                    <li className="flex items-start space-x-2 p-2 rounded">
                      <span className="text-blue-500">•</span>
                      <span>Government Subsidy - ₹15,000 Available</span>
                    </li>
                    <li className="flex items-start space-x-2 p-2 rounded">
                      <span className="text-blue-500">•</span>
                      <span>Tax Benefits - 20% Deduction</span>
                    </li>
                    <li className="flex items-start space-x-2 p-2 rounded">
                      <span className="text-blue-500">•</span>
                      <span>Water Board Rebate - ₹5,000 Cashback</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap gap-4 justify-center">
              <Button 
                variant="default" 
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2"
                data-testid="button-schedule-maintenance"
              >
                <span>🔧</span>
                <span>Schedule Maintenance</span>
              </Button>
              <Button 
                variant="outline" 
                className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 flex items-center space-x-2"
                data-testid="button-upgrade-system"
              >
                <span>⬆️</span>
                <span>Upgrade System</span>
              </Button>
              <Button 
                variant="outline" 
                className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 flex items-center space-x-2"
                data-testid="button-view-analytics"
              >
                <span>📈</span>
                <span>View Analytics</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Fixed 7-Day Weather Forecast */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <h3 className="text-2xl font-semibold text-foreground mb-6 flex items-center space-x-2">
              <div className="text-2xl">🌤️</div>
              <span>7-Day Weather Forecast</span>
            </h3>
            
            {forecastLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : forecasts?.forecasts?.length ? (
              <div className="grid grid-cols-7 gap-3">
                {forecasts.forecasts.map((forecast, index) => {
                  const date = new Date(forecast.date);
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                  const weatherEmoji = forecast.precipitationSum > 5 ? '🌧️' : forecast.precipitationSum > 0 ? '🌦️' : '☀️';
                  
                  return (
                    <div key={forecast.id} className="text-center p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="text-sm font-medium text-muted-foreground mb-2">{dayName}</div>
                      <div className="text-3xl mb-2">{weatherEmoji}</div>
                      <div className="text-sm font-semibold text-foreground">
                        {Math.round(forecast.maxTemperature)}°/{Math.round(forecast.minTemperature)}°
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {forecast.precipitationSum}mm 💧
                      </div>
                      {forecast.precipitationSum > 0 && (
                        <div className={`text-xs px-2 py-1 rounded-full mt-2 ${
                          forecast.collectableRain ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {forecast.collectableRain ? '✅ Good for collection!' : '⚠️ Light rain'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-4xl mb-4">🌤️</div>
                <p>Weather forecast is being updated. Please check back soon!</p>
                <p className="text-sm mt-2">We're fetching the latest weather data for your location.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All-in-One Popup */}
      <AllInOnePopup />
    </div>
  );
}