import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { MapPin } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Location() {
  const [location, setLocationText] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [, setRoute] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const updateLocationMutation = useMutation({
    mutationFn: async (locationData: { location: string; city?: string; latitude?: number; longitude?: number }) => {
      const response = await apiRequest("POST", "/api/profile", locationData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Location saved",
        description: "Your location has been saved successfully.",
      });
      setRoute("/rooftop");
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
        description: "Failed to save location. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation. Please enter your location manually.",
        variant: "destructive",
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use reverse geocoding to get city name (simplified)
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          const city = data.city || data.locality || data.principalSubdivision || "Unknown City";
          const locationStr = `${city}, ${data.principalSubdivision || data.countryName || "India"}`;
          
          setLocationText(locationStr);
          updateLocationMutation.mutate({
            location: locationStr,
            city,
            latitude,
            longitude,
          });
        } catch (error) {
          console.error("Reverse geocoding failed:", error);
          // Use a fallback coordinate-based location with generic city
          const locationStr = `Location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`;
          const fallbackCity = "Delhi"; // Default city for India
          setLocationText(locationStr);
          updateLocationMutation.mutate({
            location: locationStr,
            city: fallbackCity,
            latitude,
            longitude,
          });
          toast({
            title: "Location saved",
            description: "Your coordinates have been saved with a default city.",
          });
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        setIsGettingLocation(false);
        toast({
          title: "Location access denied",
          description: "Please enter your location manually or enable location permissions.",
          variant: "destructive",
        });
        console.error("Geolocation error:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000,
      }
    );
  };

  const handleManualContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) {
      toast({
        title: "Location required",
        description: "Please enter your location to continue.",
        variant: "destructive",
      });
      return;
    }

    // Extract city from location string (simplified)
    const parts = location.split(",");
    const city = parts[0]?.trim() || location.trim();

    updateLocationMutation.mutate({
      location: location.trim(),
      city,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Card className="shadow-xl border border-border">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-xl mx-auto mb-4 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Your Location</h2>
              <p className="text-muted-foreground">We need your location to calculate accurate rainfall data for your area</p>
            </div>

            <div className="space-y-6">
              <Button 
                className="w-full flex items-center justify-center space-x-3" 
                onClick={getCurrentLocation}
                disabled={isGettingLocation || updateLocationMutation.isPending}
                data-testid="button-current-location"
              >
                <MapPin className="w-5 h-5" />
                <span>{isGettingLocation ? "Getting Location..." : "Use Current Location"}</span>
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-muted-foreground">or</span>
                </div>
              </div>

              <form onSubmit={handleManualContinue}>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-foreground mb-2">Enter Manually</Label>
                    <Input
                      type="text"
                      placeholder="City, State or ZIP code"
                      value={location}
                      onChange={(e) => setLocationText(e.target.value)}
                      className="w-full"
                      data-testid="input-location"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    variant="secondary" 
                    className="w-full"
                    disabled={updateLocationMutation.isPending}
                    data-testid="button-continue"
                  >
                    {updateLocationMutation.isPending ? "Saving..." : "Continue"}
                  </Button>
                </div>
              </form>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">Your location data is used only for rainfall calculations and is kept private.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
