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

  const getEntityLabel = (entityType: string | null) => {
    switch (entityType) {
      case 'campaign':
        return 'Campaign';
      case 'task':
        return 'Task';
      case 'creator':
        return 'Creator';
      case 'content':
        return 'Content';
      case 'note':
        return 'Note';
      default:
        return 'Update';
    }
  };

  const getTypeChipClasses = (type: string | null) => {
    switch (type) {
      case 'status_change':
        return 'text-linear-info bg-linear-info/10 border-linear-info-border/30';
      case 'assignment':
        return 'text-linear-accent bg-linear-accent/10 border-linear-accent/30';
      case 'activity':
        return 'text-linear-success bg-linear-success/10 border-linear-success-border/30';
      default:
        return 'text-text-secondary bg-linear-bg-subtle/60 border-linear-border-subtle/40';
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

        {/* Gecentreerde, grotere modal in het midden */}
        <div className="relative z-10 w-full max-w-2xl lg:max-w-3xl mx-4 rounded-linear-lg border dark:border-linear-border light:border-linear-light-border dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary shadow-2xl max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-medium tracking-wide">Notifications</span>
              <span className="text-xs dark:text-text-secondary light:text-text-light-secondary">
                Live updates for your workspace activity
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 rounded-full hover:dark:bg-linear-bg-subtle light:hover:bg-linear-light-bg-subtle linear-transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="px-5 pt-3 pb-2 border-b dark:border-linear-border-subtle/60 light:border-linear-light-border-subtle/60">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map(filter => {
                const isActive = activeFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setActiveFilter(filter.id)}
                    className={[
                      'px-3 py-1.5 rounded-full text-xs border linear-transition',
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

          {/* Lijst */}
          <div className="py-2 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="px-6 py-10 text-sm text-center dark:text-text-secondary light:text-text-light-secondary">
                No notifications for this filter yet.
              </div>
            ) : (
              filteredNotifications.map(n => (
                <div
                  key={n.id}
                  className="px-6 py-4 text-sm border-b last:border-b-0 dark:border-linear-border-subtle/60 light:border-linear-light-border-subtle/60 hover:dark:bg-linear-bg-subtle/60 light:hover:bg-linear-light-bg-subtle/60 linear-transition flex gap-4"
                >
                  {/* Accent dot */}
                  <div className="pt-1">
                    <span className="block w-2 h-2 rounded-full bg-linear-accent" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Type chip */}
                        <span
                          className={
                            'text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full border ' +
                            getTypeChipClasses(n.type)
                          }
                        >
                          {n.type === 'assignment' && 'Assignment'}
                          {n.type === 'status_change' && 'Status Update'}
                          {n.type === 'activity' && 'Activity'}
                          {!['assignment', 'status_change', 'activity'].includes(
                            n.type
                          ) && (n.type || 'Update')}
                        </span>

                        {/* Entity chip */}
                        <span className="text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full border dark:border-linear-border-subtle light:border-linear-light-border-subtle dark:text-text-tertiary light:text-text-light-tertiary">
                          {getEntityLabel(n.entity_type)}
                        </span>
                      </div>

                      {formatDate(n) && (
                        <span className="ml-2 text-[11px] whitespace-nowrap dark:text-text-tertiary light:text-text-light-tertiary">
                          {formatDate(n)}
                        </span>
                      )}
                    </div>

                    {n.title && (
                      <div className="text-sm font-medium mb-0.5 truncate">
                        {n.title}
                      </div>
                    )}

                    {n.message && (
                      <div className="text-xs leading-snug dark:text-text-secondary light:text-text-light-secondary">
                        {n.message}
                      </div>
                    )}
                  </div>
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
