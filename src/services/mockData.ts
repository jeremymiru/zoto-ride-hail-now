// Mock data service for live tracking demo
import { supabase } from '@/integrations/supabase/client';

export interface MockDriver {
  id: string;
  full_name: string;
  phone: string;
  rating: number;
  vehicle: {
    make: string;
    model: string;
    color: string;
    license_plate: string;
    vehicle_type: 'car' | 'boda';
  };
  location: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
  };
  status: 'online' | 'busy' | 'offline';
}

export interface MockActiveRide {
  id: string;
  status: 'waiting' | 'picked_up' | 'in_progress' | 'completed' | 'accepted' | 'cancelled';
  pickup_time?: string;
  start_time?: string;
  end_time?: string;
  actual_fare?: number;
  ride_requests: {
    pickup_address: string;
    destination_address: string;
    pickup_latitude: number;
    pickup_longitude: number;
    destination_latitude: number;
    destination_longitude: number;
    service_type: string;
    estimated_fare: number;
  };
  driver_profile?: {
    full_name: string;
    phone?: string;
    rating?: number;
  };
  vehicle?: {
    make: string;
    model: string;
    color?: string;
    license_plate: string;
  };
}

// Kampala coordinates for realistic demo
const KAMPALA_CENTER = { lat: 0.3476, lng: 32.5825 };

export const mockDrivers: MockDriver[] = [
  {
    id: 'driver-1',
    full_name: 'Samuel Mukasa',
    phone: '+256701234567',
    rating: 4.8,
    vehicle: {
      make: 'Toyota',
      model: 'Corolla',
      color: 'White',
      license_plate: 'UAJ 123D',
      vehicle_type: 'car'
    },
    location: {
      latitude: KAMPALA_CENTER.lat + 0.01,
      longitude: KAMPALA_CENTER.lng + 0.01,
      heading: 45,
      speed: 25
    },
    status: 'online'
  },
  {
    id: 'driver-2',
    full_name: 'Grace Nakato',
    phone: '+256702345678',
    rating: 4.9,
    vehicle: {
      make: 'Honda',
      model: 'Civic',
      color: 'Silver',
      license_plate: 'UAH 456E',
      vehicle_type: 'car'
    },
    location: {
      latitude: KAMPALA_CENTER.lat - 0.015,
      longitude: KAMPALA_CENTER.lng + 0.02,
      heading: 180,
      speed: 30
    },
    status: 'online'
  },
  {
    id: 'driver-3',
    full_name: 'James Ssebunya',
    phone: '+256703456789',
    rating: 4.7,
    vehicle: {
      make: 'Yamaha',
      model: 'FZ',
      color: 'Red',
      license_plate: 'UBF 789G',
      vehicle_type: 'boda'
    },
    location: {
      latitude: KAMPALA_CENTER.lat + 0.02,
      longitude: KAMPALA_CENTER.lng - 0.01,
      heading: 270,
      speed: 40
    },
    status: 'online'
  },
  {
    id: 'driver-4',
    full_name: 'Mary Namugga',
    phone: '+256704567890',
    rating: 4.6,
    vehicle: {
      make: 'Bajaj',
      model: 'Boxer',
      color: 'Blue',
      license_plate: 'UBH 012J',
      vehicle_type: 'boda'
    },
    location: {
      latitude: KAMPALA_CENTER.lat - 0.02,
      longitude: KAMPALA_CENTER.lng - 0.015,
      heading: 90,
      speed: 35
    },
    status: 'online'
  },
  {
    id: 'driver-5',
    full_name: 'Robert Kiwanuka',
    phone: '+256705678901',
    rating: 4.9,
    vehicle: {
      make: 'Nissan',
      model: 'Sunny',
      color: 'Black',
      license_plate: 'UAK 345F',
      vehicle_type: 'car'
    },
    location: {
      latitude: KAMPALA_CENTER.lat + 0.005,
      longitude: KAMPALA_CENTER.lng + 0.025,
      heading: 135,
      speed: 20
    },
    status: 'busy'
  }
];

export const mockActiveRide: MockActiveRide = {
  id: 'ride-demo-123',
  status: 'waiting',
  pickup_time: undefined,
  start_time: undefined,
  end_time: undefined,
  actual_fare: undefined,
  ride_requests: {
    pickup_address: 'Kampala City Centre, Kampala Road',
    destination_address: 'Makerere University, Kampala',
    pickup_latitude: 0.3136,
    pickup_longitude: 32.5811,
    destination_latitude: 0.3301,
    destination_longitude: 32.5696,
    service_type: 'car',
    estimated_fare: 15000
  },
  driver_profile: {
    full_name: 'Samuel Mukasa',
    phone: '+256701234567',
    rating: 4.8
  },
  vehicle: {
    make: 'Toyota',
    model: 'Corolla',
    color: 'White',
    license_plate: 'UAJ 123D'
  }
};

export class MockDataService {
  private static instance: MockDataService;
  private driverUpdateInterval: NodeJS.Timeout | null = null;
  private rideStatusInterval: NodeJS.Timeout | null = null;

  static getInstance(): MockDataService {
    if (!MockDataService.instance) {
      MockDataService.instance = new MockDataService();
    }
    return MockDataService.instance;
  }

  // Start mock data simulation
  startMockData(enableDrivers = true, enableActiveRide = false) {
    if (enableDrivers) {
      this.startDriverUpdates();
    }
    
    if (enableActiveRide) {
      this.startRideStatusUpdates();
    }
  }

  // Stop mock data simulation
  stopMockData() {
    if (this.driverUpdateInterval) {
      clearInterval(this.driverUpdateInterval);
      this.driverUpdateInterval = null;
    }
    
    if (this.rideStatusInterval) {
      clearInterval(this.rideStatusInterval);
      this.rideStatusInterval = null;
    }
  }

  // Simulate driver location updates
  private startDriverUpdates() {
    const updateDriverLocation = async (driver: MockDriver) => {
      // Simulate small movement
      const deltaLat = (Math.random() - 0.5) * 0.001; // Small random movement
      const deltaLng = (Math.random() - 0.5) * 0.001;
      
      driver.location.latitude += deltaLat;
      driver.location.longitude += deltaLng;
      driver.location.heading = Math.random() * 360;
      driver.location.speed = 20 + Math.random() * 30;

      // Update in Supabase
      const { error } = await supabase
        .from('live_locations')
        .upsert({
          user_id: driver.id,
          latitude: driver.location.latitude,
          longitude: driver.location.longitude,
          heading: driver.location.heading,
          speed: driver.location.speed,
          accuracy: 5,
          timestamp: new Date().toISOString(),
          user_type: 'driver',
          vehicle_type: driver.vehicle.vehicle_type,
          status: driver.status,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) {
        console.warn('Mock data update failed:', error);
      }
    };

    // Update all drivers every 3 seconds
    this.driverUpdateInterval = setInterval(() => {
      mockDrivers.forEach(driver => {
        if (driver.status === 'online') {
          updateDriverLocation(driver);
        }
      });
    }, 3000);

    // Initial update
    mockDrivers.forEach(driver => {
      if (driver.status === 'online') {
        updateDriverLocation(driver);
      }
    });
  }

  // Simulate ride status progression
  private startRideStatusUpdates() {
    let currentStatus = 0;
    const statuses = ['waiting', 'picked_up', 'in_progress', 'completed'];
    const statusTimes = [5000, 8000, 15000, 3000]; // Time to spend in each status

    const updateRideStatus = () => {
      if (currentStatus >= statuses.length) {
        if (this.rideStatusInterval) {
          clearInterval(this.rideStatusInterval);
          this.rideStatusInterval = null;
        }
        return;
      }

      const status = statuses[currentStatus];
      console.log(`Mock ride status updated to: ${status}`);
      
      // In a real implementation, this would update the rides table
      // For now, we'll just log the status changes
      currentStatus++;
      
      if (currentStatus < statuses.length) {
        setTimeout(updateRideStatus, statusTimes[currentStatus - 1]);
      }
    };

    // Start the status progression
    setTimeout(updateRideStatus, 2000);
  }

  // Get mock nearby drivers data
  getMockDrivers(): MockDriver[] {
    return mockDrivers.filter(driver => driver.status === 'online');
  }

  // Get mock active ride data
  getMockActiveRide(): MockActiveRide {
    return mockActiveRide;
  }

  // Update mock ride status manually
  updateMockRideStatus(status: MockActiveRide['status']) {
    mockActiveRide.status = status;
    
    switch (status) {
      case 'picked_up':
        mockActiveRide.pickup_time = new Date().toISOString();
        break;
      case 'in_progress':
        mockActiveRide.start_time = new Date().toISOString();
        break;
      case 'completed':
        mockActiveRide.end_time = new Date().toISOString();
        mockActiveRide.actual_fare = mockActiveRide.ride_requests.estimated_fare + Math.floor(Math.random() * 2000);
        break;
    }
    
    console.log(`Mock ride status manually updated to: ${status}`);
  }
}

// Export singleton instance
export const mockDataService = MockDataService.getInstance();