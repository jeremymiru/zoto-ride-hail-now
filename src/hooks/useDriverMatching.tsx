import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DriverLocation {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  created_at: string;
  profiles: {
    full_name: string;
    rating: number;
    role: string;
  };
  vehicles: {
    id: string;
    vehicle_type: string;
    make: string;
    model: string;
    is_active: boolean;
  }[];
}

interface MatchingRequest {
  id: string;
  pickup_latitude: number;
  pickup_longitude: number;
  service_type: string;
  estimated_fare: number;
}

export const useDriverMatching = () => {
  const [nearbyDrivers, setNearbyDrivers] = useState<DriverLocation[]>([]);
  const [isMatching, setIsMatching] = useState(false);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  };

  // Get nearby drivers for a specific location and service type
  const getNearbyDrivers = async (
    latitude: number, 
    longitude: number, 
    serviceType: string, 
    radiusKm: number = 10
  ): Promise<DriverLocation[]> => {
    try {
      // Get recent driver locations (within last 10 minutes)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      
      const { data: driverLocations, error } = await supabase
        .from('locations')
        .select(`
          *,
          profiles!locations_user_id_fkey (
            full_name,
            rating,
            role
          )
        `)
        .gte('created_at', tenMinutesAgo)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get vehicle information for each driver
      const driversWithVehicles = await Promise.all(
        (driverLocations || []).map(async (location) => {
          const { data: vehicles } = await supabase
            .from('vehicles')
            .select('*')
            .eq('driver_id', location.user_id)
            .eq('is_active', true)
            .eq('vehicle_type', serviceType === 'car' ? 'car' : 'motorcycle');

          return {
            ...location,
            vehicles: vehicles || []
          };
        })
      );

      // Filter drivers who have active vehicles and are within radius
      const validDrivers = driversWithVehicles
        .filter(driver => driver.vehicles.length > 0)
        .map(driver => ({
          ...driver,
          distance: calculateDistance(latitude, longitude, driver.latitude, driver.longitude)
        }))
        .filter(driver => driver.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance); // Sort by distance

      return validDrivers;
    } catch (error) {
      console.error('Error fetching nearby drivers:', error);
      return [];
    }
  };

  // Smart matching algorithm considering multiple factors
  const findBestMatch = async (request: MatchingRequest): Promise<DriverLocation | null> => {
    try {
      setIsMatching(true);

      const nearby = await getNearbyDrivers(
        request.pickup_latitude,
        request.pickup_longitude,
        request.service_type
      );

      if (nearby.length === 0) {
        return null;
      }

      // Advanced matching algorithm
      const scoredDrivers = nearby.map(driver => {
        const distance = calculateDistance(
          request.pickup_latitude,
          request.pickup_longitude,
          driver.latitude,
          driver.longitude
        );

        // Scoring factors (lower score is better)
        let score = 0;

        // Distance factor (30% weight) - closer is better
        score += distance * 0.3;

        // Rating factor (25% weight) - higher rating is better
        const ratingScore = (5.0 - driver.profiles.rating) * 0.25;
        score += ratingScore;

        // Freshness of location (20% weight) - more recent is better
        const locationAge = (Date.now() - new Date(driver.created_at).getTime()) / (1000 * 60); // minutes
        score += (locationAge / 10) * 0.2; // Normalize to 10 minutes

        // Availability factor (15% weight) - assume drivers are available if location is recent
        const availabilityScore = locationAge > 5 ? 0.15 : 0; // Penalize if location is older than 5 minutes
        score += availabilityScore;

        // Vehicle quality factor (10% weight) - newer vehicles preferred
        const vehicleScore = driver.vehicles.length > 1 ? -0.1 : 0; // Bonus for multiple vehicles
        score += vehicleScore;

        return {
          ...driver,
          score,
          distance
        };
      });

      // Sort by score (ascending - lower is better) and return best match
      const bestMatch = scoredDrivers.sort((a, b) => a.score - b.score)[0];
      
      return bestMatch;
    } catch (error) {
      console.error('Error finding best match:', error);
      return null;
    } finally {
      setIsMatching(false);
    }
  };

  // Notify driver about new ride request
  const notifyDriver = async (driverId: string, requestData: any) => {
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: driverId,
          title: 'New Ride Request',
          message: `New ${requestData.service_type} ride request from ${requestData.pickup_address}`,
          type: 'ride_request',
          data: {
            request_id: requestData.id,
            pickup_address: requestData.pickup_address,
            destination_address: requestData.destination_address,
            estimated_fare: requestData.estimated_fare,
            service_type: requestData.service_type
          }
        });
    } catch (error) {
      console.error('Error sending notification to driver:', error);
    }
  };

  // Auto-match ride request with best available driver
  const autoMatchRideRequest = async (requestId: string) => {
    try {
      // Get the ride request details
      const { data: request, error: requestError } = await supabase
        .from('ride_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError || !request) {
        throw new Error('Request not found');
      }

      // Find best matching driver
      const bestDriver = await findBestMatch({
        id: request.id,
        pickup_latitude: request.pickup_latitude,
        pickup_longitude: request.pickup_longitude,
        service_type: request.service_type,
        estimated_fare: request.estimated_fare
      });

      if (!bestDriver) {
        // No drivers available - notify user
        await supabase
          .from('notifications')
          .insert({
            user_id: request.user_id,
            title: 'No Drivers Available',
            message: 'No drivers are currently available in your area. We\'ll keep looking!',
            type: 'alert',
            data: { request_id: requestId }
          });
        
        return { success: false, message: 'No drivers available' };
      }

      // Calculate ETA based on distance (rough estimate)
      const distance = calculateDistance(
        request.pickup_latitude,
        request.pickup_longitude,
        bestDriver.latitude,
        bestDriver.longitude
      );
      const estimatedETA = Math.ceil(distance * 2); // Rough estimate: 2 minutes per km

      // Notify the best matched driver
      await notifyDriver(bestDriver.user_id, {
        ...request,
        eta: estimatedETA,
        distance: distance.toFixed(1)
      });

      // Update request with potential driver info (optional)
      await supabase
        .from('ride_requests')
        .update({ 
          notes: `Matched with driver (${distance.toFixed(1)}km away, ETA: ${estimatedETA}min)` 
        })
        .eq('id', requestId);

      return {
        success: true,
        driver: bestDriver,
        eta: estimatedETA,
        distance: distance.toFixed(1)
      };

    } catch (error) {
      console.error('Error in auto-matching:', error);
      return { success: false, message: 'Matching failed' };
    }
  };

  // Get ETA estimate for a route
  const getETAEstimate = (
    fromLat: number,
    fromLon: number,
    toLat: number,
    toLon: number,
    serviceType: string = 'car'
  ): number => {
    const distance = calculateDistance(fromLat, fromLon, toLat, toLon);
    
    // Different speed estimates based on service type and traffic conditions
    const avgSpeed = serviceType === 'motorcycle' ? 25 : 20; // km/h in city traffic
    const timeInHours = distance / avgSpeed;
    const timeInMinutes = Math.ceil(timeInHours * 60);
    
    // Add buffer time for pickup/dropoff
    return Math.max(timeInMinutes + 3, 5); // Minimum 5 minutes
  };

  return {
    nearbyDrivers,
    isMatching,
    getNearbyDrivers,
    findBestMatch,
    autoMatchRideRequest,
    getETAEstimate,
    calculateDistance
  };
};