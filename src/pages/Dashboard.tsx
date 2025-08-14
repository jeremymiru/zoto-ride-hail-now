import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Car, DollarSign, Navigation, Settings, TestTube, Map } from 'lucide-react';
import { Navigate } from 'react-router-dom';

// Import dashboard components
import AdminDashboard from '@/components/Admin/AdminDashboard';
import TestingDashboard from '@/components/Admin/TestingDashboard';
import DriverDashboard from '@/components/Driver/DriverDashboard';
import UberDashboard from '@/components/UberFlow/UberDashboard';
import PaymentReporting from '@/components/Payment/PaymentReporting';
import RiderNavigation from '@/components/RideTracking/RiderNavigation';
import UberLiveMap from '@/components/Map/UberLiveMap';
import GoogleMapsSetup from '@/components/Map/GoogleMapsSetup';

type ViewType = 'dashboard' | 'payments' | 'tracking' | 'testing' | 'map';

const Dashboard = () => {
  const { user, profile, loading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [hasGoogleMapsKey, setHasGoogleMapsKey] = useState(() => 
    Boolean(localStorage.getItem('google_maps_api_key'))
  );

  // Redirect if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Show loading state
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse-glow">
            <Car className="h-12 w-12 text-primary" />
          </div>
        </div>
      </Layout>
    );
  }

  const renderNavigation = (showTesting: boolean = false) => (
    <div className="flex flex-wrap gap-2 mb-6">
      <Button
        variant={currentView === 'dashboard' ? 'default' : 'outline'}
        onClick={() => setCurrentView('dashboard')}
        className="flex items-center gap-2"
      >
        <Car className="h-4 w-4" />
        Dashboard
      </Button>
      
      <Button
        variant={currentView === 'payments' ? 'default' : 'outline'}
        onClick={() => setCurrentView('payments')}
        className="flex items-center gap-2"
      >
        <DollarSign className="h-4 w-4" />
        {profile?.role === 'driver' ? 'Earnings' : 'Payments'}
      </Button>
      
      <Button
        variant={currentView === 'tracking' ? 'default' : 'outline'}
        onClick={() => setCurrentView('tracking')}
        className="flex items-center gap-2"
      >
        <Navigation className="h-4 w-4" />
        Live Tracking
      </Button>

      <Button
        variant={currentView === 'map' ? 'default' : 'outline'}
        onClick={() => setCurrentView('map')}
        className="flex items-center gap-2"
      >
        <Map className="h-4 w-4" />
        Real-Time Map
      </Button>
      
      {showTesting && (
        <Button
          variant={currentView === 'testing' ? 'default' : 'outline'}
          onClick={() => setCurrentView('testing')}
          className="flex items-center gap-2"
        >
          <TestTube className="h-4 w-4" />
          Testing
        </Button>
      )}
    </div>
  );

  const renderContent = () => {
    // Handle Google Maps setup for map view
    if (currentView === 'map' && !hasGoogleMapsKey) {
      return (
        <GoogleMapsSetup 
          onApiKeySet={(apiKey: string) => {
            setHasGoogleMapsKey(true);
            // Force re-render of map component
            setCurrentView('dashboard');
            setTimeout(() => setCurrentView('map'), 100);
          }} 
        />
      );
    }

    switch (currentView) {
      case 'payments':
        return <PaymentReporting />;
      case 'tracking':
        return <RiderNavigation />;
      case 'map':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Real-Time Map</h2>
              <p className="text-muted-foreground mb-6">
                Live tracking with driver locations and route optimization - just like Uber!
              </p>
            </div>
            <UberLiveMap 
              showDrivers={true}
              trackingMode={profile?.role === 'driver' ? 'driver' : 'rider'}
            />
          </div>
        );
      case 'testing':
        if (profile?.role === 'admin') {
          return <TestingDashboard />;
        }
        return <div>Access denied</div>;
      case 'dashboard':
      default:
        if (profile?.role === 'admin') {
          return <AdminDashboard />;
        } else if (profile?.role === 'driver') {
          return <DriverDashboard />;
        } else {
          return <UberDashboard />;
        }
    }
  };

  // If admin trying to access testing when not on dashboard
  const showTesting = profile?.role === 'admin';

  return (
    <Layout>
      <div className="space-y-4">
        {renderNavigation(showTesting)}
        {renderContent()}
      </div>
    </Layout>
  );
};

export default Dashboard;