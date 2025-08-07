import React, { useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Search, Plus, Minus, RotateCcw } from 'lucide-react';
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
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);

  const handleLocationClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!onLocationSelect) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / zoom - panX;
    const y = (event.clientY - rect.top) / zoom - panY;
    
    // Convert screen coordinates to lat/lng (mock implementation)
    const lat = 0.3521 + (y / rect.height - 0.5) * 0.2;
    const lng = 32.5816 + (x / rect.width - 0.5) * 0.2;
    
    const location = {
      latitude: lat,
      longitude: lng,
      address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    };
    
    setSelectedLocation(location);
    onLocationSelect(location);
    
    toast({
      title: "Location Selected",
      description: `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
    });
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setSelectedLocation(null);
  };

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <div 
        ref={mapContainer}
        className="w-full h-full min-h-[400px] bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 cursor-crosshair relative overflow-hidden"
        onClick={handleLocationClick}
        style={{
          transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
          transformOrigin: 'center center'
        }}
      >
        {/* Map Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <svg width="100%" height="100%" className="absolute inset-0">
            <defs>
              <pattern id="map-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5"/>
              </pattern>
              <pattern id="roads" width="200" height="200" patternUnits="userSpaceOnUse">
                <rect width="200" height="200" fill="none"/>
                <path d="M 0 100 L 200 100 M 100 0 L 100 200" stroke="hsl(var(--muted-foreground))" strokeWidth="3"/>
                <path d="M 0 50 L 200 50 M 0 150 L 200 150" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5"/>
                <path d="M 50 0 L 50 200 M 150 0 L 150 200" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#map-grid)" />
            <rect width="100%" height="100%" fill="url(#roads)" opacity="0.7" />
          </svg>
        </div>

        {/* City Blocks */}
        <div className="absolute inset-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute bg-muted/20 rounded"
              style={{
                top: `${15 + (i % 4) * 20}%`,
                left: `${10 + Math.floor(i / 4) * 40}%`,
                width: `${8 + (i % 3) * 4}%`,
                height: `${6 + (i % 2) * 4}%`,
              }}
            />
          ))}
        </div>

        {/* Parks/Green Areas */}
        <div className="absolute top-[20%] left-[60%] w-[15%] h-[15%] bg-emerald-200/40 dark:bg-emerald-600/20 rounded-full" />
        <div className="absolute top-[60%] left-[20%] w-[12%] h-[8%] bg-emerald-200/40 dark:bg-emerald-600/20 rounded" />

        {/* Selected Location Marker */}
        {selectedLocation && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="bg-primary text-primary-foreground p-3 rounded-full shadow-xl animate-pulse">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2">
              <div className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm whitespace-nowrap shadow-lg">
                Selected Location
              </div>
            </div>
          </div>
        )}

        {/* Pickup Location Marker */}
        {pickupLocation && (
          <div className="absolute top-[35%] left-[30%] transform -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="bg-emerald-500 text-white p-3 rounded-full shadow-xl border-2 border-white">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2">
              <div className="bg-emerald-500 text-white px-3 py-1 rounded text-sm whitespace-nowrap shadow-lg">
                Pickup Location
              </div>
            </div>
          </div>
        )}

        {/* Destination Location Marker */}
        {destinationLocation && (
          <div className="absolute top-[65%] left-[70%] transform -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="bg-red-500 text-white p-3 rounded-full shadow-xl border-2 border-white">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2">
              <div className="bg-red-500 text-white px-3 py-1 rounded text-sm whitespace-nowrap shadow-lg">
                Destination
              </div>
            </div>
          </div>
        )}

        {/* Driver Location Markers */}
        {driverLocations.map((driver, index) => (
          <div 
            key={driver.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
            style={{
              top: `${25 + (index * 12) + Math.sin(index * 1.5) * 10}%`,
              left: `${35 + (index * 15) + Math.cos(index * 2) * 8}%`
            }}
          >
            <div className="bg-blue-500 text-white p-2 rounded-full shadow-lg border border-white animate-bounce">
              {driver.vehicleType === 'car' ? (
                <div className="h-4 w-4 bg-current rounded-sm" />
              ) : (
                <div className="h-4 w-4 rounded-full bg-current" />
              )}
            </div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1">
              <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs whitespace-nowrap shadow">
                {driver.vehicleType === 'car' ? 'Car' : 'Boda-Boda'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        <Button size="icon" variant="secondary" className="bg-card shadow-lg" onClick={handleZoomIn}>
          <Plus className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="secondary" className="bg-card shadow-lg" onClick={handleZoomOut}>
          <Minus className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="secondary" className="bg-card shadow-lg" onClick={handleReset}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Search Control */}
      <div className="absolute top-4 left-4">
        <Button size="icon" variant="secondary" className="bg-card shadow-lg">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation Control */}
      <div className="absolute bottom-4 right-4">
        <Button size="icon" variant="secondary" className="bg-card shadow-lg">
          <Navigation className="h-4 w-4" />
        </Button>
      </div>

      {/* Instructions */}
      {onLocationSelect && (
        <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border">
          <p className="text-sm text-muted-foreground">
            Click anywhere on the map to select a location
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Zoom: {Math.round(zoom * 100)}%
          </p>
        </div>
      )}
    </Card>
  );
};

export default MapBox;