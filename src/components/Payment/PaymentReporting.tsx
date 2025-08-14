
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Download,
  Receipt,
  CreditCard,
  Wallet,
  Star,
  MapPin,
  Clock,
  Car,
  Bike,
  RotateCcw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface RidePayment {
  id: string;
  actual_fare: number;
  created_at: string;
  end_time: string;
  passenger_rating?: number;
  driver_rating?: number;
  ride_requests: {
    pickup_address: string;
    destination_address: string;
    service_type: string;
    estimated_fare: number;
  };
  profiles?: {
    full_name: string;
  };
}

interface PaymentStats {
  totalSpent: number;
  totalTrips: number;
  averageFare: number;
  thisMonth: number;
  savings: number;
}

const PaymentReporting = () => {
  const { user, profile } = useAuth();
  const [payments, setPayments] = useState<RidePayment[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalSpent: 0,
    totalTrips: 0,
    averageFare: 0,
    thisMonth: 0,
    savings: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    if (user) {
      fetchPaymentData();
    }
  }, [user, selectedPeriod]);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on selected period
      const now = new Date();
      const startDate = new Date();
      
      switch (selectedPeriod) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Fetch completed rides with payment info
      const { data: ridesData, error: ridesError } = await supabase
        .from('rides')
        .select(`
          id,
          actual_fare,
          created_at,
          end_time,
          passenger_rating,
          driver_rating,
          ride_requests!inner (
            user_id,
            pickup_address,
            destination_address,
            service_type,
            estimated_fare
          ),
          profiles!rides_driver_id_fkey (
            full_name
          )
        `)
        .eq('ride_requests.user_id', user!.id)
        .eq('status', 'completed')
        .not('actual_fare', 'is', null)
        .gte('end_time', startDate.toISOString())
        .order('end_time', { ascending: false });

      if (ridesError) throw ridesError;

      const ridesWithPayments = ridesData || [];
      setPayments(ridesWithPayments);

      // Calculate statistics
      const totalSpent = ridesWithPayments.reduce((sum, ride) => sum + (ride.actual_fare || 0), 0);
      const totalTrips = ridesWithPayments.length;
      const averageFare = totalTrips > 0 ? totalSpent / totalTrips : 0;
      
      // This month spending
      const thisMonthStart = new Date();
      thisMonthStart.setDate(1);
      thisMonthStart.setHours(0, 0, 0, 0);
      
      const thisMonthRides = ridesWithPayments.filter(ride => 
        new Date(ride.end_time) >= thisMonthStart
      );
      const thisMonth = thisMonthRides.reduce((sum, ride) => sum + (ride.actual_fare || 0), 0);
      
      // Calculate estimated savings compared to estimated fares
      const estimatedTotal = ridesWithPayments.reduce((sum, ride) => 
        sum + (ride.ride_requests.estimated_fare || 0), 0
      );
      const savings = estimatedTotal - totalSpent;

      setStats({
        totalSpent,
        totalTrips,
        averageFare,
        thisMonth,
        savings
      });

    } catch (error: any) {
      console.error('Failed to fetch payment data:', error);
      toast({
        title: "Error",
        description: "Failed to load payment data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'car': return <Car className="h-4 w-4" />;
      case 'motorcycle': return <Bike className="h-4 w-4" />;
      case 'disposable_driver': return <RotateCcw className="h-4 w-4" />;
      default: return <Car className="h-4 w-4" />;
    }
  };

  const getServiceName = (serviceType: string) => {
    switch (serviceType) {
      case 'car': return 'Zoto Car';
      case 'motorcycle': return 'Zoto Boda';
      case 'disposable_driver': return 'Disposable Driver';
      default: return 'Ride';
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Date', 'Service', 'Pickup', 'Destination', 'Fare', 'Driver', 'Rating'].join(','),
      ...payments.map(payment => [
        new Date(payment.end_time).toLocaleDateString(),
        getServiceName(payment.ride_requests.service_type),
        `"${payment.ride_requests.pickup_address}"`,
        `"${payment.ride_requests.destination_address}"`,
        payment.actual_fare,
        payment.profiles?.full_name || 'Driver',
        payment.passenger_rating || 'Not rated'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zoto-payments-${selectedPeriod}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Payment data has been downloaded as CSV"
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse-glow">
          <DollarSign className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="gradient-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Payment Center</h1>
              <p className="text-white/80 text-lg">Track your ride expenses and payments</p>
            </div>
            <Button 
              onClick={exportData}
              variant="secondary"
              className="bg-white/20 text-white hover:bg-white/30"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Period Selector */}
      <div className="flex gap-2">
        {(['week', 'month', 'year'] as const).map((period) => (
          <Button
            key={period}
            variant={selectedPeriod === period ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod(period)}
            className="capitalize"
          >
            Last {period}
          </Button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-enhanced">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-3xl font-bold">UGX {stats.totalSpent.toFixed(0)}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 text-sm">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-success">Last {selectedPeriod}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Trips</p>
                <p className="text-3xl font-bold">{stats.totalTrips}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Receipt className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Completed rides</span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Fare</p>
                <p className="text-3xl font-bold">UGX {stats.averageFare.toFixed(0)}</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-500/10">
                <Wallet className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Per trip</span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-3xl font-bold">UGX {stats.thisMonth.toFixed(0)}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10">
                <CreditCard className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Current month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card className="card-enhanced">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No payments found</p>
              <p className="text-muted-foreground">Complete some rides to see payment history</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="p-2 rounded-lg bg-success/10">
                    {getServiceIcon(payment.ride_requests.service_type)}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">
                        {getServiceName(payment.ride_requests.service_type)}
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">UGX {payment.actual_fare.toFixed(0)}</div>
                        <Badge variant="outline" className="text-xs">
                          Completed
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                        <span className="truncate">{payment.ride_requests.pickup_address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 text-destructive" />
                        <span className="truncate">{payment.ride_requests.destination_address}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {new Date(payment.end_time).toLocaleDateString()} at {new Date(payment.end_time).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      
                      {payment.passenger_rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-current text-yellow-500" />
                          <span className="font-medium">{payment.passenger_rating}</span>
                        </div>
                      )}
                    </div>

                    {payment.profiles?.full_name && (
                      <div className="text-sm text-muted-foreground">
                        Driver: {payment.profiles.full_name}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentReporting;
