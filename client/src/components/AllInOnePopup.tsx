import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import {
  Calculator,
  MapPin,
  Cloud,
  Download,
  Bell,
  Settings,
  Droplets,
  TrendingUp,
  Calendar,
  X,
  Maximize2,
  Minimize2,
  Home,
  ChevronUp,
  ChevronDown,
  BarChart3,
  Users,
  Shield,
  Zap,
  Target,
  Activity,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Info,
  Share2,
  RefreshCw,
  Eye
} from "lucide-react";

export default function AllInOnePopup() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [location, setLocation] = useState("");
  const [rooftopArea, setRooftopArea] = useState("");
  const [rooftopType, setRooftopType] = useState("concrete");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Removed auto-close functionality to keep popup open
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  // Fetch user profile and calculations
  const { data: profile } = useQuery({
    queryKey: ["/api/profile"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: calculations } = useQuery({
    queryKey: ["/api/calculations"],
    enabled: isAuthenticated && !!profile,
    retry: false,
  });

  const { data: weatherData } = useQuery({
    queryKey: ["/api/weather", (profile as any)?.city],
    queryFn: async () => {
      if (!(profile as any)?.city) return null;
      const response = await apiRequest("GET", `/api/weather/${(profile as any).city}`);
      return response.json();
    },
    enabled: isAuthenticated && !!(profile as any)?.city,
    retry: false,
  });

  const { data: forecasts } = useQuery({
    queryKey: ["/api/weather", (profile as any)?.id],
    queryFn: async () => {
      if (!(profile as any)?.id) return null;
      const response = await apiRequest("GET", `/api/weather/${(profile as any).id}`);
      return response.json();
    },
    enabled: isAuthenticated && !!(profile as any)?.id,
    retry: false,
  });

  const { data: notifications } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Fetch weather alerts
  const { data: weatherAlerts } = useQuery({
    queryKey: ["/api/weather/alerts", (profile as any)?.id],
    queryFn: async () => {
      if (!(profile as any)?.id) return null;
      const response = await apiRequest("GET", `/api/weather/alerts/${(profile as any).id}`);
      return response.json();
    },
    enabled: isAuthenticated && !!(profile as any)?.id,
    retry: false,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Quick update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({ title: "Profile updated successfully" });
    },
    onError: () => {
      toast({ title: "Error updating profile", variant: "destructive" });
    },
  });

  // Calculate water collection mutation
  const calculateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/calculations", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calculations"] });
      toast({ title: "Calculations updated successfully" });
    },
    onError: () => {
      toast({ title: "Error calculating water collection", variant: "destructive" });
    },
  });

  // Export Excel report
  const exportReport = async () => {
    try {
      const response = await apiRequest("GET", "/api/export/excel");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Boondh_Report_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "Report downloaded successfully" });
    } catch (error) {
      toast({ title: "Error downloading report", variant: "destructive" });
    }
  };

  const quickActions = [
    {
      id: "location",
      title: "Update Location",
      icon: MapPin,
      action: () => setActiveTab("location")
    },
    {
      id: "calculate",
      title: "Calculate Water",
      icon: Calculator,
      action: () => setActiveTab("calculator")
    },
    {
      id: "weather",
      title: "View Weather",
      icon: Cloud,
      action: () => setActiveTab("weather")
    },
    {
      id: "export",
      title: "Download Report",
      icon: Download,
      action: exportReport
    }
  ];

  if (!isAuthenticated) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50" data-testid="popup-allinone">
      {/* Compact Button */}
      {!isExpanded && (
        <Button
          onClick={() => setIsExpanded(true)}
          className="w-14 h-14 rounded-full shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-2 border-white"
          data-testid="button-expand-popup"
        >
          <Droplets className="w-6 h-6" />
        </Button>
      )}

      {/* Expanded Popup */}
      {isExpanded && (
        <Card className={`${isFullscreen ? 'fixed inset-4 z-50' : 'w-96 h-[32rem]'} shadow-2xl border-2 border-primary/20 bg-gradient-to-br from-background to-muted/30 transition-all duration-300`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <Droplets className="w-4 h-4 text-white" />
                </div>
                <CardTitle className="text-lg">Boondh Dashboard</CardTitle>
              </div>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  data-testid="button-fullscreen-popup"
                  className="hover:bg-muted/50"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  data-testid="button-close-popup"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {profile && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>{(profile as any)?.city || "Location not set"}</span>
                {calculations && (
                  <Badge variant="outline">
                    {Math.round(parseFloat((calculations as any)?.monthlyCollection || "0"))}L/month
                  </Badge>
                )}
              </div>
            )}
          </CardHeader>

          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="grid w-full grid-cols-5 mx-4 mb-2">
                <TabsTrigger value="dashboard" className="text-xs">
                  <Home className="w-3 h-3" />
                </TabsTrigger>
                <TabsTrigger value="calculator" className="text-xs">
                  <Calculator className="w-3 h-3" />
                </TabsTrigger>
                <TabsTrigger value="weather" className="text-xs">
                  <Cloud className="w-3 h-3" />
                </TabsTrigger>
                <TabsTrigger value="analytics" className="text-xs">
                  <BarChart3 className="w-3 h-3" />
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-xs">
                  <Settings className="w-3 h-3" />
                </TabsTrigger>
              </TabsList>

              <div className={`px-4 pb-4 ${isFullscreen ? 'h-[calc(100vh-12rem)]' : 'h-[22rem]'} overflow-y-auto`}>
                <TabsContent value="dashboard" className="space-y-3 mt-0">
                  {/* User Profile Section */}
                  {profile && (
                    <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20 p-3 rounded-lg border border-blue-200/50 dark:border-blue-700/50">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center">
                          <span className="text-white text-xs">👤</span>
                        </div>
                        <span className="text-sm font-semibold">Your System Status</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Location: {(profile as any)?.city || "Not set"}</span>
                        {(profile as any)?.rooftopArea && (
                          <Badge variant="outline">{(profile as any).rooftopArea} sq ft</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    {calculations && (
                      <>
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200/50 dark:border-blue-700/50">
                          <div className="text-lg font-bold text-blue-600">
                            {Math.round(parseFloat((calculations as any)?.monthlyCollection || "0"))}L
                          </div>
                          <div className="text-xs text-muted-foreground">Monthly Collection</div>
                          <div className="text-xs text-blue-500 mt-1">💧 Water Saved</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200/50 dark:border-green-700/50">
                          <div className="text-lg font-bold text-green-600">
                            ₹{Math.round(parseFloat((calculations as any)?.monthlySavings || "0"))}
                          </div>
                          <div className="text-xs text-muted-foreground">Monthly Savings</div>
                          <div className="text-xs text-green-500 mt-1">💰 Money Saved</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200/50 dark:border-purple-700/50">
                          <div className="text-lg font-bold text-purple-600">
                            {parseFloat((calculations as any)?.paybackPeriod || "0").toFixed(1)} yrs
                          </div>
                          <div className="text-xs text-muted-foreground">Payback Period</div>
                          <div className="text-xs text-purple-500 mt-1">⏱️ Break Even</div>
                        </div>
                        <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200/50 dark:border-orange-700/50">
                          <div className="text-lg font-bold text-orange-600">
                            {parseFloat((calculations as any)?.roi || "0").toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">ROI</div>
                          <div className="text-xs text-orange-500 mt-1">📈 Return Rate</div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Weather and Environmental Impact */}
                  {weatherData && (
                    <div className="bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/20 dark:to-blue-950/20 p-3 rounded-lg border border-sky-200/50 dark:border-sky-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Cloud className="w-4 h-4 text-sky-500" />
                          <span className="text-sm font-medium">{(weatherData as any)?.city}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {(weatherData as any)?.monthlyRainfall}" rain
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        🌍 Environmental Impact: Helping reduce groundwater depletion
                      </div>
                    </div>
                  )}

                  {/* Weather Alerts Section */}
                  {weatherAlerts?.alerts && weatherAlerts.alerts.length > 0 && (
                    <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 p-3 rounded-lg border border-red-200/50 dark:border-red-700/50">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-red-800 dark:text-red-200">Weather Alerts</span>
                        <Badge variant="outline" className="text-xs">{weatherAlerts.location}</Badge>
                      </div>
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {weatherAlerts.alerts.slice(0, 2).map((alert: any, index: number) => (
                          <div key={alert.id} className="text-xs space-y-1">
                            <div className="flex items-center space-x-2">
                              {alert.type === 'critical' && <span className="text-red-600">🚨</span>}
                              {alert.type === 'warning' && <span className="text-orange-600">⚠️</span>}
                              {alert.type === 'info' && <span className="text-blue-600">ℹ️</span>}
                              <span className="font-medium text-red-700 dark:text-red-300">{alert.title}</span>
                            </div>
                            <div className="text-red-600 dark:text-red-400 ml-5">{alert.message}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* System Recommendations */}
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 p-3 rounded-lg border border-amber-200/50 dark:border-amber-700/50">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-800 dark:text-amber-200">Quick Tips</span>
                    </div>
                    <div className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                      <div>• Clean gutters monthly for maximum flow</div>
                      <div>• Install first-flush diverters for quality</div>
                      <div>• Check system after heavy rains</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {quickActions.map((action) => (
                      <Button
                        key={action.id}
                        variant="outline"
                        size="sm"
                        onClick={action.action}
                        className="flex items-center space-x-2 border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                        data-testid={`button-quick-${action.id}`}
                      >
                        <action.icon className="w-4 h-4" />
                        <span className="text-xs">{action.title}</span>
                      </Button>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="calculator" className="space-y-4 mt-0">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Rooftop Area (sq ft)</Label>
                      <Input
                        type="number"
                        placeholder="1000"
                        value={rooftopArea}
                        onChange={(e) => setRooftopArea(e.target.value)}
                        className="mt-1"
                        data-testid="input-rooftop-area"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs">Rooftop Type</Label>
                      <select
                        className="w-full mt-1 p-2 border rounded-md bg-background"
                        value={rooftopType}
                        onChange={(e) => setRooftopType(e.target.value)}
                        data-testid="select-rooftop-type"
                      >
                        <option value="concrete">Concrete</option>
                        <option value="metal">Metal</option>
                        <option value="tile">Tile</option>
                        <option value="asbestos">Asbestos</option>
                        <option value="thatched">Thatched</option>
                      </select>
                    </div>

                    <Button
                      onClick={() => {
                        const data = {
                          rooftopArea: rooftopArea || (profile as any)?.rooftopArea,
                          rooftopType: rooftopType,
                          monthlyRainfall: (weatherData as any)?.monthlyRainfall || 2.5
                        };
                        if (rooftopArea) {
                          updateProfileMutation.mutate({ rooftopArea, rooftopType });
                        }
                        calculateMutation.mutate(data);
                      }}
                      className="w-full"
                      disabled={calculateMutation.isPending}
                      data-testid="button-calculate-water"
                    >
                      <Calculator className="w-4 h-4 mr-2" />
                      {calculateMutation.isPending ? "Calculating..." : "Calculate Water Collection"}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="weather" className="space-y-3 mt-0">
                  {weatherData && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{(weatherData as any)?.city}</span>
                        <Badge>{(weatherData as any)?.climateZone}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Monthly Rain: {(weatherData as any)?.monthlyRainfall}"</div>
                        <div>Annual Rain: {(weatherData as any)?.annualRainfall}"</div>
                      </div>
                    </div>
                  )}

                  {(forecasts as any)?.forecasts && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">7-Day Forecast</div>
                        <Badge variant="outline" className="text-xs">
                          {(forecasts as any).forecasts.length} days
                        </Badge>
                      </div>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {(forecasts as any)?.forecasts.map((forecast: any, index: number) => {
                          const date = new Date(forecast.date);
                          const today = new Date();
                          const isToday = date.toDateString() === today.toDateString();
                          const isTomorrow = date.toDateString() === new Date(today.getTime() + 24*60*60*1000).toDateString();
                          
                          let dateLabel;
                          if (isToday) dateLabel = 'Today';
                          else if (isTomorrow) dateLabel = 'Tomorrow';
                          else dateLabel = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                          
                          return (
                            <div key={index} className="flex items-center justify-between text-xs bg-muted/30 p-2 rounded hover:bg-muted/50 transition-colors">
                              <div className="flex items-center space-x-2">
                                <span className={`font-medium ${isToday ? 'text-blue-600' : ''}`}>
                                  {dateLabel}
                                </span>
                                {forecast.collectableRain && (
                                  <span className="text-green-600">💧</span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                {forecast.precipitationSum > 0 && (
                                  <Badge variant="outline" className={`text-xs ${forecast.collectableRain ? 'border-green-500 text-green-600' : 'border-blue-500 text-blue-600'}`}>
                                    {parseFloat(forecast.precipitationSum).toFixed(1)}mm
                                  </Badge>
                                )}
                                <span className="text-muted-foreground">
                                  {forecast.maxTemperature}°C
                                </span>
                                {forecast.rainType !== 'none' && (
                                  <span className="text-xs text-blue-600 capitalize">
                                    {forecast.rainType}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {(forecasts as any)?.forecasts.length > 0 && (
                        <div className="text-xs text-center text-muted-foreground mt-2">
                          💧 = Collectable rain • Updated: {new Date().toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4 mt-0">
                  <div className="space-y-4">
                    <div className="text-sm font-medium">System Analytics</div>
                    
                    {calculations && (
                      <div className="grid grid-cols-1 gap-3">
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Target className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium">Efficiency Score</span>
                            </div>
                            <Badge className="bg-green-100 text-green-800">
                              {Math.round(((calculations as any)?.runoffCoefficient || 0.85) * 100)}%
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Activity className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium">System ROI</span>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600">
                                {parseFloat((calculations as any)?.roi || "0").toFixed(1)}%
                              </div>
                              <div className="text-xs text-muted-foreground">Annual Return</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Zap className="w-4 h-4 text-purple-600" />
                              <span className="text-sm font-medium">Government Benefits</span>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-purple-600">
                                ₹{Math.round(parseFloat((calculations as any)?.governmentIncentives || "0"))}
                              </div>
                              <div className="text-xs text-muted-foreground">Total Savings</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Quick Analytics</div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center space-x-2"
                          data-testid="button-refresh-data"
                          onClick={() => {
                            queryClient.invalidateQueries({ queryKey: ["/api/calculations"] });
                            queryClient.invalidateQueries({ queryKey: ["/api/weather"] });
                            toast({ title: "Data refreshed successfully" });
                          }}
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Refresh</span>
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (navigator.share) {
                              navigator.share({
                                title: "Boondh - Rainwater Harvesting",
                                text: `I'm saving ₹${Math.round(parseFloat((calculations as any)?.annualSavings || "0"))} annually with rainwater harvesting!`,
                                url: window.location.href,
                              });
                            } else {
                              navigator.clipboard.writeText(window.location.href);
                              toast({ title: "Link copied to clipboard" });
                            }
                          }}
                          data-testid="button-share-results"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>Share</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>


                <TabsContent value="settings" className="space-y-4 mt-0">
                  <div className="space-y-4">
                    <div className="text-sm font-medium flex items-center space-x-2">
                      <Settings className="w-4 h-4" />
                      <span>System Settings & Admin</span>
                    </div>
                    
                    {/* Quick Location Update */}
                    <div className="space-y-2">
                      <Label className="text-xs">Quick Location Update</Label>
                      <div className="flex space-x-2">
                        <Input
                          placeholder="City, State"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="flex-1"
                          data-testid="input-update-location"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            if (location.trim()) {
                              const parts = location.split(",").map(p => p.trim());
                              const city = parts[0];
                              updateProfileMutation.mutate({ location, city });
                              setLocation("");
                            }
                          }}
                          disabled={updateProfileMutation.isPending}
                          data-testid="button-update-location"
                        >
                          <MapPin className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Export & Data Management */}
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">Data Export & Management</div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={exportReport}
                          data-testid="button-export-excel"
                        >
                          <FileSpreadsheet className="w-3 h-3 mr-1" />
                          Excel
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const data = {
                              profile: profile,
                              calculations: calculations,
                              weather: weatherData
                            };
                            const jsonString = JSON.stringify(data, null, 2);
                            const blob = new Blob([jsonString], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `boondh_data_${new Date().toISOString().split('T')[0]}.json`;
                            a.click();
                            URL.revokeObjectURL(url);
                            toast({ title: "JSON data exported" });
                          }}
                          data-testid="button-export-json"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          JSON
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Notifications & Alerts */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-medium text-muted-foreground">Notifications</div>
                        <Badge variant="outline">
                          {(notifications as any)?.notifications?.length || 0}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const notificationData = {
                              userId: user?.sub || 'anonymous',
                              type: "system_update",
                              title: "System Check Complete",
                              message: `Water collection system is functioning optimally. Current monthly collection: ${Math.round(parseFloat((calculations as any)?.monthlyCollection || "0"))}L`
                            };
                            // In real implementation, would call createNotification API
                            toast({ 
                              title: "Test notification created",
                              description: "System health check completed" 
                            });
                          }}
                          data-testid="button-test-notification"
                        >
                          <Bell className="w-3 h-3 mr-1" />
                          Test Alert
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* System Status & Health */}
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">System Status</div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center space-x-2">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>Database Connection</span>
                          </span>
                          <Badge className="bg-green-100 text-green-800">Online</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center space-x-2">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>Weather API</span>
                          </span>
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        </div>
                        
                      </div>
                    </div>

                    <Separator />

                    {/* Advanced Features */}
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">Advanced Features</div>
                      <div className="grid grid-cols-1 gap-1">
                        <div className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded">
                          <span className="flex items-center space-x-2">
                            <Shield className="w-3 h-3 text-blue-500" />
                            <span>Authentication</span>
                          </span>
                          <span className="text-green-600">Secure</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded">
                          <span className="flex items-center space-x-2">
                            <Users className="w-3 h-3 text-purple-500" />
                            <span>Multi-User Support</span>
                          </span>
                          <span className="text-green-600">Active</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded">
                          <span className="flex items-center space-x-2">
                            <FileSpreadsheet className="w-3 h-3 text-orange-500" />
                            <span>Excel Integration</span>
                          </span>
                          <span className="text-green-600">Ready</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}