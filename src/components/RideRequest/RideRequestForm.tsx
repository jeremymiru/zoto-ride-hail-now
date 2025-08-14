import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useDriverMatching } from '@/hooks/useDriverMatching';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Car, Bike, Navigation, DollarSign } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import UberLiveMap from '@/components/Map/UberLiveMap';
import { formatCurrencyDisplay } from '@/lib/currency';

interface RideRequestFormProps {
  onRequestCreated?: () => void;
}

interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

const RideRequestForm = ({ onRequestCreated }: RideRequestFormProps) => {
  const { user } = useAuth();
  const { latitude, longitude, loading: locationLoading } = useGeolocation();
  const { getNearbyDrivers } = useDriverMatching();
  
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<Location | null>(null);
  const [pickupAddress, setPickupAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [serviceType, setServiceType] = useState<'car' | 'motorcycle' | 'bicycle'>('car');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectingLocation, setSelectingLocation] = useState<'pickup' | 'destination' | null>(null);

  const useCurrentLocation = () => {
    if (latitude && longitude) {
      const currentLocation = {
        latitude,
        longitude,
        address: `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
      };
      setPickupLocation(currentLocation);
      setPickupAddress(currentLocation.address);
      toast({
        title: "Current Location Set",
        description: "Using your current location as pickup point"
      });
    } else {
      toast({
        title: "Location Not Available",
        description: "Please enable location services",
        variant: "destructive"
      });
    }
  };

  const calculateEstimatedFare = () => {
    if (!pickupLocation || !destinationLocation) return 0;
    
    // Simple distance calculation (Haversine formula approximation)
    const R = 6371; // Earth's radius in km
    const dLat = (destinationLocation.latitude - pickupLocation.latitude) * Math.PI / 180;
    const dLon = (destinationLocation.longitude - pickupLocation.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(pickupLocation.latitude * Math.PI / 180) * Math.cos(destinationLocation.latitude * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    // Base fare calculation
    const baseFare = serviceType === 'car' ? 10 : 5;
    const perKmRate = serviceType === 'car' ? 2.5 : 1.5;
    
    return baseFare + (distance * perKmRate);
  };

  const handlePickupAddressSet = () => {
    if (pickupAddress.trim()) {
      // Use current location if available, otherwise use a default location
      const location = {
        latitude: latitude || -1.2921, // Default to Nairobi
        longitude: longitude || 36.8219,
        address: pickupAddress
      };
      setPickupLocation(location);
      toast({
        title: "Pickup Location Set",
        description: "Pickup address has been set"
      });
    }
  };

  const handleDestinationAddressSet = () => {
    if (destinationAddress.trim()) {
      // Estimate destination coordinates (in real app, would use geocoding)
      const location = {
        latitude: (latitude || -1.2921) + 0.01, // Small offset for demo
        longitude: (longitude || 36.8219) + 0.01,
        address: destinationAddress
      };
      setDestinationLocation(location);
      toast({
        title: "Destination Set",
        description: "Destination address has been set"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to request a ride",
        variant: "destructive"
      });
      return;
    }

    if (!pickupLocation || !destinationLocation) {
      toast({
        title: "Locations Required",
        description: "Please select both pickup and destination locations",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const estimatedFare = calculateEstimatedFare();
      
      const { error } = await supabase
        .from('ride_requests')
        .insert({
          user_id: user.id,
          pickup_latitude: pickupLocation.latitude,
          pickup_longitude: pickupLocation.longitude,
          pickup_address: pickupLocation.address,
          destination_latitude: destinationLocation.latitude,
          destination_longitude: destinationLocation.longitude,
          destination_address: destinationLocation.address,
          service_type: serviceType,
          estimated_fare: estimatedFare,
          notes: notes || null
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Ride Request Created",
        description: "Looking for nearby drivers..."
      });

      // Reset form
      setPickupLocation(null);
      setDestinationLocation(null);
      setPickupAddress('');
      setDestinationAddress('');
      setNotes('');
      
      onRequestCreated?.();
    } catch (error: any) {
      toast({
        title: "Request Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const estimatedFare = calculateEstimatedFare();

  return (
    <div className="space-y-6">
      <Card className="card-enhanced">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <Car className="h-6 w-6 text-primary" />
            </div>
            Request a Ride
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Service Type Selection */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Choose Service Type</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={serviceType === 'car' ? 'default' : 'outline'}
                  className={`h-24 flex flex-col gap-3 transition-bounce ${
                    serviceType === 'car' ? 'btn-gradient' : 'hover-lift'
                  }`}
                  onClick={() => setServiceType('car')}
                >
                  <Car className="h-8 w-8" />
                  <div className="text-center">
                    <div className="font-semibold">Car Service</div>
                    <Badge variant="secondary" className="text-xs mt-1">KSh 2,500/km</Badge>
                  </div>
                </Button>
                <Button
                  type="button"
                  variant={serviceType === 'motorcycle' ? 'default' : 'outline'}
                  className={`h-24 flex flex-col gap-3 transition-bounce ${
                    serviceType === 'motorcycle' ? 'btn-gradient' : 'hover-lift'
                  }`}
                  onClick={() => setServiceType('motorcycle')}
                >
                  <Bike className="h-8 w-8" />
                  <div className="text-center">
                    <div className="font-semibold">Boda-Boda</div>
                    <Badge variant="secondary" className="text-xs mt-1">KSh 1,500/km</Badge>
                  </div>
                </Button>
              </div>
            </div>

            {/* Pickup Location */}
            <div className="space-y-3">
              <Label>Pickup Location</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter pickup address"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handlePickupAddressSet()}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={useCurrentLocation}
                  disabled={locationLoading}
                >
                  <Navigation className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePickupAddressSet}
                  disabled={!pickupAddress.trim()}
                >
                  Set
                </Button>
              </div>
              {pickupLocation && (
                <Badge variant="outline" className="w-fit">
                  <MapPin className="h-3 w-3 mr-1" />
                  Pickup: {pickupLocation.address}
                </Badge>
              )}
            </div>

            {/* Destination Location */}
            <div className="space-y-3">
              <Label>Destination</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter destination address"
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleDestinationAddressSet()}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDestinationAddressSet}
                  disabled={!destinationAddress.trim()}
                >
                  Set
                </Button>
              </div>
              {destinationLocation && (
                <Badge variant="outline" className="w-fit">
                  <MapPin className="h-3 w-3 mr-1" />
                  Destination: {destinationLocation.address}
                </Badge>
              )}
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any special instructions for the driver..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Estimated Fare */}
            {estimatedFare > 0 && (
              <Card className="gradient-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-3 text-lg font-medium">
                      <div className="p-2 rounded-lg bg-accent/10">
                        <DollarSign className="h-5 w-5 text-accent" />
                      </div>
                      Estimated Fare
                    </span>
                    <span className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
                      {formatCurrencyDisplay(estimatedFare)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-semibold btn-gradient"
              disabled={isSubmitting || !pickupLocation || !destinationLocation}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                  Creating Request...
                </div>
              ) : (
                'Request Ride'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Live Map for Nearby Drivers */}
      <Card className="card-enhanced">
        <CardContent className="p-6">
          <div className="space-y-4">
            <Label className="text-xl font-bold">
              Nearby Drivers
            </Label>
            <UberLiveMap
              showDrivers={true}
              trackingMode="rider"
              className="h-[450px] rounded-lg shadow-card"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RideRequestForm;