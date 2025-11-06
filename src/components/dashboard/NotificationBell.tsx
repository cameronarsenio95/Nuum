import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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

    // Realtime updates voor nieuwe notifications
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

  const rawUnreadCount = notifications.filter(n => !n.read_at).length;
  // Als de modal open is, badge verbergen
  const unreadCount = open ? 0 : rawUnreadCount;

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
    }

    setNotifications(prev =>
      prev.map(n => (n.read_at ? n : { ...n, read_at: now }))
    );
  };

  const handleBellClick = () => {
    if (!open) {
      setOpen(true);
      void markAllAsRead();
    } else {
      setOpen(false);
    }
  };

  const closeModal = () => setOpen(false);

  // Modal via portal zodat hij boven het hele workspace-gedeelte hangt
  let modal: React.ReactNode = null;
  if (open && typeof document !== 'undefined') {
    modal = createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Donkere overlay over het hele scherm */}
        <div
          className="absolute inset-0 bg-black/40"
          onClick={closeModal}
        />

        {/* Gecentreerde modal in het midden */}
        <div className="relative z-10 w-full max-w-md mx-4 rounded-linear-lg border dark:border-linear-border light:border-linear-light-border dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary shadow-xl max-h-[80vh] flex flex-col">
          <div className="px-4 py-3 border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle flex items-center justify-between">
            <span className="text-sm font-medium">Notifications</span>
            <button
              type="button"
              onClick={closeModal}
              className="p-1 rounded-full hover:dark:bg-linear-bg-subtle light:hover:bg-linear-light-bg-subtle linear-transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-2 overflow-y-auto">
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
      </div>,
      document.body
    );
  }

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={handleBellClick}
          className="relative p-2 rounded-full hover:dark:bg-linear-bg-subtle light:hover:bg-linear-light-bg-subtle linear-transition"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500" />
          )}
        </button>
      </div>

      {modal}
    </>
  );
}
