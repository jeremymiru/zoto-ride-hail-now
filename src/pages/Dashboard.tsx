import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/Layout';
import DriverDashboard from '@/components/Driver/DriverDashboard';
import AdminDashboard from '@/components/Admin/AdminDashboard';
import UberDashboard from '@/components/UberFlow/UberDashboard';
import TestingDashboard from '@/components/Admin/TestingDashboard';
import PaymentReporting from '@/components/Payment/PaymentReporting';
import RiderNavigation from '@/components/RideTracking/RiderNavigation';
import { Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

type ViewType = 'dashboard' | 'payments' | 'tracking' | 'testing';

const Dashboard = () => {
  const { user, profile, loading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');

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

  // Navigation buttons component
  const renderNavigation = (showTesting = false) => (
    <div className="flex gap-2">
      <Button 
        variant={(currentView as ViewType) === 'dashboard' ? 'default' : 'outline'}
        onClick={() => setCurrentView('dashboard')}
      >
        Dashboard
      </Button>
      <Button 
        variant={(currentView as ViewType) === 'payments' ? 'default' : 'outline'}
        onClick={() => setCurrentView('payments')}
      >
        {profile?.role === 'driver' || profile?.role === 'boda_boda' ? 'Earnings' : 'Payments'}
      </Button>
      <Button 
        variant={(currentView as ViewType) === 'tracking' ? 'default' : 'outline'}
        onClick={() => setCurrentView('tracking')}
      >
        Live Tracking
      </Button>
      {showTesting && (
        <Button 
          variant={(currentView as ViewType) === 'testing' ? 'default' : 'outline'}
          onClick={() => setCurrentView('testing')}
        >
          Testing
        </Button>
      )}
    </div>
  );

  // Content based on current view
  const renderContent = () => {
    switch (currentView) {
      case 'payments':
        return <PaymentReporting />;
      case 'tracking':
        return <RiderNavigation />;
      case 'testing':
        return profile?.role === 'admin' ? <TestingDashboard /> : null;
      case 'dashboard':
      default:
        if (profile?.role === 'driver' || profile?.role === 'boda_boda') {
          return <DriverDashboard />;
        } else if (profile?.role === 'admin') {
          return <AdminDashboard />;
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