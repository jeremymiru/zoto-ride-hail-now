import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Car, 
  Clock, 
  MapPin, 
  Star, 
  Navigation,
  Bell,
  Activity,
  DollarSign,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  MapIcon
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface RideRequest {
  id: string;
  user_id: string;
  pickup_address: string;
  destination_address: string;
  pickup_latitude: number;
  pickup_longitude: number;
  destination_latitude: number;
  destination_longitude: number;
  service_type: 'car' | 'motorcycle' | 'bicycle';
  status: string;
  estimated_fare: number;
  created_at: string;
  notes?: string;
  profiles: {
    full_name: string;
    phone?: string;
    rating: number;
  };
}

interface MyRide {
  id: string;
  status: string;
  pickup_time: string | null;
  start_time: string | null;
  end_time: string | null;
  actual_fare: number | null;
  passenger_rating: number | null;
  driver_rating: number | null;
  ride_requests: {
    pickup_address: string;
    destination_address: string;
    service_type: string;
    profiles: {
      full_name: string;
      phone?: string;
    };
  };
}

const DriverDashboard = () => {
  const { user, profile } = useAuth();
  const { latitude, longitude, error: locationError } = useGeolocation({ watch: true });
  const [isOnline, setIsOnline] = useState(false);
  const [availableRequests, setAvailableRequests] = useState<RideRequest[]>([]);
  const [myRides, setMyRides] = useState<MyRide[]>([]);
  const [stats, setStats] = useState({
    todayRides: 0,
    todayEarnings: 0,
    weekEarnings: 0,
    rating: 5.0
  });

  useEffect(() => {
    if (user && profile?.role === 'driver') {
      fetchAvailableRequests();
      fetchMyRides();
      fetchStats();
      
      // Set up real-time subscriptions
      const requestsSubscription = supabase
        .channel('ride_requests_driver')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'ride_requests',
          filter: 'status=eq.pending'
        }, () => {
          fetchAvailableRequests();
        })
        .subscribe();

      const ridesSubscription = supabase
        .channel('my_rides_driver')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'rides',
          filter: `driver_id=eq.${user.id}`
        }, () => {
          fetchMyRides();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(requestsSubscription);
        supabase.removeChannel(ridesSubscription);
      };
    }
  }, [user, profile]);

  useEffect(() => {
    // Update driver location when online
    if (isOnline && latitude && longitude && user) {
      updateDriverLocation();
    }
  }, [latitude, longitude, isOnline, user]);

  const updateDriverLocation = async () => {
    if (!latitude || !longitude) return;

    try {
      await supabase
        .from('locations')
        .insert({
          user_id: user!.id,
          latitude,
          longitude,
          accuracy: 10
        });
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const fetchAvailableRequests = async () => {
    if (!user || !profile) return;

    try {
      // Fetch requests that match driver's service type
      const serviceType = profile.role === 'driver' ? 'car' : 'motorcycle';
      
      const { data, error } = await supabase
        .from('ride_requests')
        .select(`
          *,
          profiles!ride_requests_user_id_fkey (
            full_name,
            phone,
            rating
          )
        `)
        .eq('status', 'pending')
        .eq('service_type', serviceType)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setAvailableRequests(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch available requests",
        variant: "destructive"
      });
    }
  };

  const fetchMyRides = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          ride_requests (
            pickup_address,
            destination_address,
            service_type,
            profiles!ride_requests_user_id_fkey (
              full_name,
              phone
            )
          )
        `)
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setMyRides(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch your rides",
        variant: "destructive"
      });
    }
  };

  const fetchStats = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: todayRides, error: todayError } = await supabase
        .from('rides')
        .select('actual_fare')
        .eq('driver_id', user.id)
        .gte('created_at', today)
        .eq('status', 'completed');

      const { data: weekRides, error: weekError } = await supabase
        .from('rides')
        .select('actual_fare')
        .eq('driver_id', user.id)
        .gte('created_at', weekAgo)
        .eq('status', 'completed');

      if (todayError || weekError) throw todayError || weekError;

      setStats({
        todayRides: todayRides?.length || 0,
        todayEarnings: todayRides?.reduce((sum, ride) => sum + (ride.actual_fare || 0), 0) || 0,
        weekEarnings: weekRides?.reduce((sum, ride) => sum + (ride.actual_fare || 0), 0) || 0,
        rating: profile?.rating || 5.0
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };

  const acceptRequest = async (request: RideRequest) => {
    try {
      // Check if we have an active vehicle
      const { data: vehicles, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id')
        .eq('driver_id', user!.id)
        .eq('is_active', true)
        .limit(1);

      if (vehicleError || !vehicles?.length) {
        toast({
          title: "No Vehicle",
          description: "Please register an active vehicle first",
          variant: "destructive"
        });
        return;
      }

      // Create ride and update request status
      const { error: rideError } = await supabase
        .from('rides')
        .insert({
          request_id: request.id,
          driver_id: user!.id,
          vehicle_id: vehicles[0].id,
          status: 'waiting'
        });

      if (rideError) throw rideError;

      const { error: updateError } = await supabase
        .from('ride_requests')
        .update({ status: 'accepted' })
        .eq('id', request.id);

      if (updateError) throw updateError;

      toast({
        title: "Request Accepted",
        description: `You've accepted the ride to ${request.destination_address}`
      });

      fetchAvailableRequests();
      fetchMyRides();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to accept request",
        variant: "destructive"
      });
    }
  };

  const updateRideStatus = async (rideId: string, status: string) => {
    try {
      const updates: any = { status };
      
      if (status === 'pickup') {
        updates.pickup_time = new Date().toISOString();
      } else if (status === 'in_progress') {
        updates.start_time = new Date().toISOString();
      } else if (status === 'completed') {
        updates.end_time = new Date().toISOString();
      }

      const { error } = await supabase
        .from('rides')
        .update(updates)
        .eq('id', rideId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Ride status updated to ${status}`
      });

      fetchMyRides();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update ride status",
        variant: "destructive"
      });
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getDistanceToPickup = (request: RideRequest) => {
    if (!latitude || !longitude) return 'N/A';
    const distance = calculateDistance(latitude, longitude, request.pickup_latitude, request.pickup_longitude);
    return `${distance.toFixed(1)} km`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'secondary';
      case 'pickup': case 'in_progress': return 'default';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Driver Status Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Driver Dashboard</h1>
          <p className="text-muted-foreground">
            {isOnline ? 'You are online and ready for rides' : 'You are offline'}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm">Offline</span>
            <Switch checked={isOnline} onCheckedChange={setIsOnline} />
            <span className="text-sm">Online</span>
          </div>
          <Badge variant={isOnline ? "default" : "secondary"}>
            {isOnline ? <Activity className="h-3 w-3 mr-1" /> : <Pause className="h-3 w-3 mr-1" />}
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>
      </div>

      {locationError && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">
              Location access required: {locationError}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Rides</p>
                <p className="text-2xl font-bold">{stats.todayRides}</p>
              </div>
              <Car className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Earnings</p>
                <p className="text-2xl font-bold">${stats.todayEarnings.toFixed(0)}</p>
              </div>
              <DollarSign className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Week Earnings</p>
                <p className="text-2xl font-bold">${stats.weekEarnings.toFixed(0)}</p>
              </div>
              <DollarSign className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rating</p>
                <p className="text-2xl font-bold">{stats.rating.toFixed(1)}</p>
              </div>
              <Star className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="requests" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="requests">Available Requests</TabsTrigger>
          <TabsTrigger value="rides">My Rides</TabsTrigger>
        </TabsList>

        {/* Available Requests */}
        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Available Ride Requests ({availableRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isOnline ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Go online to see available requests</p>
                </div>
              ) : availableRequests.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No available requests at the moment</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {request.service_type === 'car' ? <Car className="h-3 w-3 mr-1" /> : <Navigation className="h-3 w-3 mr-1" />}
                            {request.service_type === 'car' ? 'Car' : 'Boda-Boda'}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {getDistanceToPickup(request)} away
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">${request.estimated_fare.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(request.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-success mt-0.5" />
                          <div>
                            <span className="text-sm font-medium">Pickup</span>
                            <p className="text-sm text-muted-foreground">{request.pickup_address}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-destructive mt-0.5" />
                          <div>
                            <span className="text-sm font-medium">Destination</span>
                            <p className="text-sm text-muted-foreground">{request.destination_address}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-warning" />
                          <span className="text-sm">{request.profiles.full_name}</span>
                          <span className="text-sm text-muted-foreground">
                            ({request.profiles.rating.toFixed(1)} ⭐)
                          </span>
                        </div>
                        <Button onClick={() => acceptRequest(request)} className="gradient-primary">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept Ride
                        </Button>
                      </div>

                      {request.notes && (
                        <div className="bg-muted p-3 rounded">
                          <p className="text-sm"><strong>Note:</strong> {request.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Rides */}
        <TabsContent value="rides">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                My Rides
              </CardTitle>
            </CardHeader>
            <CardContent>
              {myRides.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No rides yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myRides.map((ride) => (
                    <div key={ride.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant={getStatusColor(ride.status)} className="capitalize">
                          {ride.status}
                        </Badge>
                        {ride.actual_fare && (
                          <span className="font-semibold text-lg">${ride.actual_fare.toFixed(2)}</span>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-success mt-0.5" />
                          <span className="text-sm">{ride.ride_requests.pickup_address}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-destructive mt-0.5" />
                          <span className="text-sm">{ride.ride_requests.destination_address}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          <strong>Passenger:</strong> {ride.ride_requests.profiles.full_name}
                        </span>
                        {ride.ride_requests.profiles.phone && (
                          <span className="text-sm text-muted-foreground">
                            📞 {ride.ride_requests.profiles.phone}
                          </span>
                        )}
                      </div>

                      {ride.status === 'waiting' && (
                        <div className="flex gap-2">
                          <Button onClick={() => updateRideStatus(ride.id, 'pickup')} variant="outline" size="sm">
                            Arrived at Pickup
                          </Button>
                        </div>
                      )}

                      {ride.status === 'pickup' && (
                        <div className="flex gap-2">
                          <Button onClick={() => updateRideStatus(ride.id, 'in_progress')} className="gradient-primary" size="sm">
                            <Play className="h-4 w-4 mr-2" />
                            Start Trip
                          </Button>
                        </div>
                      )}

                      {ride.status === 'in_progress' && (
                        <div className="flex gap-2">
                          <Button onClick={() => updateRideStatus(ride.id, 'completed')} variant="outline" size="sm">
                            Complete Trip
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DriverDashboard;