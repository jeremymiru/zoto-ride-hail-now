import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/Layout';
import DriverDashboard from '@/components/Driver/DriverDashboard';
import AdminDashboard from '@/components/Admin/AdminDashboard';
import UberDashboard from '@/components/UberFlow/UberDashboard';
import { Car } from 'lucide-react';

const Dashboard = () => {
  const { user, profile, loading } = useAuth();

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


  // Role-based dashboard rendering
  if (profile?.role === 'driver' || profile?.role === 'boda_boda') {
    return (
      <Layout>
        <DriverDashboard />
      </Layout>
    );
  }

  if (profile?.role === 'admin') {
    return (
      <Layout>
        <AdminDashboard />
      </Layout>
    );
  }

  // Default passenger dashboard with Uber-like experience
  return (
    <Layout>
      <UberDashboard />
    </Layout>
  );
};

export default Dashboard;