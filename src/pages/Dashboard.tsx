import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/Layout';
import RideRequestForm from '@/components/RideRequest/RideRequestForm';
import MapBox from '@/components/Map/MapBox';
import DriverDashboard from '@/components/Driver/DriverDashboard';
import AdminDashboard from '@/components/Admin/AdminDashboard';
import NotificationCenter from '@/components/Notifications/NotificationCenter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Car, 
  Clock, 
  MapPin, 
  Star, 
  Navigation,
  Bell,
  Activity,
  DollarSign
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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

const Dashboard = () => {
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('request');
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Redirect if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Show loading state
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse-glow">
            <Car className="h-12 w-12 text-primary" />
          </div>
        </div>
      </Layout>
    );
  }

  useEffect(() => {
    if (user) {
      fetchRideRequests();
      fetchRides();
    }
  }, [user, refreshKey]);

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
      toast({
        title: "Error",
        description: "Failed to fetch ride requests",
        variant: "destructive"
      });
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
      toast({
        title: "Error",
        description: "Failed to fetch rides",
        variant: "destructive"
      });
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

  const handleRequestCreated = () => {
    setRefreshKey(prev => prev + 1);
    setActiveTab('status');
    toast({
      title: "Request Created",
      description: "Your ride request has been submitted successfully!"
    });
  };

  // Role-based dashboard rendering
  if (profile?.role === 'driver' || profile?.role === 'boda_boda') {
    return (
      <Layout>
        <DriverDashboard />
      </Layout>
    );
  }

  if (profile?.role === 'admin') {
    return (
      <Layout>
        <AdminDashboard />
      </Layout>
    );
  }

  // Default passenger dashboard
  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {profile?.full_name}!</h1>
            <p className="text-muted-foreground">
              {profile?.role === 'car_owner' ? 'Where would you like to go today?' : 
               profile?.role === 'driver' ? 'Ready to earn some money?' :
               profile?.role === 'boda_boda' ? 'Let\'s hit the road!' : 'Manage your platform'}
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Star className="h-4 w-4 mr-2" />
            {profile?.rating?.toFixed(1)} Rating
          </Badge>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="request">Request Ride</TabsTrigger>
            <TabsTrigger value="status">My Rides</TabsTrigger>
            <TabsTrigger value="map">Live Map</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          {/* Request Ride Tab */}
          <TabsContent value="request" className="space-y-6">
            <RideRequestForm onRequestCreated={handleRequestCreated} />
          </TabsContent>

          {/* My Rides Tab */}
          <TabsContent value="status" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Current Requests */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Current Requests
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {rideRequests.filter(req => req.status !== 'completed' && req.status !== 'cancelled').length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No active ride requests
                    </p>
                  ) : (
                    rideRequests
                      .filter(req => req.status !== 'completed' && req.status !== 'cancelled')
                      .map((request) => (
                        <div key={request.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge variant={getStatusColor(request.status)} className="capitalize">
                              {getStatusIcon(request.status)}
                              <span className="ml-1">{request.status}</span>
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(request.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-success mt-0.5" />
                              <span className="text-sm">{request.pickup_address}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-destructive mt-0.5" />
                              <span className="text-sm">{request.destination_address}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2">
                            <Badge variant="outline">
                              {request.service_type === 'car' ? <Car className="h-3 w-3 mr-1" /> : <Navigation className="h-3 w-3 mr-1" />}
                              {request.service_type === 'car' ? 'Car' : 'Boda-Boda'}
                            </Badge>
                            <span className="font-semibold">
                              ${request.estimated_fare.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))
                  )}
                </CardContent>
              </Card>

              {/* Recent Rides */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Recent Rides
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {rides.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No completed rides yet
                    </p>
                  ) : (
                    rides.slice(0, 5).map((ride) => (
                      <div key={ride.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant={getStatusColor(ride.status)} className="capitalize">
                            {getStatusIcon(ride.status)}
                            <span className="ml-1">{ride.status}</span>
                          </Badge>
                          {ride.actual_fare && (
                            <span className="font-semibold">
                              ${ride.actual_fare.toFixed(2)}
                            </span>
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
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Rides</p>
                      <p className="text-2xl font-bold">{profile?.total_rides || 0}</p>
                    </div>
                    <Car className="h-6 w-6 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Rating</p>
                      <p className="text-2xl font-bold">{profile?.rating?.toFixed(1) || '5.0'}</p>
                    </div>
                    <Star className="h-6 w-6 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Requests</p>
                      <p className="text-2xl font-bold">
                        {rideRequests.filter(req => req.status === 'pending').length}
                      </p>
                    </div>
                    <Clock className="h-6 w-6 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Spent</p>
                      <p className="text-2xl font-bold">
                        ${rides.reduce((sum, ride) => sum + (ride.actual_fare || 0), 0).toFixed(0)}
                      </p>
                    </div>
                    <DollarSign className="h-6 w-6 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Live Map Tab */}
          <TabsContent value="map">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Live Map - Nearby Drivers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MapBox
                  driverLocations={[
                    { id: '1', latitude: 1.3521, longitude: 103.8198, vehicleType: 'car' },
                    { id: '2', latitude: 1.3551, longitude: 103.8228, vehicleType: 'motorcycle' },
                    { id: '3', latitude: 1.3491, longitude: 103.8168, vehicleType: 'car' },
                    { id: '4', latitude: 1.3561, longitude: 103.8258, vehicleType: 'motorcycle' }
                  ]}
                  className="h-[500px]"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <NotificationCenter />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Dashboard;