import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Database } from '../../lib/database.types';

type Notification = Database['public']['Tables']['notifications']['Row'];

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading notifications', error);
        return;
      }

      setNotifications(data || []);
    };

    loadNotifications();

    // Realtime updates
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        payload => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!user) return null;

  const unreadCount = notifications.filter(n => !n.read_at).length;

  const markAllAsRead = async () => {
    if (!user) return;
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('notifications')
      .update({ read_at: now })
      .eq('user_id', user.id)
      .is('read_at', null);

    if (error) {
      console.error('Error marking notifications as read', error);
      return;
    }

    // Lokale state updaten zodat badge direct verdwijnt
    setNotifications(prev =>
      prev.map(n => (n.read_at ? n : { ...n, read_at: now }))
    );
  };

  const handleBellClick = () => {
    if (!open) {
      setOpen(true);
      // Alles als gelezen markeren bij openen
      void markAllAsRead();
    } else {
      // Als je wilt dat alleen het kruisje sluit, kun je deze regel weglaten
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleBellClick}
        className="relative p-2 rounded-full hover:dark:bg-linear-bg-subtle light:hover:bg-linear-light-bg-subtle linear-transition"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 text-[10px] font-medium rounded-full bg-red-500 text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-linear-lg border dark:border-linear-border light:border-linear-light-border dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary shadow-lg z-50">
          <div className="px-4 py-3 border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle flex items-center justify-between">
            <span className="text-sm font-medium">Notifications</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 rounded-full hover:dark:bg-linear-bg-subtle light:hover:bg-linear-light-bg-subtle linear-transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="py-2">
            {notifications.length === 0 ? (
              <div className="px-4 py-3 text-sm dark:text-text-secondary light:text-text-light-secondary">
                No notifications yet.
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className="px-4 py-3 text-sm border-b last:border-b-0 dark:border-linear-border-subtle light:border-linear-light-border-subtle"
                >
                  <div className="font-medium text-xs uppercase mb-1 opacity-70">
                    {n.type === 'assignment' && 'Assignment'}
                    {n.type === 'status_change' && 'Status update'}
                    {n.type === 'activity' && 'Activity'}
                    {!['assignment', 'status_change', 'activity'].includes(n.type) && n.type}
                  </div>
                  <div className="text-sm mb-1">{n.title}</div>
                  {n.message && (
                    <div className="text-xs dark:text-text-secondary light:text-text-light-secondary">
                      {n.message}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
