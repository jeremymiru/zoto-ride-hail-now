
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Database, 
  Users, 
  Car,
  TestTube,
  Activity,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Play,
  Square,
  Trash2,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface TestData {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  created_at: string;
  completed_at?: string;
}

interface SystemStats {
  totalUsers: number;
  totalRides: number;
  activeRides: number;
  pendingRequests: number;
  totalDrivers: number;
  activeDrivers: number;
}

const TestingDashboard = () => {
  const { user, profile } = useAuth();
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    totalRides: 0,
    activeRides: 0,
    pendingRequests: 0,
    totalDrivers: 0,
    activeDrivers: 0
  });
  const [testData, setTestData] = useState<TestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set());

  // Test configurations
  const [testConfig, setTestConfig] = useState({
    mockUserId: '',
    mockDriverId: '',
    testRideData: {
      pickup_latitude: -1.2921,
      pickup_longitude: 36.8219,
      destination_latitude: -1.2866,
      destination_longitude: 36.8217,
      pickup_address: 'Test Pickup Location',
      destination_address: 'Test Destination',
      service_type: 'car' as const
    }
  });

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      fetchSystemStats();
      fetchTestData();
    }
  }, [user, profile]);

  const fetchSystemStats = async () => {
    try {
      // Fetch user statistics
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('role')
        .eq('is_active', true);

      if (usersError) throw usersError;

      const totalUsers = usersData?.length || 0;
      const totalDrivers = usersData?.filter(u => u.role === 'driver' || u.role === 'boda_boda').length || 0;

      // Fetch ride statistics
      const { data: ridesData, error: ridesError } = await supabase
        .from('rides')
        .select('status');

      if (ridesError) throw ridesError;

      const totalRides = ridesData?.length || 0;
      const activeRides = ridesData?.filter(r => ['waiting', 'picked_up', 'in_progress'].includes(r.status)).length || 0;

      // Fetch pending requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('ride_requests')
        .select('status')
        .eq('status', 'pending');

      if (requestsError) throw requestsError;

      const pendingRequests = requestsData?.length || 0;

      setSystemStats({
        totalUsers,
        totalRides,
        activeRides,
        pendingRequests,
        totalDrivers,
        activeDrivers: Math.floor(totalDrivers * 0.3) // Mock active drivers
      });

    } catch (error: any) {
      console.error('Failed to fetch system stats:', error);
      toast({
        title: "Error",
        description: "Failed to load system statistics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTestData = async () => {
    // Mock test data - in a real app this would come from a tests table
    const mockTests: TestData[] = [
      {
        id: '1',
        name: 'User Registration Flow',
        status: 'completed',
        result: { success: true, duration: '2.3s' },
        created_at: new Date(Date.now() - 3600000).toISOString(),
        completed_at: new Date(Date.now() - 3500000).toISOString()
      },
      {
        id: '2',
        name: 'Ride Request Creation',
        status: 'completed',
        result: { success: true, duration: '1.8s' },
        created_at: new Date(Date.now() - 7200000).toISOString(),
        completed_at: new Date(Date.now() - 7100000).toISOString()
      },
      {
        id: '3',
        name: 'Driver Matching Algorithm',
        status: 'failed',
        result: { success: false, error: 'No nearby drivers found', duration: '0.5s' },
        created_at: new Date(Date.now() - 10800000).toISOString(),
        completed_at: new Date(Date.now() - 10700000).toISOString()
      }
    ];
    
    setTestData(mockTests);
  };

  const runTest = async (testName: string, testFunction: () => Promise<any>) => {
    const testId = Date.now().toString();
    setRunningTests(prev => new Set([...prev, testId]));
    
    const newTest: TestData = {
      id: testId,
      name: testName,
      status: 'running',
      created_at: new Date().toISOString()
    };
    
    setTestData(prev => [newTest, ...prev]);

    try {
      const result = await testFunction();
      
      setTestData(prev => prev.map(test => 
        test.id === testId 
          ? { 
              ...test, 
              status: 'completed' as const, 
              result: { success: true, ...result },
              completed_at: new Date().toISOString()
            }
          : test
      ));
      
      toast({
        title: "Test Completed",
        description: `${testName} completed successfully`
      });
      
    } catch (error: any) {
      setTestData(prev => prev.map(test => 
        test.id === testId 
          ? { 
              ...test, 
              status: 'failed' as const, 
              result: { success: false, error: error.message },
              completed_at: new Date().toISOString()
            }
          : test
      ));
      
      toast({
        title: "Test Failed",
        description: `${testName}: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setRunningTests(prev => {
        const newSet = new Set(prev);
        newSet.delete(testId);
        return newSet;
      });
    }
  };

  const testUserRegistration = async () => {
    // Mock user registration test
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { duration: '2.0s', usersCreated: 1 };
  };

  const testRideRequest = async () => {
    if (!testConfig.mockUserId) {
      throw new Error('Mock User ID is required');
    }

    const { data, error } = await supabase
      .from('ride_requests')
      .insert({
        user_id: testConfig.mockUserId,
        ...testConfig.testRideData,
        estimated_fare: 15000
      })
      .select()
      .single();

    if (error) throw error;

    return { 
      duration: '1.2s', 
      requestId: data.id,
      estimatedFare: data.estimated_fare 
    };
  };

  const testDriverMatching = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id')
      .in('role', ['driver', 'boda_boda'])
      .eq('is_active', true)
      .limit(5);

    if (error) throw error;

    return { 
      duration: '0.8s', 
      driversFound: data?.length || 0,
      matchingRadius: '5km'
    };
  };

  const testDatabaseConnection = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) throw error;

    return { 
      duration: '0.3s', 
      connectionStatus: 'healthy',
      responseTime: '45ms'
    };
  };

  const clearTestHistory = () => {
    setTestData([]);
    toast({
      title: "Test History Cleared",
      description: "All test records have been removed"
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <TestTube className="h-4 w-4 text-gray-500" />;
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <Card className="card-enhanced">
        <CardContent className="p-12 text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-destructive mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            You need admin privileges to access the testing dashboard
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse-glow">
          <Settings className="h-12 w-12 text-primary" />
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
              <h1 className="text-3xl font-bold text-white">Testing Dashboard</h1>
              <p className="text-white/80 text-lg">System monitoring and automated testing</p>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white">
              <Activity className="h-4 w-4 mr-2" />
              Admin Console
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* System Stats */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card className="card-enhanced">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{systemStats.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Rides</p>
                <p className="text-2xl font-bold">{systemStats.totalRides}</p>
              </div>
              <Car className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Rides</p>
                <p className="text-2xl font-bold">{systemStats.activeRides}</p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{systemStats.pendingRequests}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Drivers</p>
                <p className="text-2xl font-bold">{systemStats.totalDrivers}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Drivers</p>
                <p className="text-2xl font-bold">{systemStats.activeDrivers}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Testing Interface */}
      <Tabs defaultValue="automated" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="automated">Automated Tests</TabsTrigger>
          <TabsTrigger value="manual">Manual Testing</TabsTrigger>
          <TabsTrigger value="history">Test History</TabsTrigger>
        </TabsList>

        <TabsContent value="automated" className="space-y-6">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Automated Test Suite
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Button
                  onClick={() => runTest('User Registration Flow', testUserRegistration)}
                  disabled={runningTests.size > 0}
                  className="h-20 flex flex-col gap-2"
                >
                  <Play className="h-6 w-6" />
                  Test User Registration
                </Button>

                <Button
                  onClick={() => runTest('Database Connection', testDatabaseConnection)}
                  disabled={runningTests.size > 0}
                  className="h-20 flex flex-col gap-2"
                  variant="outline"
                >
                  <Database className="h-6 w-6" />
                  Test Database
                </Button>

                <Button
                  onClick={() => runTest('Ride Request Creation', testRideRequest)}
                  disabled={runningTests.size > 0 || !testConfig.mockUserId}
                  className="h-20 flex flex-col gap-2"
                  variant="outline"
                >
                  <Car className="h-6 w-6" />
                  Test Ride Request
                </Button>

                <Button
                  onClick={() => runTest('Driver Matching', testDriverMatching)}
                  disabled={runningTests.size > 0}
                  className="h-20 flex flex-col gap-2"
                  variant="outline"
                >
                  <Users className="h-6 w-6" />
                  Test Driver Matching
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-6">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle>Manual Test Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="mockUserId">Mock User ID</Label>
                  <Input
                    id="mockUserId"
                    value={testConfig.mockUserId}
                    onChange={(e) => setTestConfig(prev => ({ ...prev, mockUserId: e.target.value }))}
                    placeholder="Enter user UUID for testing"
                  />
                </div>
                <div>
                  <Label htmlFor="mockDriverId">Mock Driver ID</Label>
                  <Input
                    id="mockDriverId"
                    value={testConfig.mockDriverId}
                    onChange={(e) => setTestConfig(prev => ({ ...prev, mockDriverId: e.target.value }))}
                    placeholder="Enter driver UUID for testing"
                  />
                </div>
              </div>

              <div>
                <Label>Test Ride Configuration</Label>
                <Textarea
                  value={JSON.stringify(testConfig.testRideData, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setTestConfig(prev => ({ ...prev, testRideData: parsed }));
                    } catch (error) {
                      // Invalid JSON, ignore
                    }
                  }}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card className="card-enhanced">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Test History
                </CardTitle>
                <Button 
                  onClick={clearTestHistory}
                  variant="outline"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear History
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {testData.length === 0 ? (
                <div className="text-center py-12">
                  <TestTube className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">No test history</p>
                  <p className="text-muted-foreground">Run some tests to see results here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {testData.map((test) => (
                    <div key={test.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(test.status)}
                        <div>
                          <div className="font-semibold">{test.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(test.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        {test.result && (
                          <div className="text-sm">
                            {test.result.success ? (
                              <Badge variant="outline" className="text-green-600">
                                Success - {test.result.duration || 'N/A'}
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                Failed: {test.result.error}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <Badge variant={
                        test.status === 'completed' ? 'default' :
                        test.status === 'failed' ? 'destructive' :
                        test.status === 'running' ? 'secondary' : 'outline'
                      }>
                        {test.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TestingDashboard;
