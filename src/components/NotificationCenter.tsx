import { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, X, Trash2 } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { formatDistanceToNow } from '../utils/dateHelpers';

export function NotificationCenter() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notificationId: string, read: boolean) => {
    if (!read) {
      await markAsRead(notificationId);
    }
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'mention':
        return '💬';
      case 'assignment':
        return '📋';
      case 'deadline':
        return '⏰';
      case 'comment':
        return '💭';
      case 'status_change':
        return '🔄';
      default:
        return '🔔';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-linear-bg-subtle rounded-linear linear-transition"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-linear-error rounded-full flex items-center justify-center text-[10px] font-medium text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-linear-bg-secondary border border-linear-border rounded-linear-lg shadow-xl z-50 max-h-[600px] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-linear-border-subtle">
            <h3 className="font-medium">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-text-secondary hover:text-text-primary linear-transition flex items-center gap-1"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3 h-3" />
                  Mark all read
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center text-text-secondary">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 mx-auto mb-3 text-text-tertiary opacity-50" />
                <p className="text-text-secondary">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-linear-border-subtle">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification.id, notification.read)}
                    className={`p-4 cursor-pointer hover:bg-linear-bg-subtle linear-transition ${
                      !notification.read ? 'bg-linear-accent/5' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5 text-xl">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">{notification.title}</h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-linear-accent rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-sm text-text-secondary line-clamp-2 mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-text-tertiary">
                            {formatDistanceToNow(notification.created_at)}
                          </span>
                          <button
                            onClick={(e) => handleDelete(e, notification.id)}
                            className="p-1 hover:bg-linear-bg-hover rounded text-text-tertiary hover:text-linear-error linear-transition"
                            title="Delete notification"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-linear-border-subtle">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full text-center text-sm text-text-secondary hover:text-text-primary linear-transition"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
