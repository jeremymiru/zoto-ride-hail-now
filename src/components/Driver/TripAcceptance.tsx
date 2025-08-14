
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  MessageCircle, 
  Car,
  Bike,
  RotateCcw,
  Star,
  Navigation,
  DollarSign
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import UberLiveMap from '@/components/Map/UberLiveMap';

interface RideRequest {
  id: string;
  user_id: string;
  pickup_address: string;
  destination_address: string;
  pickup_latitude: number;
  pickup_longitude: number;
  destination_latitude: number;
  destination_longitude: number;
  service_type: 'car' | 'motorcycle' | 'bicycle' | 'disposable_driver';
  estimated_fare: number;
  notes?: string;
  created_at: string;
  profiles?: {
    full_name: string;
    phone?: string;
    rating?: number;
  };
}

const TripAcceptance = () => {
  const { user } = useAuth();
  const [pendingRequests, setPendingRequests] = useState<RideRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RideRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPendingRequests();
      subscribeToRequests();
    }
  }, [user]);

  const fetchPendingRequests = async () => {
    try {
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
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPendingRequests(data || []);
    } catch (error: any) {
      console.error('Failed to fetch pending requests:', error);
      toast({
        title: "Error",
        description: "Failed to load ride requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToRequests = () => {
    const channel = supabase
      .channel('ride-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ride_requests',
          filter: 'status=eq.pending'
        },
        () => {
          fetchPendingRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const acceptRequest = async (request: RideRequest) => {
    if (!user) return;

    try {
      // Update request status to accepted
      const { error: updateError } = await supabase
        .from('ride_requests')
        .update({ status: 'accepted' })
        .eq('id', request.id);

      if (updateError) throw updateError;

      // Create a ride record
      const { error: rideError } = await supabase
        .from('rides')
        .insert({
          request_id: request.id,
          driver_id: user.id,
          vehicle_id: '00000000-0000-0000-0000-000000000000', // You might want to select from user's vehicles
          status: 'waiting'
        });

      if (rideError) throw rideError;

      toast({
        title: "Trip Accepted!",
        description: "You've accepted the ride request. Navigate to the pickup location."
      });

      // Remove from pending list
      setPendingRequests(prev => prev.filter(r => r.id !== request.id));
      setSelectedRequest(null);

    } catch (error: any) {
      console.error('Failed to accept request:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const declineRequest = (requestId: string) => {
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    setSelectedRequest(null);
    toast({
      title: "Request Declined",
      description: "The ride request has been removed from your list."
    });
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

  const calculateDistance = (request: RideRequest) => {
    // Simple distance calculation for display
    const R = 6371;
    const dLat = (request.destination_latitude - request.pickup_latitude) * Math.PI / 180;
    const dLon = (request.destination_longitude - request.pickup_longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(request.pickup_latitude * Math.PI / 180) * Math.cos(request.destination_latitude * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance.toFixed(1);
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

  if (selectedRequest) {
    return (
      <div className="space-y-6">
        <Card className="card-enhanced border-primary">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                {getServiceIcon(selectedRequest.service_type)}
                Trip Request Details
              </CardTitle>
              <Button 
                variant="outline" 
                onClick={() => setSelectedRequest(null)}
                className="hover-lift"
              >
                Back to List
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Passenger Info */}
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarFallback>
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  {selectedRequest.profiles?.full_name || 'Passenger'}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 fill-current text-yellow-500" />
                  <span>{selectedRequest.profiles?.rating?.toFixed(1) || '5.0'}</span>
                  {selectedRequest.profiles?.phone && (
                    <>
                      <span>•</span>
                      <span>{selectedRequest.profiles.phone}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Trip Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <div>
                  <div className="font-medium">Pickup Location</div>
                  <div className="text-sm text-muted-foreground">{selectedRequest.pickup_address}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <MapPin className="w-5 h-5 text-destructive" />
                <div>
                  <div className="font-medium">Destination</div>
                  <div className="text-sm text-muted-foreground">{selectedRequest.destination_address}</div>
                </div>
              </div>
            </div>

            {/* Service & Fare Info */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    {getServiceIcon(selectedRequest.service_type)}
                  </div>
                  <div className="font-semibold">{getServiceName(selectedRequest.service_type)}</div>
                  <div className="text-sm text-muted-foreground">Service Type</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div className="font-semibold">UGX {selectedRequest.estimated_fare.toFixed(0)}</div>
                  <div className="text-sm text-muted-foreground">Estimated Fare</div>
                </CardContent>
              </Card>
            </div>

            {/* Trip Stats */}
            <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
              <div className="text-center">
                <div className="font-bold text-lg">{calculateDistance(selectedRequest)} km</div>
                <div className="text-sm text-muted-foreground">Distance</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">
                  {new Date(selectedRequest.created_at).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div className="text-sm text-muted-foreground">Requested</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">~{Math.ceil(parseFloat(calculateDistance(selectedRequest)) * 3)} min</div>
                <div className="text-sm text-muted-foreground">Est. Duration</div>
              </div>
            </div>

            {selectedRequest.notes && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="font-medium text-blue-900 mb-1">Passenger Notes:</div>
                <div className="text-blue-800">{selectedRequest.notes}</div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => declineRequest(selectedRequest.id)}
                className="flex-1"
              >
                Decline
              </Button>
              <Button 
                onClick={() => acceptRequest(selectedRequest)}
                className="flex-1 btn-gradient"
              >
                Accept Trip
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Map */}
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Trip Route
            </CardTitle>
          </CardHeader>
          <CardContent>
          <UberLiveMap
            showDrivers={false}
            trackingMode="driver"
            className="h-[400px] rounded-lg"
          />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="gradient-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Available Trips</h1>
              <p className="text-white/80 text-lg">Accept ride requests in your area</p>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white">
              {pendingRequests.length} Available
            </Badge>
          </div>
        </CardContent>
      </Card>

      {pendingRequests.length === 0 ? (
        <Card className="card-enhanced">
          <CardContent className="p-12 text-center">
            <div className="animate-pulse-glow mb-6">
              <Car className="h-16 w-16 text-muted-foreground mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-muted-foreground mb-2">No trips available</h3>
            <p className="text-muted-foreground">
              We'll notify you when new ride requests come in your area
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingRequests.map((request) => (
            <Card key={request.id} className="card-enhanced hover-lift cursor-pointer transition-all">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    {getServiceIcon(request.service_type)}
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{getServiceName(request.service_type)}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          Requested {new Date(request.created_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">UGX {request.estimated_fare.toFixed(0)}</div>
                        <div className="text-sm text-muted-foreground">{calculateDistance(request)} km</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                        <span className="text-muted-foreground truncate">{request.pickup_address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-destructive" />
                        <span className="text-muted-foreground truncate">{request.destination_address}</span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => declineRequest(request.id)}
                        className="flex-1"
                      >
                        Skip
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => setSelectedRequest(request)}
                        className="flex-1 btn-gradient"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TripAcceptance;
