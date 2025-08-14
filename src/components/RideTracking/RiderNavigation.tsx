
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  MapPin, 
  Navigation, 
  Phone, 
  MessageCircle, 
  Clock,
  Car,
  Bike,
  RotateCcw,
  Star,
  User,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import MapBox from '@/components/Map/MapBox';

interface ActiveRide {
  id: string;
  status: 'waiting' | 'picked_up' | 'in_progress' | 'completed';
  pickup_time?: string;
  start_time?: string;
  end_time?: string;
  actual_fare?: number;
  ride_requests: {
    pickup_address: string;
    destination_address: string;
    pickup_latitude: number;
    pickup_longitude: number;
    destination_latitude: number;
    destination_longitude: number;
    service_type: string;
    estimated_fare: number;
  };
  driver_profile?: {
    full_name: string;
    phone?: string;
    rating?: number;
  };
  vehicle?: {
    make: string;
    model: string;
    color?: string;
    license_plate: string;
  };
}

const RiderNavigation = () => {
  const { user } = useAuth();
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);
  const [loading, setLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState<{latitude: number, longitude: number} | null>(null);

  useEffect(() => {
    if (user) {
      fetchActiveRide();
      subscribeToRideUpdates();
    }
  }, [user]);

  const fetchActiveRide = async () => {
    try {
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          ride_requests!inner (
            user_id,
            pickup_address,
            destination_address,
            pickup_latitude,
            pickup_longitude,
            destination_latitude,
            destination_longitude,
            service_type,
            estimated_fare
          ),
          profiles!rides_driver_id_fkey (
            full_name,
            phone,
            rating
          ),
          vehicles (
            make,
            model,
            color,
            license_plate
          )
        `)
        .eq('ride_requests.user_id', user!.id)
        .in('status', ['waiting', 'picked_up', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setActiveRide({
          ...data,
          driver_profile: data.profiles
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch active ride:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToRideUpdates = () => {
    const channel = supabase
      .channel('ride-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rides'
        },
        () => {
          fetchActiveRide();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const cancelRide = async () => {
    if (!activeRide) return;

    try {
      const { error } = await supabase
        .from('rides')
        .update({ status: 'cancelled' })
        .eq('id', activeRide.id);

      if (error) throw error;

      toast({
        title: "Ride Cancelled",
        description: "Your ride has been cancelled successfully."
      });

      setActiveRide(null);
    } catch (error: any) {
      console.error('Failed to cancel ride:', error);
      toast({
        title: "Error",
        description: "Failed to cancel ride",
        variant: "destructive"
      });
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'waiting':
        return {
          label: 'Driver En Route',
          color: 'bg-blue-500',
          description: 'Your driver is on the way to pick you up'
        };
      case 'picked_up':
        return {
          label: 'Picked Up',
          color: 'bg-yellow-500',
          description: 'You have been picked up, starting journey'
        };
      case 'in_progress':
        return {
          label: 'En Route',
          color: 'bg-green-500',
          description: 'On the way to your destination'
        };
      default:
        return {
          label: 'Active',
          color: 'bg-primary',
          description: 'Ride in progress'
        };
    }
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'car': return <Car className="h-5 w-5" />;
      case 'motorcycle': return <Bike className="h-5 w-5" />;
      case 'disposable_driver': return <RotateCcw className="h-5 w-5" />;
      default: return <Car className="h-5 w-5" />;
    }
  };

  const getServiceName = (serviceType: string) => {
    switch (serviceType) {
      case 'car': return 'Zoto Car';
      case 'motorcycle': return 'Zoto Boda';
      case 'disposable_driver': return 'Disposable Driver';
      default: return 'Ride';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse-glow">
          <Navigation className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  if (!activeRide) {
    return (
      <Card className="card-enhanced">
        <CardContent className="p-12 text-center">
          <div className="mb-6">
            <Navigation className="h-16 w-16 text-muted-foreground mx-auto" />
          </div>
          <h3 className="text-2xl font-bold text-muted-foreground mb-2">No active ride</h3>
          <p className="text-muted-foreground">
            You don't have any active rides at the moment
          </p>
        </CardContent>
      </Card>
    );
  }

  const statusInfo = getStatusInfo(activeRide.status);

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <Card className="border-primary bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-3 h-3 rounded-full ${statusInfo.color} animate-pulse`}></div>
                <h1 className="text-2xl font-bold">{statusInfo.label}</h1>
              </div>
              <p className="text-muted-foreground">{statusInfo.description}</p>
            </div>
            <Badge className="bg-primary text-primary-foreground">
              <Navigation className="h-4 w-4 mr-2" />
              Live Tracking
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Driver Info */}
      <Card className="card-enhanced">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-bold">
                {activeRide.driver_profile?.full_name || 'Driver'}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Star className="h-4 w-4 fill-current text-yellow-500" />
                <span>{activeRide.driver_profile?.rating?.toFixed(1) || '5.0'}</span>
                <span>•</span>
                <span>{getServiceName(activeRide.ride_requests.service_type)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button size="sm" variant="outline">
                <Phone className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline">
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Vehicle Info */}
          {activeRide.vehicle && (
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              {getServiceIcon(activeRide.ride_requests.service_type)}
              <div>
                <div className="font-medium">
                  {activeRide.vehicle.make} {activeRide.vehicle.model}
                  {activeRide.vehicle.color && ` - ${activeRide.vehicle.color}`}
                </div>
                <div className="text-sm text-muted-foreground font-mono">
                  {activeRide.vehicle.license_plate}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trip Details */}
      <Card className="card-enhanced">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Trip Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="w-3 h-3 rounded-full bg-primary mt-2"></div>
            <div>
              <div className="font-medium">Pickup Location</div>
              <div className="text-sm text-muted-foreground">
                {activeRide.ride_requests.pickup_address}
              </div>
              {activeRide.pickup_time && (
                <div className="text-xs text-muted-foreground mt-1">
                  Picked up at {new Date(activeRide.pickup_time).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <MapPin className="w-5 h-5 text-destructive mt-1" />
            <div>
              <div className="font-medium">Destination</div>
              <div className="text-sm text-muted-foreground">
                {activeRide.ride_requests.destination_address}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold">
                UGX {(activeRide.actual_fare || activeRide.ride_requests.estimated_fare).toFixed(0)}
              </div>
              <div className="text-sm text-muted-foreground">
                {activeRide.actual_fare ? 'Final Fare' : 'Estimated'}
              </div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold">
                {activeRide.start_time ? 
                  Math.ceil((Date.now() - new Date(activeRide.start_time).getTime()) / 60000) :
                  '--'
                }
              </div>
              <div className="text-sm text-muted-foreground">Minutes</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Map */}
      <Card className="card-enhanced">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Live Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MapBox
            pickupLocation={{
              latitude: activeRide.ride_requests.pickup_latitude,
              longitude: activeRide.ride_requests.pickup_longitude,
              address: activeRide.ride_requests.pickup_address
            }}
            destinationLocation={{
              latitude: activeRide.ride_requests.destination_latitude,
              longitude: activeRide.ride_requests.destination_longitude,
              address: activeRide.ride_requests.destination_address
            }}
            driverLocations={driverLocation ? [{
              id: activeRide.id,
              latitude: driverLocation.latitude,
              longitude: driverLocation.longitude,
              vehicleType: activeRide.ride_requests.service_type === 'disposable_driver' ? 'car' : activeRide.ride_requests.service_type as any
            }] : []}
            className="h-[400px] rounded-lg"
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {activeRide.status === 'waiting' && (
        <Card className="card-enhanced border-destructive/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <div className="font-medium">Need to cancel?</div>
                <div className="text-sm text-muted-foreground">
                  You can cancel before the driver arrives
                </div>
              </div>
            </div>
            <Button 
              variant="destructive" 
              onClick={cancelRide}
              className="w-full"
            >
              Cancel Ride
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RiderNavigation;
