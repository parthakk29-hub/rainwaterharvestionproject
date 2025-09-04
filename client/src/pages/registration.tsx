import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function Registration() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect if already authenticated to location page
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/location");
    }
  }, [isAuthenticated, isLoading, setLocation]);



  const handleGoogleSignIn = () => {
    window.location.href = "/api/login";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Card className="shadow-xl border border-border">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-xl mx-auto mb-4 flex items-center justify-center">
                <User className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to AquaHarvest</h2>
              <p className="text-muted-foreground">Sign in to start calculating your rainwater harvesting potential</p>
            </div>

            <div className="space-y-6">
              <Button 
                type="button" 
                className="w-full flex items-center justify-center space-x-3 py-4 text-lg"
                onClick={handleGoogleSignIn}
                data-testid="button-google-signin"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Sign in with Google</span>
              </Button>
              
              <div className="text-center text-sm text-muted-foreground">
                <p>Your information will be securely collected from your Google account</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
