import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Droplets, DollarSign, Shield, Settings, Briefcase, BarChart3 } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <nav className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <Droplets className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">AquaHarvest</h1>
            </div>
            <a 
              href="/api/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-signin"
            >
              Sign In
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Harvest Every Drop.<br />
              <span className="text-primary">Save Every Dollar.</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Discover how rainwater harvesting can reduce your water bills, support sustainability, and provide water security for your home.
            </p>
            <Link href="/registration">
              <Button 
                size="lg" 
                className="px-8 py-4 text-lg font-semibold hover:scale-105 transition-all shadow-lg"
                data-testid="button-start-journey"
              >
                Start Your Water Journey
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Why Rainwater Harvesting?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Transform rainfall into a valuable resource for your home and community</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <DollarSign className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Cost Savings</h3>
                <p className="text-muted-foreground">Reduce water bills by up to 40% through smart rainwater collection and storage systems.</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-secondary/10 rounded-xl flex items-center justify-center mb-6">
                  <Droplets className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Environmental Impact</h3>
                <p className="text-muted-foreground">Reduce strain on municipal water systems and help preserve natural water resources.</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-accent/10 rounded-xl flex items-center justify-center mb-6">
                  <Shield className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Water Security</h3>
                <p className="text-muted-foreground">Build resilience against droughts and ensure reliable water access for your household.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Education Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">How It Works</h2>
              <p className="text-lg text-muted-foreground mb-8">Rainwater harvesting is a simple yet powerful way to collect, store, and use rainwater for various household needs.</p>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-primary-foreground text-sm font-semibold">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Collection</h4>
                    <p className="text-muted-foreground">Rainwater is collected from rooftops and directed through gutters and downspouts.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-primary-foreground text-sm font-semibold">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Filtration</h4>
                    <p className="text-muted-foreground">Water passes through first-flush diverters and filters to remove debris and contaminants.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-primary-foreground text-sm font-semibold">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Storage & Use</h4>
                    <p className="text-muted-foreground">Clean water is stored in tanks and can be used for gardens, washing, and with treatment, drinking.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
                alt="Rainwater harvesting system on house roof" 
                className="rounded-xl shadow-lg w-full h-auto" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent rounded-xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Impact by Numbers</h2>
            <p className="text-lg text-muted-foreground">See the real difference rainwater harvesting makes</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2" data-testid="stat-reduction">50%</div>
              <p className="text-muted-foreground">Average Water Bill Reduction</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-secondary mb-2" data-testid="stat-collection">1,200L</div>
              <p className="text-muted-foreground">Water Per Month (100m² roof)</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-accent mb-2" data-testid="stat-savings">$800</div>
              <p className="text-muted-foreground">Annual Savings Potential</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-chart-4 mb-2" data-testid="stat-runoff">75%</div>
              <p className="text-muted-foreground">Reduction in Runoff</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">Ready to Start Saving Water and Money?</h2>
          <p className="text-lg text-muted-foreground mb-8">Calculate your potential savings and begin your rainwater harvesting journey today.</p>
          <Link href="/registration">
            <Button 
              size="lg" 
              className="px-8 py-4 text-lg font-semibold hover:scale-105 transition-all shadow-lg"
              data-testid="button-calculate-savings"
            >
              Calculate My Savings
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
