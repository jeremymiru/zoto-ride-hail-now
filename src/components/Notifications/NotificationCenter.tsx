import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  Check, 
  X, 
  Car, 
  MapPin, 
  Clock, 
  Star,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  data: any;
  read: boolean;
  created_at: string;
}

const NotificationCenter = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Set up real-time subscription for notifications
      const subscription = supabase
        .channel('user_notifications')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [payload.new as Notification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Show toast for new notification
            const newNotification = payload.new as Notification;
            toast({
              title: newNotification.title,
              description: newNotification.message,
            });
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user!.id);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user!.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);

      toast({
        title: "Notifications Updated",
        description: "All notifications marked as read"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update notifications",
        variant: "destructive"
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ride_request': return <Car className="h-4 w-4" />;
      case 'ride_accepted': return <Check className="h-4 w-4" />;
      case 'ride_completed': return <Star className="h-4 w-4" />;
      case 'payment': return <DollarSign className="h-4 w-4" />;
      case 'location': return <MapPin className="h-4 w-4" />;
      case 'alert': return <AlertCircle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'ride_request': return 'default';
      case 'ride_accepted': return 'outline';
      case 'ride_completed': return 'secondary';
      case 'payment': return 'outline';
      case 'alert': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 w-5 p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`border rounded-lg p-3 space-y-2 transition-colors ${
                  !notification.read ? 'bg-muted/50 border-primary/20' : 'hover:bg-muted/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Badge variant={getNotificationColor(notification.type)} className="mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      {notification.data && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {notification.data.pickup_address && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {notification.data.pickup_address}
                            </div>
                          )}
                          {notification.data.fare && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ${notification.data.fare}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimeAgo(notification.created_at)}
                    </span>
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationCenter;