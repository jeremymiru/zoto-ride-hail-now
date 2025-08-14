import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Car, 
  Clock, 
  MapPin, 
  Star, 
  Bell,
  Activity,
  DollarSign,
  Navigation,
  User,
  History,
  TrendingUp,
  Shield,
  CreditCard
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import UberBookingFlow from './UberBookingFlow';
import MapBox from '@/components/Map/MapBox';

interface RideRequest {
  id: string;
  pickup_address: string;
  destination_address: string;
  service_type: 'car' | 'motorcycle' | 'bicycle';
  status: string;
  estimated_fare: number;
  created_at: string;
}

interface Ride {
  id: string;
  status: string;
  pickup_time: string | null;
  start_time: string | null;
  end_time: string | null;
  actual_fare: number | null;
  ride_requests: {
    pickup_address: string;
    destination_address: string;
    service_type: string;
  };
}

const UberDashboard = () => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [currentRide, setCurrentRide] = useState<RideRequest | null>(null);

  useEffect(() => {
    if (user) {
      fetchRideRequests();
      fetchRides();
      checkCurrentRide();
    }
  }, [user]);

  const fetchRideRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('ride_requests')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRideRequests(data || []);
    } catch (error: any) {
      console.error('Failed to fetch ride requests:', error);
    }
  };

  const fetchRides = async () => {
    try {
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          ride_requests (
            pickup_address,
            destination_address,
            service_type
          )
        `)
        .eq('ride_requests.user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRides(data || []);
    } catch (error: any) {
      console.error('Failed to fetch rides:', error);
    }
  };

  const checkCurrentRide = async () => {
    try {
      const { data, error } = await supabase
        .from('ride_requests')
        .select('*')
        .eq('user_id', user!.id)
        .in('status', ['pending', 'accepted', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        setCurrentRide(data[0]);
        setActiveTab('activity');
      }
    } catch (error: any) {
      console.error('Failed to check current ride:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'accepted': case 'in_progress': return 'default';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'accepted': case 'in_progress': return <Activity className="h-3 w-3" />;
      case 'completed': return <Star className="h-3 w-3" />;
      default: return <Bell className="h-3 w-3" />;
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // If there's a current active ride, show it prominently
  if (currentRide) {
    return (
      <div className="space-y-6">
        {/* Active Ride Header */}
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Current Trip</h1>
                <p className="text-muted-foreground">Track your ride in real-time</p>
              </div>
              <Badge className="bg-primary text-primary-foreground">
                <Activity className="h-4 w-4 mr-2" />
                {currentRide.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Current Ride Details */}
        <Card className="card-enhanced">
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {currentRide.service_type === 'car' ? 
                    <Car className="h-8 w-8 text-primary" /> : 
                    <Navigation className="h-8 w-8 text-primary" />
                  }
                  <div>
                    <h3 className="text-xl font-bold">
                      {currentRide.service_type === 'car' ? 'Zoto Car' : 'Zoto Boda'}
                    </h3>
                    <p className="text-muted-foreground">
                      Requested at {formatTime(currentRide.created_at)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">UGX {currentRide.estimated_fare.toFixed(0)}</div>
                  <div className="text-sm text-muted-foreground">Estimated fare</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-3 h-3 rounded-full bg-primary mt-2"></div>
                  <div>
                    <div className="font-medium">Pickup</div>
                    <div className="text-muted-foreground">{currentRide.pickup_address}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <MapPin className="w-5 h-5 text-destructive mt-1" />
                  <div>
                    <div className="font-medium">Destination</div>
                    <div className="text-muted-foreground">{currentRide.destination_address}</div>
                  </div>
                </div>
              </div>

              {currentRide.status === 'pending' && (
                <div className="text-center py-4">
                  <div className="animate-pulse-glow mb-4">
                    <Clock className="h-8 w-8 text-primary mx-auto" />
                  </div>
                  <p className="text-lg font-medium">Looking for a driver...</p>
                  <p className="text-muted-foreground">This usually takes less than 2 minutes</p>
                </div>
              )}

              {currentRide.status === 'accepted' && (
                <div className="text-center py-4 bg-success/10 rounded-lg">
                  <div className="mb-4">
                    <User className="h-8 w-8 text-success mx-auto" />
                  </div>
                  <p className="text-lg font-medium text-success">Driver found!</p>
                  <p className="text-muted-foreground">Your driver is on the way</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1">
                  Call Driver
                </Button>
                <Button variant="outline" className="flex-1">
                  Message
                </Button>
                <Button variant="destructive" className="flex-1">
                  Cancel Ride
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Map */}
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Live Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MapBox
              driverLocations={[
                { id: '1', latitude: -1.2921, longitude: 36.8219, vehicleType: currentRide.service_type === 'bicycle' ? 'motorcycle' : currentRide.service_type }
              ]}
              className="h-[400px] rounded-lg"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <Card className="gradient-primary hover-glow">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {profile?.full_name || 'Rider'}!
              </h1>
              <p className="text-white/90 text-xl">Where would you like to go today?</p>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2 text-white/80">
                  <Clock className="h-4 w-4" />
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <MapPin className="h-4 w-4" />
                  <span>Kampala, Uganda</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3 text-white mb-2">
                  <Star className="h-6 w-6 fill-current" />
                  <span className="text-2xl font-bold">{profile?.rating?.toFixed(1) || '5.0'}</span>
                </div>
                <div className="text-white/80 text-sm">Your Rating</div>
                <div className="text-white/70 text-xs mt-1">
                  {(profile?.total_rides || 0)} total trips
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="home" className="flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            Ride
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="map" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Map
          </TabsTrigger>
        </TabsList>

        {/* Home Tab - Uber Booking Flow */}
        <TabsContent value="home">
          <UberBookingFlow />
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="card-enhanced hover-lift gradient-secondary border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-white/10">
                    <Car className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white/80">Total Trips</p>
                    <p className="text-2xl font-bold text-white">{profile?.total_rides || 0}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <Navigation className="h-4 w-4" />
                    <span>Completed</span>
                  </div>
                  <Badge className="bg-white/20 text-white border-0">
                    {rideRequests.filter(r => r.status === 'completed').length} recent
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card className="card-enhanced hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-yellow-100 dark:bg-yellow-900">
                    <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Rating</p>
                    <p className="text-2xl font-bold">{profile?.rating?.toFixed(1) || '5.0'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 fill-current text-yellow-500" />
                    <span>Your rating</span>
                  </div>
                  <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                    {(profile?.rating || 5) >= 4.5 ? 'Excellent' : (profile?.rating || 5) >= 4.0 ? 'Good' : 'Improving'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card className="card-enhanced hover-lift gradient-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-white/10">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white/80">Total Spent</p>
                    <p className="text-2xl font-bold text-white">
                      UGX {rides.reduce((sum, ride) => sum + (ride.actual_fare || 0), 0).toFixed(0)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <TrendingUp className="h-4 w-4" />
                    <span>All time</span>
                  </div>
                  <Badge className="bg-white/20 text-white border-0">
                    {rides.length > 0 ? `${(rides.reduce((sum, ride) => sum + (ride.actual_fare || 0), 0) / rides.length).toFixed(0)} avg` : 'No trips'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rideRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">No trips yet</p>
                    <p className="text-muted-foreground">Book your first ride to get started!</p>
                  </div>
                ) : (
                  rideRequests.slice(0, 5).map((request) => (
                    <div key={request.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {request.service_type === 'car' ? 
                          <Car className="h-5 w-5 text-primary" /> : 
                          <Navigation className="h-5 w-5 text-primary" />
                        }
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getStatusColor(request.status)} className="capitalize">
                            {getStatusIcon(request.status)}
                            <span className="ml-1">{request.status}</span>
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(request.created_at)} at {formatTime(request.created_at)}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                            <span className="text-muted-foreground truncate">{request.pickup_address}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-destructive" />
                            <span className="text-muted-foreground truncate">{request.destination_address}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">UGX {request.estimated_fare.toFixed(0)}</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {request.service_type === 'car' ? 'Car' : 'Boda'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{profile?.full_name || 'User'}</h3>
                    <p className="text-muted-foreground">{profile?.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Star className="h-4 w-4 fill-current text-yellow-500" />
                      <span className="font-medium">{profile?.rating?.toFixed(1) || '5.0'} rating</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    Edit Profile
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Payment Methods
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Trip History
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Help & Support
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Map Tab */}
        <TabsContent value="map">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Live Map - Nearby Drivers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MapBox
                driverLocations={[
                  { id: '1', latitude: -1.2921, longitude: 36.8219, vehicleType: 'car' },
                  { id: '2', latitude: -1.2951, longitude: 36.8249, vehicleType: 'motorcycle' },
                  { id: '3', latitude: -1.2891, longitude: 36.8189, vehicleType: 'car' },
                  { id: '4', latitude: -1.2971, longitude: 36.8279, vehicleType: 'motorcycle' }
                ]}
                className="h-[500px] rounded-lg"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UberDashboard;