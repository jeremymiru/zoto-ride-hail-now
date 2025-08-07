import React, { useRef, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation, Search, Plus, Minus, RotateCcw, Clock, Star } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface MapLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

interface LocationSuggestion {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: 'restaurant' | 'hotel' | 'landmark' | 'business' | 'residential' | 'airport' | 'hospital';
  rating?: number;
  isRecent?: boolean;
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

// Mock location data for suggestions
const mockLocations: LocationSuggestion[] = [
  { id: '1', name: 'Jomo Kenyatta International Airport', address: 'Airport South Rd, Nairobi', latitude: -1.3192, longitude: 36.9277, type: 'airport', rating: 4.2 },
  { id: '2', name: 'Nairobi National Museum', address: 'Museum Hill, Nairobi', latitude: -1.2741, longitude: 36.8155, type: 'landmark', rating: 4.5 },
  { id: '3', name: 'Kenyatta International Conference Centre', address: 'Harambee Ave, Nairobi', latitude: -1.2921, longitude: 36.8219, type: 'business', rating: 4.3 },
  { id: '4', name: 'Uhuru Park', address: 'Uhuru Highway, Nairobi', latitude: -1.2966, longitude: 36.8162, type: 'landmark', rating: 4.1 },
  { id: '5', name: 'Westgate Shopping Mall', address: 'Mwanzi Rd, Nairobi', latitude: -1.2661, longitude: 36.8048, type: 'business', rating: 4.4 },
  { id: '6', name: 'Kenyatta National Hospital', address: 'Hospital Rd, Nairobi', latitude: -1.3013, longitude: 36.8073, type: 'hospital', rating: 3.8 },
  { id: '7', name: 'Villa Rosa Kempinski', address: 'Chiromo Rd, Nairobi', latitude: -1.2634, longitude: 36.8107, type: 'hotel', rating: 4.6 },
  { id: '8', name: 'Java House', address: 'Kimathi St, Nairobi', latitude: -1.2845, longitude: 36.8219, type: 'restaurant', rating: 4.2, isRecent: true },
  { id: '9', name: 'Sarit Centre', address: 'Karuna Rd, Nairobi', latitude: -1.2634, longitude: 36.7853, type: 'business', rating: 4.3 },
  { id: '10', name: 'Karen Blixen Museum', address: 'Karen Rd, Nairobi', latitude: -1.3538, longitude: 36.7073, type: 'landmark', rating: 4.4 },
];

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
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.length > 0) {
      const filtered = mockLocations.filter(location =>
        location.name.toLowerCase().includes(query.toLowerCase()) ||
        location.address.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  const handleSuggestionSelect = (suggestion: LocationSuggestion) => {
    const location = {
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
      address: suggestion.address
    };
    
    setSelectedLocation(location);
    setSearchQuery(suggestion.name);
    setShowSuggestions(false);
    
    if (onLocationSelect) {
      onLocationSelect(location);
    }
    
    toast({
      title: "Location Selected",
      description: suggestion.name
    });
  };

  const handleLocationClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!onLocationSelect) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / zoom - panX;
    const y = (event.clientY - rect.top) / zoom - panY;
    
    // Convert screen coordinates to lat/lng (mock implementation)
    const lat = -1.2921 + (y / rect.height - 0.5) * 0.2;
    const lng = 36.8219 + (x / rect.width - 0.5) * 0.2;
    
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
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'restaurant': return '🍽️';
      case 'hotel': return '🏨';
      case 'landmark': return '🏛️';
      case 'business': return '🏢';
      case 'airport': return '✈️';
      case 'hospital': return '🏥';
      default: return '📍';
    }
  };

  return (
    <Card className={`relative overflow-hidden bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-20">
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search places..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchQuery && setShowSuggestions(true)}
              className="pl-10 pr-4 py-3 text-sm bg-white dark:bg-gray-800 border-none shadow-lg rounded-xl"
            />
          </div>
          
          {/* Search Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border max-h-80 overflow-y-auto z-30">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  <div className="text-lg">{getLocationIcon(suggestion.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{suggestion.name}</h4>
                      {suggestion.isRecent && (
                        <Clock className="h-3 w-3 text-muted-foreground" />
                      )}
                      {suggestion.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <span className="text-xs text-muted-foreground">{suggestion.rating}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{suggestion.address}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div 
        ref={mapContainer}
        className="w-full h-full min-h-[400px] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 cursor-crosshair relative overflow-hidden"
        onClick={handleLocationClick}
        style={{
          transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
          transformOrigin: 'center center'
        }}
      >
        {/* Uber-style Map Background */}
        <div className="absolute inset-0">
          <svg width="100%" height="100%" className="absolute inset-0">
            <defs>
              <pattern id="uber-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <rect width="40" height="40" fill="transparent"/>
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(156, 163, 175, 0.3)" strokeWidth="0.5"/>
              </pattern>
              <pattern id="uber-roads" width="120" height="120" patternUnits="userSpaceOnUse">
                <rect width="120" height="120" fill="transparent"/>
                {/* Main roads */}
                <path d="M 0 60 L 120 60" stroke="#ffffff" strokeWidth="4"/>
                <path d="M 60 0 L 60 120" stroke="#ffffff" strokeWidth="4"/>
                {/* Secondary roads */}
                <path d="M 0 30 L 120 30 M 0 90 L 120 90" stroke="#ffffff" strokeWidth="2"/>
                <path d="M 30 0 L 30 120 M 90 0 L 90 120" stroke="#ffffff" strokeWidth="2"/>
                {/* Road borders */}
                <path d="M 0 58 L 120 58 M 0 62 L 120 62" stroke="#e5e7eb" strokeWidth="0.5"/>
                <path d="M 58 0 L 58 120 M 62 0 L 62 120" stroke="#e5e7eb" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#uber-grid)" />
            <rect width="100%" height="100%" fill="url(#uber-roads)" />
          </svg>
        </div>

        {/* Buildings/City Blocks */}
        <div className="absolute inset-0">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute bg-white dark:bg-gray-600 rounded shadow-sm border border-gray-200 dark:border-gray-700"
              style={{
                top: `${10 + (i % 4) * 22}%`,
                left: `${8 + Math.floor(i / 4) * 28}%`,
                width: `${6 + (i % 3) * 3}%`,
                height: `${4 + (i % 2) * 3}%`,
              }}
            />
          ))}
        </div>

        {/* Parks and Green Spaces */}
        <div className="absolute top-[25%] left-[65%] w-[12%] h-[12%] bg-green-200 dark:bg-green-800 rounded opacity-60" />
        <div className="absolute top-[65%] left-[15%] w-[10%] h-[8%] bg-green-200 dark:bg-green-800 rounded opacity-60" />

        {/* Parks/Green Areas */}
        <div className="absolute top-[20%] left-[60%] w-[15%] h-[15%] bg-emerald-200/40 dark:bg-emerald-600/20 rounded-full" />
        <div className="absolute top-[60%] left-[20%] w-[12%] h-[8%] bg-emerald-200/40 dark:bg-emerald-600/20 rounded" />

        {/* Selected Location Marker */}
        {selectedLocation && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="relative">
              <div className="bg-black text-white p-3 rounded-full shadow-2xl border-4 border-white animate-pulse">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2">
                <div className="bg-black text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap shadow-lg">
                  Selected Location
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-0 h-0 border-l-2 border-r-2 border-b-2 border-transparent border-b-black"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pickup Location Marker */}
        {pickupLocation && (
          <div className="absolute top-[35%] left-[30%] transform -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="relative">
              <div className="bg-green-500 text-white p-3 rounded-full shadow-2xl border-4 border-white">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2">
                <div className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap shadow-lg">
                  Pickup
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-0 h-0 border-l-2 border-r-2 border-b-2 border-transparent border-b-green-500"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Destination Location Marker */}
        {destinationLocation && (
          <div className="absolute top-[65%] left-[70%] transform -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="relative">
              <div className="bg-black text-white p-3 rounded-lg shadow-2xl border-4 border-white" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 70%, 50% 100%, 0% 70%)' }}>
                <MapPin className="h-5 w-5" />
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2">
                <div className="bg-black text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap shadow-lg">
                  Destination
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-0 h-0 border-l-2 border-r-2 border-b-2 border-transparent border-b-black"></div>
                </div>
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
            <div className="relative">
              <div className="bg-white text-gray-800 p-2 rounded-full shadow-xl border-3 border-gray-200">
                {driver.vehicleType === 'car' ? (
                  <div className="h-5 w-5 text-blue-600">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                    </svg>
                  </div>
                ) : (
                  <div className="h-5 w-5 text-green-600">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L13.09 8.26L19 7L17.74 13.74L22 15L15.74 16.26L17 23L10.26 21.91L9 16L2.74 17.26L4 10.26L2 9L8.26 7.91L7 2L12 2Z"/>
                    </svg>
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                <div className="w-2 h-2 bg-green-500 rounded-full border border-white animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Map Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col space-y-2 z-10">
        <Button size="icon" variant="secondary" className="bg-white dark:bg-gray-800 shadow-xl rounded-full border-0 hover:scale-105 transition-transform" onClick={handleZoomIn}>
          <Plus className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="secondary" className="bg-white dark:bg-gray-800 shadow-xl rounded-full border-0 hover:scale-105 transition-transform" onClick={handleZoomOut}>
          <Minus className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="secondary" className="bg-white dark:bg-gray-800 shadow-xl rounded-full border-0 hover:scale-105 transition-transform" onClick={handleReset}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation Control */}
      <div className="absolute bottom-4 left-4 z-10">
        <Button size="icon" variant="secondary" className="bg-white dark:bg-gray-800 shadow-xl rounded-full border-0 hover:scale-105 transition-transform">
          <Navigation className="h-4 w-4" />
        </Button>
      </div>

      {/* Instructions */}
      {onLocationSelect && !searchQuery && (
        <div className="absolute bottom-16 left-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-4 py-3 rounded-xl shadow-lg border-0 z-10">
          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
            Search or tap to select location
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Zoom: {Math.round(zoom * 100)}%
          </p>
        </div>
      )}
    </Card>
  );
};

export default MapBox;