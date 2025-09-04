import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Home } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Rooftop() {
  const [name, setName] = useState("");
  const [rooftopType, setRooftopType] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [totalArea, setTotalArea] = useState("");
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

  // Calculate total area when length and width change
  useEffect(() => {
    if (length && width && !isNaN(Number(length)) && !isNaN(Number(width))) {
      const calculated = Number(length) * Number(width);
      setTotalArea(calculated.toString());
    }
  }, [length, width]);

  const updateRooftopMutation = useMutation({
    mutationFn: async (rooftopData: { name?: string; rooftopType?: string; rooftopArea: string; rooftopLength?: string; rooftopWidth?: string }) => {
      const response = await apiRequest("POST", "/api/profile", rooftopData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rooftop area saved",
        description: "Your rooftop dimensions have been saved successfully.",
      });
      setRoute("/dashboard");
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
        description: "Failed to save rooftop area. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const area = totalArea || (length && width ? (Number(length) * Number(width)).toString() : "");
    
    if (!area || isNaN(Number(area)) || Number(area) <= 0) {
      toast({
        title: "Invalid area",
        description: "Please enter a valid rooftop area or dimensions.",
        variant: "destructive",
      });
      return;
    }

    const rooftopData: any = { rooftopArea: area };
    
    if (name.trim()) {
      rooftopData.name = name.trim();
    }
    
    if (rooftopType) {
      rooftopData.rooftopType = rooftopType;
    }
    
    if (length && width) {
      rooftopData.rooftopLength = length;
      rooftopData.rooftopWidth = width;
    }

    updateRooftopMutation.mutate(rooftopData);
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
                <Home className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Rooftop Area</h2>
              <p className="text-muted-foreground">Enter your rooftop dimensions to calculate water collection potential</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label className="text-sm font-medium text-foreground mb-2">Your Name</Label>
                <Input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full"
                  data-testid="input-name"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-foreground mb-2">Roof Type</Label>
                <Select value={rooftopType} onValueChange={setRooftopType}>
                  <SelectTrigger className="w-full" data-testid="select-roof-type">
                    <SelectValue placeholder="Select your roof type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tile">Tile Roof</SelectItem>
                    <SelectItem value="metal">Metal/Tin Roof</SelectItem>
                    <SelectItem value="concrete">Concrete/RCC Slab</SelectItem>
                    <SelectItem value="asbestos">Asbestos Sheets</SelectItem>
                    <SelectItem value="thatched">Thatched Roof</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-foreground mb-2">Length (ft)</Label>
                  <Input
                    type="number"
                    placeholder="40"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="w-full"
                    data-testid="input-length"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-foreground mb-2">Width (ft)</Label>
                  <Input
                    type="number"
                    placeholder="30"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    className="w-full"
                    data-testid="input-width"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-foreground mb-2">Total Area (sq ft)</Label>
                <Input
                  type="number"
                  placeholder="1200"
                  value={totalArea}
                  onChange={(e) => setTotalArea(e.target.value)}
                  className="w-full"
                  data-testid="input-total-area"
                />
                <p className="text-xs text-muted-foreground mt-2">If you know your total rooftop area, enter it directly</p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-2">Quick Tip</h4>
                <p className="text-sm text-muted-foreground">You can find your rooftop area on property records, or use satellite view tools like Google Earth to measure your roof dimensions.</p>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={updateRooftopMutation.isPending}
                data-testid="button-calculate"
              >
                {updateRooftopMutation.isPending ? "Calculating..." : "Calculate My Potential"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
