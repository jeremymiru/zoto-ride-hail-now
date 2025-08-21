import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings as SettingsIcon, 
  User, 
  CreditCard, 
  Bell, 
  Shield, 
  HelpCircle,
  ChevronRight,
  Edit,
  Save,
  X,
  Smartphone,
  Banknote
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import NotificationCenter from '@/components/Notifications/NotificationCenter';

const Settings = () => {
  const { user, profile, updateProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    avatar_url: profile?.avatar_url || ''
  });

  // Redirect if not authenticated
  if (!loading && !user) {
    navigate('/auth');
    return null;
  }

  if (loading || !profile) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse-glow">
            <SettingsIcon className="h-12 w-12 text-primary" />
          </div>
        </div>
      </Layout>
    );
  }

  const handleSaveProfile = async () => {
    try {
      await updateProfile(editForm);
      setIsEditingProfile(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated."
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const settingsMenu = [
    {
      id: 'profile',
      title: 'Edit Profile',
      description: 'Manage your personal information',
      icon: User,
    },
    {
      id: 'payments',
      title: 'Payment Methods', 
      description: 'Manage your payment options',
      icon: CreditCard,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'View and manage your notifications',
      icon: Bell,
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      description: 'Control your privacy settings',
      icon: Shield,
    },
    {
      id: 'help',
      title: 'Help & Support',
      description: 'Get help and contact support',
      icon: HelpCircle,
    }
  ];

  const renderProfileSection = () => (
    <Card className="card-enhanced">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit Profile
          </CardTitle>
          <Button
            variant="outline"
            onClick={() => setIsEditingProfile(!isEditingProfile)}
          >
            {isEditingProfile ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isEditingProfile ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={editForm.full_name}
                onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar_url">Avatar URL (Optional)</Label>
              <Input
                id="avatar_url"
                value={editForm.avatar_url}
                onChange={(e) => setEditForm(prev => ({ ...prev, avatar_url: e.target.value }))}
                placeholder="Enter avatar image URL"
              />
            </div>

            <Button
              onClick={handleSaveProfile}
              className="w-full btn-gradient"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
              <p className="text-base mt-1">{profile.full_name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Email</Label>
              <p className="text-base mt-1">{profile.email}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
              <p className="text-base mt-1">{profile.phone || 'Not provided'}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderPaymentSection = () => (
    <Card className="card-enhanced">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Methods
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          {/* Cash Payment */}
          <Card className="border border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-100">
                    <Banknote className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-800">Cash Payment</h3>
                    <p className="text-sm text-green-600">Pay your driver directly with cash</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                  Default
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Money - M-Pesa */}
          <Card className="border border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-100">
                    <Smartphone className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-800">M-Pesa Mobile Money</h3>
                    <p className="text-sm text-blue-600">Pay securely using M-Pesa mobile money</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                  Available
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        <div className="text-center py-4">
          <p className="text-muted-foreground text-sm">
            More payment methods coming soon! We're working to add card payments and other mobile money options.
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderNotificationsSection = () => <NotificationCenter />;

  const renderPrivacySection = () => (
    <Card className="card-enhanced">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Privacy & Security
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Account Security</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Your account is protected with email authentication
            </p>
            <Badge variant="outline" className="text-green-600 border-green-200">
              Secured
            </Badge>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Location Sharing</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Your location is only shared during active rides for safety and navigation
            </p>
            <Badge variant="outline">
              Active During Rides
            </Badge>
          </div>

          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Data Privacy</h3>
            <p className="text-sm text-muted-foreground">
              We follow strict privacy guidelines to protect your personal information
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderHelpSection = () => (
    <Card className="card-enhanced">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          Help & Support
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
            <h3 className="font-semibold">Frequently Asked Questions</h3>
            <p className="text-sm text-muted-foreground">Find answers to common questions</p>
          </div>
          
          <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
            <h3 className="font-semibold">Contact Support</h3>
            <p className="text-sm text-muted-foreground">Get help from our support team</p>
          </div>

          <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
            <h3 className="font-semibold">Safety Guidelines</h3>
            <p className="text-sm text-muted-foreground">Learn about staying safe during rides</p>
          </div>

          <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
            <h3 className="font-semibold">Report an Issue</h3>
            <p className="text-sm text-muted-foreground">Report problems or provide feedback</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfileSection();
      case 'payments':
        return renderPaymentSection();
      case 'notifications':
        return renderNotificationsSection();
      case 'privacy':
        return renderPrivacySection();
      case 'help':
        return renderHelpSection();
      default:
        return renderProfileSection();
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="gradient-card">
          <CardContent className="p-6">
            <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
            <p className="text-white/80">Manage your account preferences and settings</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Settings Menu */}
          <Card className="card-enhanced lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Settings Menu</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {settingsMenu.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full text-left p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors ${
                      activeSection === item.id ? 'bg-primary/10 border-r-2 border-primary' : ''
                    }`}
                  >
                    <item.icon className={`h-5 w-5 ${
                      activeSection === item.id ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                    <div className="flex-1">
                      <div className={`font-medium ${
                        activeSection === item.id ? 'text-primary' : ''
                      }`}>
                        {item.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.description}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Section Content */}
          <div className="lg:col-span-3">
            {renderActiveSection()}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;