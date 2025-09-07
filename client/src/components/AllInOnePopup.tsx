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
  ChevronDown
} from "lucide-react";

export default function AllInOnePopup() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [location, setLocation] = useState("");
  const [rooftopArea, setRooftopArea] = useState("");
  const [rooftopType, setRooftopType] = useState("concrete");
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
        <Card className="w-96 h-[32rem] shadow-2xl border-2 border-primary/20 bg-gradient-to-br from-background to-muted/30">
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
                  onClick={() => setIsExpanded(false)}
                  data-testid="button-minimize-popup"
                >
                  <Minimize2 className="w-4 h-4" />
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
              <TabsList className="grid w-full grid-cols-4 mx-4 mb-2">
                <TabsTrigger value="dashboard" className="text-xs">
                  <Home className="w-3 h-3" />
                </TabsTrigger>
                <TabsTrigger value="calculator" className="text-xs">
                  <Calculator className="w-3 h-3" />
                </TabsTrigger>
                <TabsTrigger value="weather" className="text-xs">
                  <Cloud className="w-3 h-3" />
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-xs">
                  <Settings className="w-3 h-3" />
                </TabsTrigger>
              </TabsList>

              <div className="px-4 pb-4 h-[22rem] overflow-y-auto">
                <TabsContent value="dashboard" className="space-y-3 mt-0">
                  <div className="grid grid-cols-2 gap-2">
                    {calculations && (
                      <>
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                          <div className="text-xl font-bold text-blue-600">
                            {Math.round(parseFloat((calculations as any)?.monthlyCollection || "0"))}L
                          </div>
                          <div className="text-xs text-muted-foreground">Monthly Collection</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                          <div className="text-xl font-bold text-green-600">
                            ₹{Math.round(parseFloat((calculations as any)?.monthlySavings || "0"))}
                          </div>
                          <div className="text-xs text-muted-foreground">Monthly Savings</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                          <div className="text-xl font-bold text-purple-600">
                            {parseFloat((calculations as any)?.paybackPeriod || "0").toFixed(1)} years
                          </div>
                          <div className="text-xs text-muted-foreground">Payback Period</div>
                        </div>
                        <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                          <div className="text-xl font-bold text-orange-600">
                            {parseFloat((calculations as any)?.roi || "0").toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">ROI</div>
                        </div>
                      </>
                    )}
                  </div>

                  {weatherData && (
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Cloud className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium">{(weatherData as any)?.city}</span>
                        </div>
                        <Badge variant="outline">
                          {(weatherData as any)?.monthlyRainfall}" rain
                        </Badge>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    {quickActions.map((action) => (
                      <Button
                        key={action.id}
                        variant="outline"
                        size="sm"
                        onClick={action.action}
                        className="flex items-center space-x-2"
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
                      <div className="text-sm font-medium">7-Day Forecast</div>
                      <div className="space-y-1">
                        {(forecasts as any)?.forecasts.slice(0, 4).map((forecast: any, index: number) => (
                          <div key={index} className="flex items-center justify-between text-xs bg-muted/30 p-2 rounded">
                            <span>{new Date(forecast.date).toLocaleDateString()}</span>
                            <div className="flex items-center space-x-2">
                              {forecast.collectableRain && (
                                <Badge variant="outline" className="text-xs">
                                  {parseFloat(forecast.precipitationSum).toFixed(1)}mm
                                </Badge>
                              )}
                              <span className="text-muted-foreground">
                                {forecast.maxTemperature}°C
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="settings" className="space-y-4 mt-0">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Location</Label>
                      <Input
                        placeholder="City, State"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="mt-1"
                        data-testid="input-update-location"
                      />
                    </div>

                    <Button
                      onClick={() => {
                        if (location.trim()) {
                          const parts = location.split(",").map(p => p.trim());
                          const city = parts[0];
                          updateProfileMutation.mutate({ location, city });
                          setLocation("");
                        }
                      }}
                      className="w-full"
                      disabled={updateProfileMutation.isPending}
                      data-testid="button-update-location"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Update Location
                    </Button>

                    <Separator />

                    <Button
                      onClick={exportReport}
                      variant="outline"
                      className="w-full"
                      data-testid="button-export-report"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Excel Report
                    </Button>

                    {(notifications as any)?.notifications && (
                      <>
                        <Separator />
                        <div className="text-xs text-muted-foreground">
                          {(notifications as any)?.notifications?.length} notifications
                        </div>
                      </>
                    )}
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