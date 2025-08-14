
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

const Dashboard = () => {
  const { user, profile, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'payments' | 'tracking' | 'testing'>('dashboard');

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

  // Admin can access testing dashboard
  if (profile?.role === 'admin' && currentView === 'testing') {
    return (
      <Layout>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button 
              variant={currentView === 'dashboard' ? 'default' : 'outline'}
              onClick={() => setCurrentView('dashboard')}
            >
              Dashboard
            </Button>
            <Button 
              variant={currentView === 'testing' ? 'default' : 'outline'}
              onClick={() => setCurrentView('testing')}
            >
              Testing
            </Button>
          </div>
          <TestingDashboard />
        </div>
      </Layout>
    );
  }

  // Payment view for all users
  if (currentView === 'payments') {
    return (
      <Layout>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button 
              variant={currentView === 'dashboard' ? 'default' : 'outline'}
              onClick={() => setCurrentView('dashboard')}
            >
              Dashboard
            </Button>
            <Button 
              variant={currentView === 'payments' ? 'default' : 'outline'}
              onClick={() => setCurrentView('payments')}
            >
              Payments
            </Button>
            <Button 
              variant={currentView === 'tracking' ? 'default' : 'outline'}
              onClick={() => setCurrentView('tracking')}
            >
              Live Tracking
            </Button>
            {profile?.role === 'admin' && (
              <Button 
                variant={currentView === 'testing' ? 'default' : 'outline'}
                onClick={() => setCurrentView('testing')}
              >
                Testing
              </Button>
            )}
          </div>
          <PaymentReporting />
        </div>
      </Layout>
    );
  }

  // Tracking view for all users
  if (currentView === 'tracking') {
    return (
      <Layout>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button 
              variant={currentView === 'dashboard' ? 'default' : 'outline'}
              onClick={() => setCurrentView('dashboard')}
            >
              Dashboard
            </Button>
            <Button 
              variant={currentView === 'payments' ? 'default' : 'outline'}
              onClick={() => setCurrentView('payments')}
            >
              Payments
            </Button>
            <Button 
              variant={currentView === 'tracking' ? 'default' : 'outline'}
              onClick={() => setCurrentView('tracking')}
            >
              Live Tracking
            </Button>
            {profile?.role === 'admin' && (
              <Button 
                variant={currentView === 'testing' ? 'default' : 'outline'}
                onClick={() => setCurrentView('testing')}
              >
                Testing
              </Button>
            )}
          </div>
          <RiderNavigation />
        </div>
      </Layout>
    );
  }

  // Role-based dashboard rendering with navigation
  if (profile?.role === 'driver' || profile?.role === 'boda_boda') {
    return (
      <Layout>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button 
              variant={currentView === 'dashboard' ? 'default' : 'outline'}
              onClick={() => setCurrentView('dashboard')}
            >
              Dashboard
            </Button>
            <Button 
              variant={currentView === 'payments' ? 'default' : 'outline'}
              onClick={() => setCurrentView('payments')}
            >
              Earnings
            </Button>
            <Button 
              variant={currentView === 'tracking' ? 'default' : 'outline'}
              onClick={() => setCurrentView('tracking')}
            >
              Live Tracking
            </Button>
          </div>
          <DriverDashboard />
        </div>
      </Layout>
    );
  }

  if (profile?.role === 'admin') {
    return (
      <Layout>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button 
              variant={currentView === 'dashboard' ? 'default' : 'outline'}
              onClick={() => setCurrentView('dashboard')}
            >
              Dashboard
            </Button>
            <Button 
              variant={currentView === 'payments' ? 'default' : 'outline'}
              onClick={() => setCurrentView('payments')}
            >
              Payments
            </Button>
            <Button 
              variant={currentView === 'tracking' ? 'default' : 'outline'}
              onClick={() => setCurrentView('tracking')}
            >
              Live Tracking
            </Button>
            <Button 
              variant={currentView === 'testing' ? 'default' : 'outline'}
              onClick={() => setCurrentView('testing')}
            >
              Testing
            </Button>
          </div>
          <AdminDashboard />
        </div>
      </Layout>
    );
  }

  // Default passenger dashboard with Uber-like experience
  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button 
            variant={currentView === 'dashboard' ? 'default' : 'outline'}
            onClick={() => setCurrentView('dashboard')}
          >
            Dashboard
          </Button>
          <Button 
            variant={currentView === 'payments' ? 'default' : 'outline'}
            onClick={() => setCurrentView('payments')}
          >
            Payments
          </Button>
          <Button 
            variant={currentView === 'tracking' ? 'default' : 'outline'}
            onClick={() => setCurrentView('tracking')}
          >
            Live Tracking
          </Button>
        </div>
        <UberDashboard />
      </div>
    </Layout>
  );
};

export default Dashboard;
