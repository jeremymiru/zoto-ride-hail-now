import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Car, Bike, Clock, Navigation, Star, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import MapBox from '@/components/Map/MapBox';

interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

interface Driver {
  id: string;
  name: string;
  rating: number;
  vehicleType: 'car' | 'motorcycle';
  plateNumber: string;
  eta: number;
  distance: string;
  photo?: string;
}

type BookingStep = 'location' | 'service' | 'confirmation' | 'searching' | 'matched' | 'tracking';

const UberBookingFlow = () => {
  const { user } = useAuth();
  const { latitude, longitude } = useGeolocation();
  
  const [currentStep, setCurrentStep] = useState<BookingStep>('location');
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<Location | null>(null);
  const [pickupAddress, setPickupAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [serviceType, setServiceType] = useState<'car' | 'motorcycle'>('car');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [rideId, setRideId] = useState<string | null>(null);
  const [estimatedFare, setEstimatedFare] = useState(0);

  // Mock nearby drivers
  const [nearbyDrivers] = useState<Driver[]>([
    {
      id: '1',
      name: 'John Kasozi',
      rating: 4.8,
      vehicleType: 'car',
      plateNumber: 'UBF 123K',
      eta: 3,
      distance: '0.8 km away',
    },
    {
      id: '2', 
      name: 'Sarah Nambi',
      rating: 4.9,
      vehicleType: 'motorcycle',
      plateNumber: 'UBJ 456M',
      eta: 2,
      distance: '0.5 km away',
    },
    {
      id: '3',
      name: 'Peter Mukasa',
      rating: 4.7,
      vehicleType: 'car', 
      plateNumber: 'UAH 789L',
      eta: 5,
      distance: '1.2 km away',
    }
  ]);

  useEffect(() => {
    if (latitude && longitude && !pickupLocation) {
      setPickupLocation({
        latitude,
        longitude,
        address: 'Current Location'
      });
      setPickupAddress('Current Location');
    }
  }, [latitude, longitude, pickupLocation]);

  const calculateEstimatedFare = () => {
    if (!pickupLocation || !destinationLocation) return 0;
    
    const R = 6371;
    const dLat = (destinationLocation.latitude - pickupLocation.latitude) * Math.PI / 180;
    const dLon = (destinationLocation.longitude - pickupLocation.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(pickupLocation.latitude * Math.PI / 180) * Math.cos(destinationLocation.latitude * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    const baseFare = serviceType === 'car' ? 5000 : 3000;
    const perKmRate = serviceType === 'car' ? 2500 : 1500;
    
    return baseFare + (distance * perKmRate);
  };

  useEffect(() => {
    setEstimatedFare(calculateEstimatedFare());
  }, [pickupLocation, destinationLocation, serviceType]);

  const handleLocationSelect = (location: { latitude: number; longitude: number; address?: string }) => {
    const locationData = {
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address || `Location (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})`
    };

    if (!destinationLocation) {
      setDestinationLocation(locationData);
      setDestinationAddress(locationData.address);
      setCurrentStep('service');
    }
  };

  const handleConfirmRide = async () => {
    if (!user || !pickupLocation || !destinationLocation) return;

    setCurrentStep('searching');
    
    try {
      // Simulate driver search
      setTimeout(() => {
        const availableDrivers = nearbyDrivers.filter(d => d.vehicleType === serviceType);
        if (availableDrivers.length > 0) {
          setSelectedDriver(availableDrivers[0]);
          setCurrentStep('matched');
        }
      }, 3000);

      // Create ride request in database
      const { data, error } = await supabase
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
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      setRideId(data.id);
      
    } catch (error: any) {
      toast({
        title: "Request Failed",
        description: error.message,
        variant: "destructive"
      });
      setCurrentStep('service');
    }
  };

  const handleAcceptDriver = () => {
    setCurrentStep('tracking');
    toast({
      title: "Driver Confirmed",
      description: `${selectedDriver?.name} is on the way!`
    });
  };

  const resetBooking = () => {
    setCurrentStep('location');
    setPickupLocation(null);
    setDestinationLocation(null);
    setPickupAddress('');
    setDestinationAddress('');
    setSelectedDriver(null);
    setRideId(null);
  };

  // Location Selection Step
  if (currentStep === 'location') {
    return (
      <div className="space-y-4">
        <Card className="card-enhanced">
          <CardContent className="p-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Where to?</h2>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <Input
                    placeholder="Pickup location"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    className="border-none bg-transparent text-lg"
                  />
                </div>
                
                <div className="flex items-center gap-3 p-3 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Where to?"
                    value={destinationAddress}
                    onChange={(e) => setDestinationAddress(e.target.value)}
                    className="border-none bg-transparent text-lg"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardContent className="p-4">
            <MapBox
              onLocationSelect={handleLocationSelect}
              pickupLocation={pickupLocation || undefined}
              className="h-[400px] rounded-lg"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Service Selection Step
  if (currentStep === 'service') {
    return (
      <div className="space-y-4">
        <Card className="card-enhanced">
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <Button
                  variant="ghost"
                  onClick={() => setCurrentStep('location')}
                  className="p-0 h-auto text-primary hover:bg-transparent"
                >
                  ← Back
                </Button>
                <h2 className="text-2xl font-bold mt-4">Choose a ride</h2>
              </div>

              <div className="space-y-3">
                {[
                  {
                    type: 'car' as const,
                    name: 'Zoto Car',
                    description: 'Comfortable rides for 1-4 people',
                    icon: Car,
                    time: '3-5 min',
                    price: Math.floor(estimatedFare)
                  },
                  {
                    type: 'motorcycle' as const,
                    name: 'Zoto Boda',
                    description: 'Quick rides, beat the traffic',
                    icon: Bike,
                    time: '2-3 min', 
                    price: Math.floor(estimatedFare * 0.6)
                  }
                ].map((service) => (
                  <Button
                    key={service.type}
                    variant={serviceType === service.type ? 'default' : 'outline'}
                    className={`w-full h-20 p-4 justify-between ${
                      serviceType === service.type ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setServiceType(service.type)}
                  >
                    <div className="flex items-center gap-4">
                      <service.icon className="h-8 w-8" />
                      <div className="text-left">
                        <div className="font-semibold">{service.name}</div>
                        <div className="text-sm text-muted-foreground">{service.description}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">UGX {service.price.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">{service.time}</div>
                    </div>
                  </Button>
                ))}
              </div>

              <Button 
                onClick={() => setCurrentStep('confirmation')}
                className="w-full h-12 text-lg font-semibold btn-gradient"
              >
                Choose {serviceType === 'car' ? 'Zoto Car' : 'Zoto Boda'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Confirmation Step
  if (currentStep === 'confirmation') {
    return (
      <div className="space-y-4">
        <Card className="card-enhanced">
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <Button
                  variant="ghost"
                  onClick={() => setCurrentStep('service')}
                  className="p-0 h-auto text-primary hover:bg-transparent"
                >
                  ← Back
                </Button>
                <h2 className="text-2xl font-bold mt-4">Confirm your ride</h2>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 rounded-full bg-primary mt-2"></div>
                    <div>
                      <div className="font-medium">Pickup</div>
                      <div className="text-muted-foreground">{pickupLocation?.address}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-destructive mt-1" />
                    <div>
                      <div className="font-medium">Destination</div>
                      <div className="text-muted-foreground">{destinationLocation?.address}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {serviceType === 'car' ? <Car className="h-6 w-6" /> : <Bike className="h-6 w-6" />}
                    <div>
                      <div className="font-semibold">{serviceType === 'car' ? 'Zoto Car' : 'Zoto Boda'}</div>
                      <div className="text-sm text-muted-foreground">2-4 min away</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">UGX {estimatedFare.toFixed(0)}</div>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleConfirmRide}
                className="w-full h-12 text-lg font-semibold btn-gradient"
              >
                Confirm Ride
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Searching for Driver
  if (currentStep === 'searching') {
    return (
      <div className="space-y-4">
        <Card className="card-enhanced">
          <CardContent className="p-6 text-center">
            <div className="space-y-6">
              <div className="animate-pulse-glow">
                <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <Car className="h-10 w-10 text-primary animate-bounce" />
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold">Finding your driver</h2>
                <p className="text-muted-foreground mt-2">
                  We're matching you with nearby drivers...
                </p>
              </div>

              <div className="space-y-2">
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full animate-[loading_2s_ease-in-out_infinite]"></div>
                </div>
                <p className="text-sm text-muted-foreground">This usually takes less than a minute</p>
              </div>

              <Button 
                variant="outline"
                onClick={resetBooking}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Driver Matched
  if (currentStep === 'matched' && selectedDriver) {
    return (
      <div className="space-y-4">
        <Card className="card-enhanced">
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-4">
                  <Clock className="h-8 w-8 text-success" />
                </div>
                <h2 className="text-2xl font-bold">Driver found!</h2>
                <p className="text-muted-foreground">Your driver is on the way</p>
              </div>

              <div className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{selectedDriver.name}</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Star className="h-4 w-4 fill-current text-yellow-500" />
                      {selectedDriver.rating} • {selectedDriver.plateNumber}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{selectedDriver.eta} min</div>
                    <div className="text-sm text-muted-foreground">{selectedDriver.distance}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {selectedDriver.vehicleType === 'car' ? 
                    <Car className="h-5 w-5" /> : 
                    <Bike className="h-5 w-5" />
                  }
                  <span className="text-sm">
                    {selectedDriver.vehicleType === 'car' ? 'Toyota Wish' : 'Bajaj Boxer'}
                  </span>
                  <Badge variant="outline">{selectedDriver.plateNumber}</Badge>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={resetBooking}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAcceptDriver}
                  className="flex-1 btn-gradient"
                >
                  Accept Driver
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tracking Step
  if (currentStep === 'tracking' && selectedDriver) {
    return (
      <div className="space-y-4">
        <Card className="card-enhanced">
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="text-center">
                <Badge className="bg-success text-success-foreground">
                  <Navigation className="h-4 w-4 mr-2" />
                  Driver is on the way
                </Badge>
                <h2 className="text-xl font-bold mt-4">{selectedDriver.name} is arriving in {selectedDriver.eta} min</h2>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold">{selectedDriver.name}</div>
                      <div className="text-sm text-muted-foreground">{selectedDriver.plateNumber}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-current text-yellow-500" />
                    <span className="font-medium">{selectedDriver.rating}</span>
                  </div>
                </div>
                
                <div className="text-center py-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">{selectedDriver.eta} min</div>
                  <div className="text-sm text-muted-foreground">estimated arrival</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <div>
                    <div className="font-medium">Pickup</div>
                    <div className="text-sm text-muted-foreground">{pickupLocation?.address}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <MapPin className="w-5 h-5 text-destructive" />
                  <div>
                    <div className="font-medium">Destination</div>
                    <div className="text-sm text-muted-foreground">{destinationLocation?.address}</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1">
                  Call Driver
                </Button>
                <Button variant="outline" className="flex-1">
                  Message
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardContent className="p-4">
            <MapBox
              pickupLocation={pickupLocation || undefined}
              destinationLocation={destinationLocation || undefined}
              driverLocations={[{
                id: selectedDriver.id,
                latitude: (pickupLocation?.latitude || 0) + 0.01,
                longitude: (pickupLocation?.longitude || 0) + 0.01,
                vehicleType: selectedDriver.vehicleType
              }]}
              className="h-[300px] rounded-lg"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default UberBookingFlow;