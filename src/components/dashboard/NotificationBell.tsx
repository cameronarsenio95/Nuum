import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Database } from '../../lib/database.types';

type Notification = Database['public']['Tables']['notifications']['Row'];

type NotificationFilter =
  | 'all'
  | 'campaign'
  | 'task'
  | 'creator'
  | 'content'
  | 'note';

const FILTERS: { id: NotificationFilter; label: string }[] = [
  { id: 'all',      label: 'All' },
  { id: 'campaign', label: 'Campaigns' },
  { id: 'task',     label: 'Tasks' },
  { id: 'creator',  label: 'Creators' },
  { id: 'content',  label: 'Content' },
  { id: 'note',     label: 'Notes' },
];

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');

  useEffect(() => {
    if (!user) return;

    const loadNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

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

  const formatDate = (n: Notification) => {
    if (!n.created_at) return '';
    try {
      return new Date(n.created_at as string).toLocaleString(undefined, {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'all') return true;
    const type = (n.entity_type || '') as NotificationFilter;
    return type === activeFilter;
  });

  // Modal via portal zodat hij boven het hele workspace-gedeelte hangt
  let modal: React.ReactNode = null;
  if (open && typeof document !== 'undefined') {
    modal = createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Donkere overlay over het hele scherm */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={closeModal}
        />

        {/* Gecentreerde modal in het midden */}
        <div className="relative z-10 w-full max-w-md mx-4 rounded-linear-lg border dark:border-linear-border light:border-linear-light-border dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary shadow-xl max-h-[80vh] flex flex-col animate-[fadeInScale_0.15s_ease-out]">
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

          {/* Filter tabs */}
          <div className="px-3 pt-2 pb-1 border-b dark:border-linear-border-subtle/60 light:border-linear-light-border-subtle/60">
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map(filter => {
                const isActive = activeFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setActiveFilter(filter.id)}
                    className={[
                      'px-2.5 py-1 rounded-full text-xs border linear-transition',
                      isActive
                        ? 'dark:bg-linear-bg-subtle dark:border-linear-border light:bg-linear-light-bg-subtle light:border-linear-light-border dark:text-text-primary light:text-text-light-primary'
                        : 'dark:bg-transparent dark:border-transparent dark:text-text-secondary dark:hover:bg-linear-bg-subtle/60 light:bg-transparent light:border-transparent light:text-text-light-secondary light:hover:bg-linear-light-bg-subtle/60',
                    ].join(' ')}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="py-2 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="px-4 py-6 text-sm text-center dark:text-text-secondary light:text-text-light-secondary">
                No notifications for this filter.
              </div>
            ) : (
              filteredNotifications.map(n => (
                <div
                  key={n.id}
                  className="px-4 py-3 text-sm border-b last:border-b-0 dark:border-linear-border-subtle/60 light:border-linear-light-border-subtle/60 hover:dark:bg-linear-bg-subtle/60 hover:light:bg-linear-light-bg-subtle/60 linear-transition"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="font-medium text-xs uppercase tracking-wide opacity-70">
                      {n.type === 'assignment' && 'ASSIGNMENT'}
                      {n.type === 'status_change' && 'STATUS UPDATE'}
                      {n.type === 'activity' && 'ACTIVITY'}
                      {!['assignment', 'status_change', 'activity'].includes(
                        n.type
                      ) && n.type?.toUpperCase()}
                    </div>
                    {formatDate(n) && (
                      <span className="ml-2 text-[11px] dark:text-text-tertiary light:text-text-light-tertiary">
                        {formatDate(n)}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-medium mb-0.5">
                    {n.title}
                  </div>
                  {n.message && (
                    <div className="text-xs leading-snug dark:text-text-secondary light:text-text-light-secondary">
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
