import { useState, useEffect } from 'react';
import { Bell, Mail, Globe, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface NotificationPreference {
  email_notifications: boolean;
  push_notifications: boolean;
  notify_mentions: boolean;
  notify_assignments: boolean;
  notify_deadlines: boolean;
  notify_comments: boolean;
  notify_status_changes: boolean;
  notify_campaign_updates: boolean;
  notify_team_invites: boolean;
}

export function NotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreference>({
    email_notifications: true,
    push_notifications: false,
    notify_mentions: true,
    notify_assignments: true,
    notify_deadlines: true,
    notify_comments: true,
    notify_status_changes: true,
    notify_campaign_updates: true,
    notify_team_invites: true
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('notification_preferences')
      .eq('id', user.id)
      .maybeSingle();

    if (data?.notification_preferences) {
      setPreferences({
        ...preferences,
        ...data.notification_preferences
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaved(false);

    const { error } = await supabase
      .from('profiles')
      .update({
        notification_preferences: preferences
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences');
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }

    setSaving(false);
  };

  const togglePreference = (key: keyof NotificationPreference) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Notification Channels</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-4 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear cursor-pointer hover:dark:border-linear-border hover:light:border-linear-light-border linear-transition">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 dark:text-text-secondary light:text-text-light-secondary" />
              <div>
                <div className="font-medium">Email Notifications</div>
                <div className="text-sm dark:text-text-secondary light:text-text-light-secondary">
                  Receive notifications via email
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.email_notifications}
              onChange={() => togglePreference('email_notifications')}
              className="w-5 h-5 rounded border-linear-border focus:ring-2 focus:ring-linear-accent"
            />
          </label>

          <label className="flex items-center justify-between p-4 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear cursor-pointer hover:dark:border-linear-border hover:light:border-linear-light-border linear-transition">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 dark:text-text-secondary light:text-text-light-secondary" />
              <div>
                <div className="font-medium">Push Notifications</div>
                <div className="text-sm dark:text-text-secondary light:text-text-light-secondary">
                  Receive browser push notifications
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.push_notifications}
              onChange={() => togglePreference('push_notifications')}
              className="w-5 h-5 rounded border-linear-border focus:ring-2 focus:ring-linear-accent"
            />
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Notification Types</h3>
        <div className="space-y-3">
          {[
            { key: 'notify_mentions' as const, label: 'Mentions', description: 'When someone mentions you' },
            { key: 'notify_assignments' as const, label: 'Task Assignments', description: 'When you are assigned to a task' },
            { key: 'notify_deadlines' as const, label: 'Deadlines', description: 'Reminders for upcoming deadlines' },
            { key: 'notify_comments' as const, label: 'Comments', description: 'When someone comments on your items' },
            { key: 'notify_status_changes' as const, label: 'Status Changes', description: 'When item status changes' },
            { key: 'notify_campaign_updates' as const, label: 'Campaign Updates', description: 'Updates on campaigns you follow' },
            { key: 'notify_team_invites' as const, label: 'Team Invites', description: 'When you are invited to a workspace' }
          ].map(({ key, label, description }) => (
            <label
              key={key}
              className="flex items-center justify-between p-4 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear cursor-pointer hover:dark:border-linear-border hover:light:border-linear-light-border linear-transition"
            >
              <div>
                <div className="font-medium">{label}</div>
                <div className="text-sm dark:text-text-secondary light:text-text-light-secondary">
                  {description}
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences[key]}
                onChange={() => togglePreference(key)}
                className="w-5 h-5 rounded border-linear-border focus:ring-2 focus:ring-linear-accent"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition disabled:opacity-50 flex items-center gap-2"
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" />
              Saved
            </>
          ) : (
            <>Save Preferences</>
          )}
        </button>
        {saved && (
          <span className="text-sm text-linear-success">
            Your preferences have been saved
          </span>
        )}
      </div>
    </div>
  );
}
