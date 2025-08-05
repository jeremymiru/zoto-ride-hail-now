import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Car, 
  Clock, 
  MapPin, 
  Star, 
  Activity,
  DollarSign,
  TrendingUp,
  Search,
  Shield,
  Bike,
  User,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
  rating: number;
  total_rides: number;
  is_active: boolean;
  created_at: string;
}

interface RideData {
  id: string;
  status: string;
  created_at: string;
  actual_fare: number | null;
  ride_requests: {
    pickup_address: string;
    destination_address: string;
    service_type: string;
    estimated_fare: number;
  };
  driver: {
    full_name: string;
    email: string;
    rating: number;
  };
  passenger: {
    full_name: string;
    email: string;
    rating: number;
  };
}

interface SystemStats {
  totalUsers: number;
  totalDrivers: number;
  totalRides: number;
  activeRides: number;
  todayRevenue: number;
  weekRevenue: number;
  averageRating: number;
}

const AdminDashboard = () => {
  const { user, profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [rides, setRides] = useState<RideData[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalDrivers: 0,
    totalRides: 0,
    activeRides: 0,
    todayRevenue: 0,
    weekRevenue: 0,
    averageRating: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserRole, setSelectedUserRole] = useState<string>('all');

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      fetchUsers();
      fetchRides();
      fetchStats();
      
      // Set up real-time subscriptions for admin monitoring
      const ridesSubscription = supabase
        .channel('admin_rides')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'rides'
        }, () => {
          fetchRides();
          fetchStats();
        })
        .subscribe();

      const usersSubscription = supabase
        .channel('admin_users')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'profiles'
        }, () => {
          fetchUsers();
          fetchStats();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(ridesSubscription);
        supabase.removeChannel(usersSubscription);
      };
    }
  }, [user, profile]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
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
            service_type,
            estimated_fare,
            user_id
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch driver and passenger profiles for each ride
      const ridesWithProfiles = await Promise.all(
        (data || []).map(async (ride) => {
          const [driverProfile, passengerProfile] = await Promise.all([
            supabase
              .from('profiles')
              .select('full_name, email, rating')
              .eq('user_id', ride.driver_id)
              .single(),
            supabase
              .from('profiles')
              .select('full_name, email, rating')
              .eq('user_id', ride.ride_requests.user_id)
              .single()
          ]);

          return {
            ...ride,
            driver: driverProfile.data || { full_name: 'Unknown', email: '', rating: 0 },
            passenger: passengerProfile.data || { full_name: 'Unknown', email: '', rating: 0 }
          };
        })
      );

      setRides(ridesWithProfiles);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch rides",
        variant: "destructive"
      });
    }
  };

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [usersCount, driversCount, ridesCount, activeRidesCount, todayRides, weekRides, ratingsData] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' }).in('role', ['driver', 'boda_boda']),
        supabase.from('rides').select('id', { count: 'exact' }),
        supabase.from('rides').select('id', { count: 'exact' }).in('status', ['waiting', 'picked_up', 'in_transit']),
        supabase.from('rides').select('actual_fare').gte('created_at', today).eq('status', 'completed'),
        supabase.from('rides').select('actual_fare').gte('created_at', weekAgo).eq('status', 'completed'),
        supabase.from('profiles').select('rating')
      ]);

      setStats({
        totalUsers: usersCount.count || 0,
        totalDrivers: driversCount.count || 0,
        totalRides: ridesCount.count || 0,
        activeRides: activeRidesCount.count || 0,
        todayRevenue: todayRides.data?.reduce((sum, ride) => sum + (ride.actual_fare || 0), 0) || 0,
        weekRevenue: weekRides.data?.reduce((sum, ride) => sum + (ride.actual_fare || 0), 0) || 0,
        averageRating: ratingsData.data?.reduce((sum, profile) => sum + profile.rating, 0) / (ratingsData.data?.length || 1) || 0
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "User Status Updated",
        description: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully`
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive"
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'driver': return <Car className="h-4 w-4" />;
      case 'boda_boda': return <Bike className="h-4 w-4" />;
      case 'admin': return <Shield className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'car_owner': return 'Passenger';
      case 'driver': return 'Car Driver';
      case 'boda_boda': return 'Boda-Boda';
      case 'admin': return 'Admin';
      default: return role;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': case 'pickup': return 'secondary';
      case 'in_progress': return 'default';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedUserRole === 'all' || user.role === selectedUserRole;
    return matchesSearch && matchesRole;
  });

  if (profile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage your Zoto platform</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <Shield className="h-4 w-4 mr-2" />
          Administrator
        </Badge>
      </div>

      {/* System Stats */}
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Drivers</p>
                <p className="text-2xl font-bold">{stats.totalDrivers}</p>
              </div>
              <Car className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Rides</p>
                <p className="text-2xl font-bold">{stats.totalRides}</p>
              </div>
              <Activity className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Rides</p>
                <p className="text-2xl font-bold">{stats.activeRides}</p>
              </div>
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today Revenue</p>
                <p className="text-2xl font-bold">${stats.todayRevenue.toFixed(0)}</p>
              </div>
              <DollarSign className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Week Revenue</p>
                <p className="text-2xl font-bold">${stats.weekRevenue.toFixed(0)}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
                <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</p>
              </div>
              <Star className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="rides">Ride Monitoring</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* User Management */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select 
                  value={selectedUserRole} 
                  onChange={(e) => setSelectedUserRole(e.target.value)}
                  className="px-3 py-2 border border-input bg-background rounded-md"
                >
                  <option value="all">All Roles</option>
                  <option value="car_owner">Passengers</option>
                  <option value="driver">Car Drivers</option>
                  <option value="boda_boda">Boda-Boda</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">
                          {getRoleIcon(user.role)}
                          <span className="ml-1">{getRoleLabel(user.role)}</span>
                        </Badge>
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm">
                            <Star className="h-3 w-3 inline mr-1" />
                            {user.rating.toFixed(1)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.total_rides} rides
                          </p>
                        </div>
                        <Button
                          variant={user.is_active ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => toggleUserStatus(user.user_id, user.is_active)}
                        >
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                      <Badge variant={user.is_active ? "outline" : "secondary"}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ride Monitoring */}
        <TabsContent value="rides">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Live Ride Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rides.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No rides to display</p>
                  </div>
                ) : (
                  rides.map((ride) => (
                    <div key={ride.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant={getStatusColor(ride.status)} className="capitalize">
                          {ride.status}
                        </Badge>
                        <div className="text-right">
                          <p className="font-semibold">
                            ${ride.actual_fare?.toFixed(2) || ride.ride_requests.estimated_fare.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(ride.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium mb-2">Driver</p>
                          <p className="text-sm">{ride.driver.full_name}</p>
                          <p className="text-xs text-muted-foreground">{ride.driver.email}</p>
                          <p className="text-xs">⭐ {ride.driver.rating.toFixed(1)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2">Passenger</p>
                          <p className="text-sm">{ride.passenger.full_name}</p>
                          <p className="text-xs text-muted-foreground">{ride.passenger.email}</p>
                          <p className="text-xs">⭐ {ride.passenger.rating.toFixed(1)}</p>
                        </div>
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

                      <div className="flex items-center justify-between pt-2">
                        <Badge variant="outline">
                          {ride.ride_requests.service_type === 'car' ? <Car className="h-3 w-3 mr-1" /> : <Bike className="h-3 w-3 mr-1" />}
                          {ride.ride_requests.service_type === 'car' ? 'Car' : 'Boda-Boda'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          ID: {ride.id.slice(0, 8)}...
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Platform Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>User Growth Rate</span>
                  <span className="text-success">+12% this week</span>
                </div>
                <div className="flex justify-between">
                  <span>Driver Utilization</span>
                  <span>78%</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Trip Distance</span>
                  <span>5.2 km</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer Satisfaction</span>
                  <span>4.6/5.0 ⭐</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Today's Revenue</span>
                  <span className="font-semibold">${stats.todayRevenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Weekly Revenue</span>
                  <span className="font-semibold">${stats.weekRevenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Ride Value</span>
                  <span>${stats.totalRides > 0 ? (stats.weekRevenue / stats.totalRides).toFixed(2) : '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Commission Earned</span>
                  <span className="text-success">${(stats.weekRevenue * 0.15).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;