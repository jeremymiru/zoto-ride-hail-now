import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navigation, MapPin, Clock, Car, Bike } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    google: typeof google;
  }
}

interface LiveLocation {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  timestamp: string;
  user_type: 'driver' | 'rider';
  vehicle_type?: 'car' | 'boda';
  status: 'online' | 'busy' | 'offline';
}

interface UberLiveMapProps {
  className?: string;
  showDrivers?: boolean;
  trackingMode?: 'driver' | 'rider';
  rideId?: string;
}

const UberLiveMap: React.FC<UberLiveMapProps> = ({ 
  className = '', 
  showDrivers = true, 
  trackingMode = 'rider',
  rideId 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const userLocationRef = useRef<google.maps.Marker | null>(null);
  const watchIdRef = useRef<number | null>(null);
  
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyDrivers, setNearbyDrivers] = useState<LiveLocation[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [eta, setEta] = useState<string>('');

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        // Get API key from edge function
        const { data: keyData, error: keyError } = await supabase.functions.invoke('google-maps-proxy');
        
        if (keyError || !keyData?.apiKey) {
          console.error('Failed to get Google Maps API key:', keyError);
          toast({
            title: "Maps Unavailable",
            description: "Unable to load maps at this time",
            variant: "destructive"
          });
          return;
        }

        const loader = new Loader({
          apiKey: keyData.apiKey,
          version: 'weekly',
          libraries: ['geometry', 'places']
        });

        await loader.load();
        
        if (!mapRef.current) return;

        // Get user's location first
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              const userPos = { lat: latitude, lng: longitude };
              setUserLocation(userPos);

              // Initialize map centered on user location
              mapInstanceRef.current = new google.maps.Map(mapRef.current!, {
                center: userPos,
                zoom: 15,
                styles: [
                  {
                    featureType: "poi",
                    elementType: "labels",
                    stylers: [{ visibility: "off" }]
                  }
                ],
                disableDefaultUI: false,
                zoomControl: true,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
              });

              // Add user location marker
              userLocationRef.current = new google.maps.Marker({
                position: userPos,
                map: mapInstanceRef.current,
                title: 'Your Location',
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: 'hsl(210 100% 50%)', // Using primary color from design system
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 3,
                },
              });

              setIsMapLoaded(true);
            },
            (error) => {
              console.error('Error getting location:', error);
              // Fallback to default location
              const defaultPos = { lat: -1.2921, lng: 36.8219 }; // Nairobi
              setUserLocation(defaultPos);

              mapInstanceRef.current = new google.maps.Map(mapRef.current!, {
                center: defaultPos,
                zoom: 12,
              });
              setIsMapLoaded(true);
            }
          );
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        toast({
          title: "Map Loading Error",
          description: "Failed to load Google Maps. Please check your API key.",
          variant: "destructive"
        });
      }
    };

    initMap();

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [toast]);

  // Real-time location broadcasting
  const startLocationTracking = useCallback(async () => {
    if (!user || !userLocation) return;

    setIsTracking(true);

    const updateLocation = async (position: GeolocationPosition) => {
      const { latitude, longitude, heading, speed, accuracy } = position.coords;
      
      const locationData = {
        user_id: user.id,
        latitude,
        longitude,
        heading: heading || null,
        speed: speed || null,
        accuracy: accuracy || null,
        timestamp: new Date().toISOString(),
        user_type: trackingMode,
        vehicle_type: profile?.role === 'driver' ? 'car' : null,
        status: 'online'
      };

      // Update location in database
      const { error } = await supabase
        .from('live_locations')
        .upsert(locationData, { onConflict: 'user_id' });

      if (error) {
        console.error('Error updating location:', error);
        return;
      }

      // Update user marker position
      if (userLocationRef.current && mapInstanceRef.current) {
        const newPos = { lat: latitude, lng: longitude };
        userLocationRef.current.setPosition(newPos);
        setUserLocation(newPos);

        // Smoothly pan to new location
        mapInstanceRef.current.panTo(newPos);
      }
    };

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      updateLocation,
      (error) => console.error('Location tracking error:', error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );
  }, [user, userLocation, trackingMode, profile]);

  const stopLocationTracking = useCallback(async () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (user) {
      // Only update status to offline when manually stopped by user
      await supabase
        .from('live_locations')
        .update({ 
          status: 'offline',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
        
      toast({
        title: "You're Now Offline",
        description: "You won't receive new ride requests until you go online again"
      });
    }

    setIsTracking(false);
  }, [user, toast]);

  // Listen for real-time location updates
  useEffect(() => {
    if (!isMapLoaded || !showDrivers) return;

    const channel = supabase
      .channel('live-locations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_locations'
        },
        (payload) => {
          console.log('Location update:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const location = payload.new as LiveLocation;
            updateDriverMarker(location);
          } else if (payload.eventType === 'DELETE') {
            const location = payload.old as LiveLocation;
            removeDriverMarker(location.user_id);
          }
        }
      )
      .subscribe();

    // Load initial nearby drivers
    loadNearbyDrivers();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isMapLoaded, showDrivers, userLocation]);

  const loadNearbyDrivers = async () => {
    if (!userLocation) return;

    const { data, error } = await supabase
      .from('live_locations')
      .select('*')
      .eq('user_type', 'driver')
      .eq('status', 'online')
      .gte('timestamp', new Date(Date.now() - 5 * 60 * 1000).toISOString());

    if (error) {
      console.error('Error loading drivers:', error);
      return;
    }

    setNearbyDrivers(data as LiveLocation[] || []);
    
    // Add markers for each driver
    data?.forEach(driver => {
      updateDriverMarker(driver as LiveLocation);
    });
  };

  const updateDriverMarker = (location: LiveLocation) => {
    if (!mapInstanceRef.current) return;

    const markerId = location.user_id;
    const position = { lat: location.latitude, lng: location.longitude };

    // Remove existing marker
    const existingMarker = markersRef.current.get(markerId);
    if (existingMarker) {
      existingMarker.setMap(null);
    }

    // Create new marker
    const icon = location.vehicle_type === 'boda' ? '🏍️' : '🚗';
    const marker = new google.maps.Marker({
      position,
      map: mapInstanceRef.current,
      title: `Driver - ${location.vehicle_type}`,
      icon: {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="18" fill="hsl(155 60% 50%)" stroke="#ffffff" stroke-width="3"/>
            <text x="20" y="26" text-anchor="middle" font-size="16">${icon}</text>
          </svg>
        `)}`,
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 20),
      },
    });

    // Add click listener
    marker.addListener('click', () => {
      calculateRoute(position);
    });

    markersRef.current.set(markerId, marker);
  };

  const removeDriverMarker = (userId: string) => {
    const marker = markersRef.current.get(userId);
    if (marker) {
      marker.setMap(null);
      markersRef.current.delete(userId);
    }
  };

  const calculateRoute = async (destination: google.maps.LatLngLiteral) => {
    if (!userLocation || !mapInstanceRef.current) return;

    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: 'hsl(155 60% 50%)', // Using accent color from design system
        strokeWeight: 4,
      }
    });

    directionsRenderer.setMap(mapInstanceRef.current);

    directionsService.route({
      origin: userLocation,
      destination,
      travelMode: google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      if (status === 'OK' && result) {
        directionsRenderer.setDirections(result);
        
        const route = result.routes[0];
        const leg = route.legs[0];
        setEta(leg.duration?.text || '');
        
        toast({
          title: "Route Calculated",
          description: `ETA: ${leg.duration?.text || 'Unknown'}, Distance: ${leg.distance?.text || 'Unknown'}`,
        });
      }
    });
  };

  if (!isMapLoaded) {
    return (
      <div className={`flex items-center justify-center h-96 bg-muted rounded-lg ${className}`}>
        <div className="text-center space-y-4">
          <div className="animate-pulse-glow">
            <MapPin className="h-12 w-12 text-primary mx-auto" />
          </div>
          <p className="text-muted-foreground">Loading maps...</p>
          <p className="text-sm text-muted-foreground">
            Initializing real-time tracking
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full h-96 rounded-lg shadow-card" />
      
      {/* Controls */}
      <div className="absolute top-4 right-4 space-y-2">
        <Button
          onClick={isTracking ? stopLocationTracking : startLocationTracking}
          size="sm"
          variant={isTracking ? "destructive" : "default"}
          className="shadow-card"
        >
          <Navigation className="h-4 w-4 mr-2" />
          {isTracking ? 'Stop Tracking' : 'Start Tracking'}
        </Button>
      </div>

      {/* Stats */}
      <div className="absolute bottom-4 left-4 right-4">
        <Card className="shadow-elevated">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="flex items-center space-x-1">
                  <Car className="h-3 w-3" />
                  <span>{nearbyDrivers.filter(d => d.vehicle_type === 'car').length} Cars</span>
                </Badge>
                <Badge variant="outline" className="flex items-center space-x-1">
                  <Bike className="h-3 w-3" />
                  <span>{nearbyDrivers.filter(d => d.vehicle_type === 'boda').length} Boda-Boda</span>
                </Badge>
              </div>
              {eta && (
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>ETA: {eta}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status indicator */}
      {isTracking && (
        <div className="absolute top-4 left-4">
          <Badge variant="default" className="bg-accent text-accent-foreground animate-pulse">
            Live Tracking Active
          </Badge>
        </div>
      )}
    </div>
  );
};

export default UberLiveMap;