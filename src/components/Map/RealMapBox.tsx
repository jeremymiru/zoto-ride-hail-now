import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation, Search, Plus, Minus, RotateCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useGeolocation } from '@/hooks/useGeolocation';

interface MapLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

interface RealMapBoxProps {
  onLocationSelect?: (location: MapLocation) => void;
  pickupLocation?: MapLocation;
  destinationLocation?: MapLocation;
  driverLocations?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    heading?: number;
    vehicleType: 'car' | 'motorcycle';
  }>;
  className?: string;
  mapboxToken?: string;
}

const RealMapBox = ({ 
  onLocationSelect, 
  pickupLocation, 
  destinationLocation, 
  driverLocations = [],
  className,
  mapboxToken
}: RealMapBoxProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userToken, setUserToken] = useState(mapboxToken || '');
  const { latitude, longitude } = useGeolocation();
  
  // Markers refs
  const pickupMarker = useRef<mapboxgl.Marker | null>(null);
  const destinationMarker = useRef<mapboxgl.Marker | null>(null);
  const driverMarkers = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current || !userToken) return;

    // Initialize map
    mapboxgl.accessToken = userToken;
    
    const initialCenter: [number, number] = latitude && longitude 
      ? [longitude, latitude] 
      : [36.8219, -1.2921]; // Nairobi default

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCenter,
      zoom: 12,
      pitch: 0,
      bearing: 0
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Add geolocate control
    const geolocateControl = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    });
    
    map.current.addControl(geolocateControl, 'top-right');

    // Click handler for location selection
    map.current.on('click', (e) => {
      if (!onLocationSelect) return;
      
      const { lng, lat } = e.lngLat;
      
      // Reverse geocoding to get address
      fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${userToken}&limit=1`)
        .then(response => response.json())
        .then(data => {
          const address = data.features?.[0]?.place_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          
          onLocationSelect({
            latitude: lat,
            longitude: lng,
            address
          });
          
          toast({
            title: "Location Selected",
            description: address
          });
        })
        .catch(() => {
          onLocationSelect({
            latitude: lat,
            longitude: lng,
            address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
          });
        });
    });

    map.current.on('load', () => {
      setIsMapLoaded(true);
    });

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [userToken, latitude, longitude, onLocationSelect]);

  // Update pickup marker
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Remove existing pickup marker
    if (pickupMarker.current) {
      pickupMarker.current.remove();
    }

    if (pickupLocation) {
      // Create pickup marker
      const el = document.createElement('div');
      el.className = 'pickup-marker';
      el.innerHTML = `
        <div class="w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
          <div class="w-3 h-3 bg-white rounded-full"></div>
        </div>
      `;

      pickupMarker.current = new mapboxgl.Marker(el)
        .setLngLat([pickupLocation.longitude, pickupLocation.latitude])
        .setPopup(new mapboxgl.Popup().setHTML(`<div class="font-semibold">Pickup Location</div><div class="text-sm">${pickupLocation.address}</div>`))
        .addTo(map.current);
    }
  }, [pickupLocation, isMapLoaded]);

  // Update destination marker
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Remove existing destination marker
    if (destinationMarker.current) {
      destinationMarker.current.remove();
    }

    if (destinationLocation) {
      // Create destination marker
      const el = document.createElement('div');
      el.className = 'destination-marker';
      el.innerHTML = `
        <div class="w-8 h-10 bg-red-500 text-white rounded-t-full rounded-b-none border-4 border-white shadow-lg flex items-center justify-center relative">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
          </svg>
          <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-red-500"></div>
        </div>
      `;

      destinationMarker.current = new mapboxgl.Marker(el)
        .setLngLat([destinationLocation.longitude, destinationLocation.latitude])
        .setPopup(new mapboxgl.Popup().setHTML(`<div class="font-semibold">Destination</div><div class="text-sm">${destinationLocation.address}</div>`))
        .addTo(map.current);
    }
  }, [destinationLocation, isMapLoaded]);

  // Update driver markers
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Remove existing driver markers
    driverMarkers.current.forEach(marker => marker.remove());
    driverMarkers.current = [];

    // Add new driver markers
    driverLocations.forEach((driver) => {
      const el = document.createElement('div');
      el.className = 'driver-marker';
      el.innerHTML = `
        <div class="w-8 h-8 bg-white rounded-full border-2 border-blue-500 shadow-lg flex items-center justify-center relative">
          ${driver.vehicleType === 'car' 
            ? '<svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z"/></svg>'
            : '<svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2L13.09 8.26L19 7L17.74 13.74L22 15L15.74 16.26L17 23L10.26 21.91L9 16L2.74 17.26L4 10.26L2 9L8.26 7.91L7 2L10 2Z"/></svg>'
          }
          <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
        </div>
      `;

      const marker = new mapboxgl.Marker(el)
        .setLngLat([driver.longitude, driver.latitude])
        .setPopup(new mapboxgl.Popup().setHTML(`<div class="font-semibold">Available ${driver.vehicleType === 'car' ? 'Car' : 'Boda-Boda'}</div>`))
        .addTo(map.current!);

      driverMarkers.current.push(marker);
    });
  }, [driverLocations, isMapLoaded]);

  // Search functionality
  const handleSearch = async (query: string) => {
    if (!userToken || !query.trim()) return;

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${userToken}&proximity=${longitude},${latitude}&country=KE&limit=5`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const [lng, lat] = feature.center;
        
        // Fly to the location
        map.current?.flyTo({
          center: [lng, lat],
          zoom: 14,
          duration: 1000
        });

        if (onLocationSelect) {
          onLocationSelect({
            latitude: lat,
            longitude: lng,
            address: feature.place_name
          });
        }

        toast({
          title: "Location Found",
          description: feature.place_name
        });
      }
    } catch (error) {
      toast({
        title: "Search Error",
        description: "Unable to search for location",
        variant: "destructive"
      });
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  const handleMyLocation = () => {
    if (latitude && longitude && map.current) {
      map.current.flyTo({
        center: [longitude, latitude],
        zoom: 15,
        duration: 1000
      });
      
      if (onLocationSelect) {
        onLocationSelect({
          latitude,
          longitude,
          address: `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
        });
      }
    }
  };

  if (!userToken) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Setup Required</h3>
          <p className="text-sm text-muted-foreground">
            To use the interactive map, please enter your Mapbox public token.
            Get one at <a href="https://account.mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">mapbox.com</a>
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Enter Mapbox public token (pk.)"
              value={userToken}
              onChange={(e) => setUserToken(e.target.value)}
            />
            <Button onClick={() => {
              if (userToken.startsWith('pk.')) {
                toast({
                  title: "Token Set",
                  description: "Map will now load"
                });
              } else {
                toast({
                  title: "Invalid Token",
                  description: "Please enter a valid Mapbox public token",
                  variant: "destructive"
                });
              }
            }}>
              Set Token
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      {/* Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-20">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search places in Kenya..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 text-sm bg-white dark:bg-gray-800 border-none shadow-lg rounded-xl"
            />
          </div>
          <Button 
            type="button"
            size="icon" 
            variant="secondary" 
            className="bg-white dark:bg-gray-800 shadow-lg rounded-xl border-0"
            onClick={handleMyLocation}
          >
            <Navigation className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Map Container */}
      <div 
        ref={mapContainer}
        className="w-full h-full min-h-[400px] cursor-pointer"
      />

      {/* Instructions */}
      {onLocationSelect && (
        <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-4 py-3 rounded-xl shadow-lg border-0 z-10">
          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
            Search or click to select location
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Green: Pickup • Red: Destination • Blue: Available drivers
          </p>
        </div>
      )}
    </Card>
  );
};

export default RealMapBox;