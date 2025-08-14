import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, Bike, Shield, Star, MapPin, Clock, Users } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user && !loading) {
      window.location.href = '/dashboard';
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary">
        <div className="animate-pulse-glow">
          <Car className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="text-center space-y-6 md:space-y-8">
          <div className="flex items-center justify-center mb-6 md:mb-8">
            <div className="gradient-primary p-3 md:p-4 rounded-2xl shadow-glow animate-pulse-glow">
              <Car className="h-10 w-10 md:h-12 md:w-12 text-primary-foreground" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent leading-tight">
            Welcome to Zoto
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Your dual-dispatch ride-sharing platform. Choose between cars and boda-boda motorcycles 
            for the perfect ride experience.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="gradient-primary hover:scale-105 transition-smooth shadow-glow">
              <a href="/auth">Get Started</a>
            </Button>
            <Button asChild variant="outline" size="lg" className="hover:scale-105 transition-smooth">
              <a href="#features" onClick={(e) => {
                e.preventDefault();
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}>Learn More</a>
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Why Choose Zoto?</h2>
          <p className="text-xl text-muted-foreground">
            Experience the future of dual-dispatch transportation
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="shadow-card hover:shadow-glow transition-smooth hover-lift group">
            <CardHeader>
              <div className="gradient-primary p-3 rounded-full w-fit mb-4 group-hover:scale-110 transition-smooth">
                <Car className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle className="group-hover:text-primary transition-smooth">Car Service</CardTitle>
              <CardDescription>
                Comfortable rides with professional drivers for longer distances and group travel.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="hover:bg-primary hover:text-primary-foreground transition-smooth">Air Conditioning</Badge>
                <Badge variant="outline" className="hover:bg-primary hover:text-primary-foreground transition-smooth">4+ Passengers</Badge>
                <Badge variant="outline" className="hover:bg-primary hover:text-primary-foreground transition-smooth">Luggage Space</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-glow transition-smooth hover-lift group">
            <CardHeader>
              <div className="gradient-primary p-3 rounded-full w-fit mb-4 group-hover:scale-110 transition-smooth">
                <Bike className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle className="group-hover:text-primary transition-smooth">Boda-Boda Service</CardTitle>
              <CardDescription>
                Quick and affordable motorcycle rides perfect for beating traffic in the city.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="hover:bg-primary hover:text-primary-foreground transition-smooth">Traffic Beating</Badge>
                <Badge variant="outline" className="hover:bg-primary hover:text-primary-foreground transition-smooth">Quick Rides</Badge>
                <Badge variant="outline" className="hover:bg-primary hover:text-primary-foreground transition-smooth">Affordable</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-glow transition-smooth hover-lift group">
            <CardHeader>
              <div className="gradient-primary p-3 rounded-full w-fit mb-4 group-hover:scale-110 transition-smooth">
                <MapPin className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle className="group-hover:text-primary transition-smooth">Real-Time Tracking</CardTitle>
              <CardDescription>
                Track your ride in real-time with live location updates and ETA estimates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="hover:bg-primary hover:text-primary-foreground transition-smooth">Live GPS</Badge>
                <Badge variant="outline" className="hover:bg-primary hover:text-primary-foreground transition-smooth">ETA Updates</Badge>
                <Badge variant="outline" className="hover:bg-primary hover:text-primary-foreground transition-smooth">Route Optimization</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <Card className="text-center shadow-card hover-lift transition-smooth group">
            <CardContent className="pt-6">
              <Users className="h-8 w-8 text-primary mx-auto mb-2 group-hover:scale-110 transition-smooth" />
              <div className="text-2xl font-bold group-hover:text-primary transition-smooth">10,000+</div>
              <div className="text-muted-foreground text-sm">Active Users</div>
            </CardContent>
          </Card>
          <Card className="text-center shadow-card hover-lift transition-smooth group">
            <CardContent className="pt-6">
              <Car className="h-8 w-8 text-primary mx-auto mb-2 group-hover:scale-110 transition-smooth" />
              <div className="text-2xl font-bold group-hover:text-primary transition-smooth">500+</div>
              <div className="text-muted-foreground text-sm">Drivers</div>
            </CardContent>
          </Card>
          <Card className="text-center shadow-card hover-lift transition-smooth group">
            <CardContent className="pt-6">
              <Clock className="h-8 w-8 text-primary mx-auto mb-2 group-hover:scale-110 transition-smooth" />
              <div className="text-2xl font-bold group-hover:text-primary transition-smooth">24/7</div>
              <div className="text-muted-foreground text-sm">Service</div>
            </CardContent>
          </Card>
          <Card className="text-center shadow-card hover-lift transition-smooth group">
            <CardContent className="pt-6">
              <Star className="h-8 w-8 text-primary mx-auto mb-2 group-hover:scale-110 transition-smooth" />
              <div className="text-2xl font-bold group-hover:text-primary transition-smooth">4.8</div>
              <div className="text-muted-foreground text-sm">Rating</div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="text-center gradient-primary text-primary-foreground shadow-glow hover:scale-[1.02] transition-smooth">
          <CardContent className="py-12 px-6">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">Ready to Start Your Journey?</h3>
            <p className="text-lg md:text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of satisfied users and experience the future of transportation.
            </p>
            <Button asChild size="lg" variant="secondary" className="hover:scale-105 transition-smooth shadow-card">
              <a href="/auth">Sign Up Now</a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Car className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">Zoto</span>
            </div>
            <p className="text-muted-foreground">
              © 2024 Zoto. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
