import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface MapLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

interface MapBoxProps {
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
}

const MapBox = ({ 
  onLocationSelect, 
  pickupLocation, 
  destinationLocation, 
  driverLocations = [],
  className 
}: MapBoxProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [needsToken, setNeedsToken] = useState(true);

  // For now, we'll use a placeholder map since we need Mapbox token
  const handleLocationClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!onLocationSelect) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Mock coordinates - in real implementation, this would convert screen coords to lat/lng
    const mockLat = 1.3521 + (y / rect.height - 0.5) * 0.1;
    const mockLng = 103.8198 + (x / rect.width - 0.5) * 0.1;
    
    onLocationSelect({
      latitude: mockLat,
      longitude: mockLng,
      address: `Location (${mockLat.toFixed(4)}, ${mockLng.toFixed(4)})`
    });
    
    toast({
      title: "Location Selected",
      description: `Selected coordinates: ${mockLat.toFixed(4)}, ${mockLng.toFixed(4)}`
    });
  };

  if (needsToken) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center space-y-4">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-semibold">Mapbox Integration</h3>
          <p className="text-muted-foreground">
            To enable real-time maps, please enter your Mapbox access token
          </p>
          <div className="space-y-3 max-w-md mx-auto">
            <Input
              placeholder="Enter Mapbox access token"
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
            />
            <Button 
              onClick={() => {
                if (mapboxToken) {
                  setNeedsToken(false);
                  toast({
                    title: "Token Saved",
                    description: "Mapbox integration enabled!"
                  });
                }
              }}
              className="w-full"
            >
              Enable Map
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Get your token from{' '}
            <a 
              href="https://mapbox.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              mapbox.com
            </a>
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      {/* Mock Map Interface */}
      <div 
        ref={mapContainer}
        className="w-full h-full min-h-[400px] bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900 dark:to-green-900 cursor-crosshair relative"
        onClick={handleLocationClick}
      >
        {/* Mock Map Grid */}
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%" className="absolute inset-0">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Mock Roads */}
        <svg className="absolute inset-0 w-full h-full">
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="hsl(var(--muted-foreground))" strokeWidth="3" />
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="hsl(var(--muted-foreground))" strokeWidth="3" />
          <line x1="25%" y1="0" x2="25%" y2="100%" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />
          <line x1="75%" y1="0" x2="75%" y2="100%" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />
          <line x1="0" y1="25%" x2="100%" y2="25%" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />
          <line x1="0" y1="75%" x2="100%" y2="75%" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />
        </svg>

        {/* Pickup Location Marker */}
        {pickupLocation && (
          <div className="absolute top-1/3 left-1/3 transform -translate-x-1/2 -translate-y-1/2">
            <div className="bg-success text-white p-2 rounded-full shadow-lg">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1">
              <div className="bg-success text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                Pickup
              </div>
            </div>
          </div>
        )}

        {/* Destination Location Marker */}
        {destinationLocation && (
          <div className="absolute top-2/3 right-1/3 transform -translate-x-1/2 -translate-y-1/2">
            <div className="bg-destructive text-white p-2 rounded-full shadow-lg">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1">
              <div className="bg-destructive text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                Destination
              </div>
            </div>
          </div>
        )}

        {/* Driver Location Markers */}
        {driverLocations.map((driver, index) => (
          <div 
            key={driver.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2`}
            style={{
              top: `${30 + (index * 15)}%`,
              left: `${40 + (index * 20)}%`
            }}
          >
            <div className="bg-primary text-primary-foreground p-2 rounded-full shadow-lg">
              {driver.vehicleType === 'car' ? (
                <div className="h-4 w-4 bg-current rounded-sm" />
              ) : (
                <div className="h-4 w-4">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  </svg>
                </div>
              )}
            </div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1">
              <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs whitespace-nowrap">
                {driver.vehicleType === 'car' ? 'Car' : 'Boda-Boda'}
              </div>
            </div>
          </div>
        ))}

        {/* Map Controls */}
        <div className="absolute top-4 right-4 space-y-2">
          <Button size="icon" variant="secondary" className="bg-card shadow-lg">
            <Navigation className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" className="bg-card shadow-lg">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Click to Select Instruction */}
        {onLocationSelect && (
          <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg">
            <p className="text-sm text-muted-foreground">Click on the map to select location</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default MapBox;