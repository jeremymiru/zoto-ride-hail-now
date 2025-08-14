
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Car, 
  Clock, 
  DollarSign, 
  Star,
  MapPin,
  Activity,
  User,
  Settings,
  Navigation,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import TripAcceptance from './TripAcceptance';
import MapBox from '@/components/Map/MapBox';

interface DriverStats {
  totalEarnings: number;
  totalTrips: number;
  averageRating: number;
  todayEarnings: number;
  activeRides: number;
  completedToday: number;
}

interface RecentRide {
  id: string;
  actual_fare: number;
  end_time: string;
  passenger_rating?: number;
  ride_requests: {
    pickup_address: string;
    destination_address: string;
    service_type: string;
  };
}

const DriverDashboard = () => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('trips');
  const [stats, setStats] = useState<DriverStats>({
    totalEarnings: 0,
    totalTrips: 0,
    averageRating: 0,
    todayEarnings: 0,
    activeRides: 0,
    completedToday: 0
  });
  const [recentRides, setRecentRides] = useState<RecentRide[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDriverStats();
      fetchRecentRides();
    }
  }, [user]);

  const fetchDriverStats = async () => {
    try {
      // Fetch driver's rides
      const { data: ridesData, error: ridesError } = await supabase
        .from('rides')
        .select('actual_fare, end_time, passenger_rating, status')
        .eq('driver_id', user!.id);

      if (ridesError) throw ridesError;

      const rides = ridesData || [];
      const completedRides = rides.filter(ride => ride.status === 'completed');
      
      // Calculate stats
      const totalEarnings = completedRides.reduce((sum, ride) => sum + (ride.actual_fare || 0), 0);
      const totalTrips = completedRides.length;
      const averageRating = completedRides.length > 0 
        ? completedRides.reduce((sum, ride) => sum + (ride.passenger_rating || 5), 0) / completedRides.length
        : 5.0;
      
      // Today's stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayRides = completedRides.filter(ride => 
        ride.end_time && new Date(ride.end_time) >= today
      );
      
      const todayEarnings = todayRides.reduce((sum, ride) => sum + (ride.actual_fare || 0), 0);
      const completedToday = todayRides.length;
      
      // Active rides
      const activeRides = rides.filter(ride => 
        ['waiting', 'picked_up', 'in_progress'].includes(ride.status)
      ).length;

      setStats({
        totalEarnings,
        totalTrips,
        averageRating,
        todayEarnings,
        activeRides,
        completedToday
      });

    } catch (error: any) {
      console.error('Failed to fetch driver stats:', error);
      toast({
        title: "Error",
        description: "Failed to load driver statistics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentRides = async () => {
    try {
      const { data, error } = await supabase
        .from('rides')
        .select(`
          id,
          actual_fare,
          end_time,
          passenger_rating,
          ride_requests (
            pickup_address,
            destination_address,
            service_type
          )
        `)
        .eq('driver_id', user!.id)
        .eq('status', 'completed')
        .order('end_time', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentRides(data || []);
    } catch (error: any) {
      console.error('Failed to fetch recent rides:', error);
    }
  };

  const toggleOnlineStatus = async () => {
    try {
      const newStatus = !isOnline;
      
      // In a real app, you'd update the driver's online status in the database
      // For now, we'll just update the local state
      setIsOnline(newStatus);
      
      toast({
        title: newStatus ? "You're Online" : "You're Offline",
        description: newStatus 
          ? "You can now receive ride requests" 
          : "You won't receive new ride requests"
      });
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update online status",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse-glow">
          <Car className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <Card className="gradient-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {profile?.full_name || 'Driver'}!
              </h1>
              <p className="text-white/80 text-lg">Ready to earn some money today?</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right text-white">
                <div className="text-2xl font-bold">UGX {stats.todayEarnings.toFixed(0)}</div>
                <div className="text-white/70 text-sm">Today's Earnings</div>
              </div>
              <Button
                onClick={toggleOnlineStatus}
                className={`${
                  isOnline 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
              >
                <Activity className={`h-4 w-4 mr-2 ${isOnline ? 'animate-pulse' : ''}`} />
                {isOnline ? 'Online' : 'Go Online'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-enhanced">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-3xl font-bold">UGX {stats.totalEarnings.toFixed(0)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-success" />
            </div>
            <div className="flex items-center gap-2 mt-4 text-sm">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-success">All time</span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Trips</p>
                <p className="text-3xl font-bold">{stats.totalTrips}</p>
              </div>
              <Car className="h-8 w-8 text-primary" />
            </div>
            <div className="flex items-center gap-2 mt-4 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Completed</span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rating</p>
                <p className="text-3xl font-bold">{stats.averageRating.toFixed(1)}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="flex items-center gap-2 mt-4 text-sm">
              <Star className="h-4 w-4 fill-current text-yellow-500" />
              <span className="text-muted-foreground">Average rating</span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Rides</p>
                <p className="text-3xl font-bold">{stats.activeRides}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
            <div className="flex items-center gap-2 mt-4 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">In progress</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trips" className="flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            Available Trips
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="earnings" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Earnings
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
        </TabsList>

        {/* Available Trips Tab */}
        <TabsContent value="trips">
          <TripAcceptance />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Trips
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentRides.length === 0 ? (
                <div className="text-center py-12">
                  <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">No trips completed yet</p>
                  <p className="text-muted-foreground">Start accepting rides to build your history</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentRides.map((ride) => (
                    <div key={ride.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="p-2 rounded-lg bg-success/10">
                        <Car className="h-5 w-5 text-success" />
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold capitalize">
                            {ride.ride_requests.service_type} Service
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold">UGX {ride.actual_fare.toFixed(0)}</div>
                            <Badge variant="outline" className="text-xs">
                              Completed
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                            <span className="truncate">{ride.ride_requests.pickup_address}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 text-destructive" />
                            <span className="truncate">{ride.ride_requests.destination_address}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {new Date(ride.end_time).toLocaleDateString()} at {new Date(ride.end_time).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          
                          {ride.passenger_rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-current text-yellow-500" />
                              <span className="font-medium">{ride.passenger_rating}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Earnings Tab */}
        <TabsContent value="earnings" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="card-enhanced">
              <CardContent className="p-6 text-center">
                <DollarSign className="h-12 w-12 text-success mx-auto mb-4" />
                <div className="text-3xl font-bold">UGX {stats.todayEarnings.toFixed(0)}</div>
                <div className="text-muted-foreground">Today's Earnings</div>
                <div className="text-sm text-success mt-2">{stats.completedToday} trips completed</div>
              </CardContent>
            </Card>
            
            <Card className="card-enhanced">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
                <div className="text-3xl font-bold">UGX {(stats.totalEarnings / Math.max(stats.totalTrips, 1)).toFixed(0)}</div>
                <div className="text-muted-foreground">Average Per Trip</div>
                <div className="text-sm text-muted-foreground mt-2">Based on {stats.totalTrips} trips</div>
              </CardContent>
            </Card>
            
            <Card className="card-enhanced">
              <CardContent className="p-6 text-center">
                <Calendar className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <div className="text-3xl font-bold">UGX {(stats.totalEarnings * 0.8).toFixed(0)}</div>
                <div className="text-muted-foreground">This Month (Est.)</div>
                <div className="text-sm text-muted-foreground mt-2">Projected earnings</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Driver Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{profile?.full_name || 'Driver'}</h3>
                    <p className="text-muted-foreground">{profile?.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Star className="h-4 w-4 fill-current text-yellow-500" />
                      <span className="font-medium">{stats.averageRating.toFixed(1)} rating</span>
                      <Badge variant="outline" className="capitalize">
                        {profile?.role || 'driver'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Car className="h-4 w-4 mr-2" />
                    Manage Vehicles
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Payment Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Help & Support
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DriverDashboard;
