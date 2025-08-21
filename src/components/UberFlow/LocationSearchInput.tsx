import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Navigation, 
  Search,
  Clock,
  Star
} from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { toast } from '@/hooks/use-toast';

interface LocationSuggestion {
  id: string;
  name: string;
  address: string;
  type: 'recent' | 'popular' | 'current' | 'search';
  latitude: number;
  longitude: number;
}

interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

interface LocationSearchInputProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onLocationSelect: (location: Location) => void;
  selectedLocation?: Location | null;
  showCurrentLocation?: boolean;
}

const LocationSearchInput = ({
  placeholder,
  value,
  onChange,
  onLocationSelect,
  selectedLocation,
  showCurrentLocation = true
}: LocationSearchInputProps) => {
  const { latitude, longitude, loading: locationLoading } = useGeolocation();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);

  // Mock location suggestions for Uganda
  const mockSuggestions: LocationSuggestion[] = [
    {
      id: '1',
      name: 'Kampala City Centre',
      address: 'City Centre, Kampala, Uganda',
      type: 'popular',
      latitude: -0.3476,
      longitude: 32.5825
    },
    {
      id: '2', 
      name: 'Entebbe Airport',
      address: 'Entebbe International Airport, Entebbe, Uganda',
      type: 'popular',
      latitude: 0.0424,
      longitude: 32.4435
    },
    {
      id: '3',
      name: 'Makerere University',
      address: 'Makerere University, Kampala, Uganda', 
      type: 'popular',
      latitude: 0.3294,
      longitude: 32.5663
    },
    {
      id: '4',
      name: 'Nakasero Market',
      address: 'Nakasero Market, Kampala, Uganda',
      type: 'recent',
      latitude: -0.3067,
      longitude: 32.5794
    },
    {
      id: '5',
      name: 'Garden City Mall',
      address: 'Garden City Shopping Mall, Kampala, Uganda',
      type: 'popular',
      latitude: -0.3757,
      longitude: 32.6178
    },
    {
      id: '6',
      name: 'Acacia Mall',
      address: 'Acacia Avenue, Kololo, Kampala, Uganda',
      type: 'recent',
      latitude: -0.3198,
      longitude: 32.5863
    }
  ];

  useEffect(() => {
    if (value.trim()) {
      // Filter suggestions based on search query
      const filtered = mockSuggestions.filter(suggestion =>
        suggestion.name.toLowerCase().includes(value.toLowerCase()) ||
        suggestion.address.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      // Show popular and recent suggestions when no search query
      setSuggestions(mockSuggestions);
      setShowSuggestions(true);
    }
  }, [value]);

  const useCurrentLocation = () => {
    if (latitude && longitude) {
      const currentLocation = {
        latitude,
        longitude,
        address: `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
      };
      onLocationSelect(currentLocation);
      onChange(currentLocation.address);
      setShowSuggestions(false);
      toast({
        title: "Current Location Set",
        description: "Using your current location"
      });
    } else {
      toast({
        title: "Location Not Available",
        description: "Please enable location services",
        variant: "destructive"
      });
    }
  };

  const handleSuggestionSelect = (suggestion: LocationSuggestion) => {
    const location = {
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
      address: suggestion.address
    };
    onLocationSelect(location);
    onChange(suggestion.address);
    setShowSuggestions(false);
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'recent': return <Clock className="h-4 w-4" />;
      case 'popular': return <Star className="h-4 w-4" />;
      case 'current': return <Navigation className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const getSuggestionBadge = (type: string) => {
    switch (type) {
      case 'recent': return <Badge variant="outline" className="text-xs">Recent</Badge>;
      case 'popular': return <Badge variant="secondary" className="text-xs">Popular</Badge>;
      default: return null;
    }
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            className="pl-10"
          />
        </div>
        
        {showCurrentLocation && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={useCurrentLocation}
            disabled={locationLoading}
            className="shrink-0"
          >
            <Navigation className="h-4 w-4" />
          </Button>
        )}
      </div>

      {selectedLocation && (
        <Badge variant="outline" className="mt-2 w-fit">
          <MapPin className="h-3 w-3 mr-1" />
          {selectedLocation.address}
        </Badge>
      )}

      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No locations found</p>
            </div>
          ) : (
            <div className="py-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-full bg-muted">
                      {getSuggestionIcon(suggestion.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{suggestion.name}</span>
                        {getSuggestionBadge(suggestion.type)}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {suggestion.address}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Backdrop to close suggestions */}
      {showSuggestions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
};

export default LocationSearchInput;