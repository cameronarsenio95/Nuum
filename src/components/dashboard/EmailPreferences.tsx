import { useState, useEffect } from 'react';
import { Mail, Bell, Clock, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface EmailPreferences {
  marketing_enabled: boolean;
  product_updates_enabled: boolean;
  transactional_enabled: boolean;
  security_alerts_enabled: boolean;
  support_ticket_created: boolean;
  support_ticket_reply: boolean;
  support_ticket_status_change: boolean;
  campaign_started: boolean;
  campaign_milestone: boolean;
  campaign_completed: boolean;
  task_assigned: boolean;
  task_due_soon: boolean;
  task_completed: boolean;
  team_invitation: boolean;
  team_member_added: boolean;
  team_member_removed: boolean;
  payment_success: boolean;
  payment_failed: boolean;
  subscription_changed: boolean;
  trial_expiring: boolean;
  daily_digest_enabled: boolean;
  weekly_digest_enabled: boolean;
  digest_day: string;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  quiet_hours_timezone: string;
  unsubscribed_at: string | null;
}

export function EmailPreferences() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error loading preferences:', error);
    } else if (data) {
      setPreferences(data as EmailPreferences);
    } else {
      const { data: newPrefs } = await supabase
        .from('email_preferences')
        .insert({ user_id: user.id })
        .select()
        .single();

      if (newPrefs) {
        setPreferences(newPrefs as EmailPreferences);
      }
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user || !preferences) return;

    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('email_preferences')
        .update(preferences)
        .eq('user_id', user.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Email preferences saved successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save preferences' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof EmailPreferences) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      [key]: !preferences[key],
    });
  };

  const handleChange = (key: keyof EmailPreferences, value: string) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      [key]: value,
    });
  };

  if (loading) {
    return <div className="dark:text-text-secondary light:text-text-light-secondary">Loading preferences...</div>;
  }

  if (!preferences) {
    return <div className="dark:text-text-secondary light:text-text-light-secondary">Unable to load preferences</div>;
  }

  const PreferenceToggle = ({
    label,
    description,
    prefKey
  }: {
    label: string;
    description: string;
    prefKey: keyof EmailPreferences;
  }) => (
    <div className="flex items-start justify-between py-3 border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle last:border-0">
      <div className="flex-1">
        <p className="text-sm font-medium dark:text-text-primary light:text-text-light-primary">{label}</p>
        <p className="text-xs dark:text-text-tertiary light:text-text-light-tertiary mt-1">{description}</p>
      </div>
      <button
        onClick={() => handleToggle(prefKey)}
        className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          preferences[prefKey] ? 'bg-linear-accent' : 'dark:bg-gray-600 light:bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            preferences[prefKey] ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {preferences.unsubscribed_at && (
        <div className="p-4 rounded-linear dark:bg-yellow-500/10 light:bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="text-yellow-500 font-medium">You are currently unsubscribed</p>
              <p className="text-sm dark:text-text-secondary light:text-text-light-secondary mt-1">
                You won't receive any marketing emails. Transactional emails (like receipts) will still be sent.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Mail className="w-5 h-5 dark:text-text-primary light:text-text-light-primary" />
          <h3 className="text-lg font-medium">General Email Preferences</h3>
        </div>
        <div className="space-y-1">
          <PreferenceToggle
            label="Marketing Emails"
            description="Product updates, new features, and special offers"
            prefKey="marketing_enabled"
          />
          <PreferenceToggle
            label="Product Updates"
            description="Important updates about NUUM and new features"
            prefKey="product_updates_enabled"
          />
          <PreferenceToggle
            label="Security Alerts"
            description="Login alerts and security notifications (recommended)"
            prefKey="security_alerts_enabled"
          />
        </div>
      </div>

      <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-5 h-5 dark:text-text-primary light:text-text-light-primary" />
          <h3 className="text-lg font-medium">Support Tickets</h3>
        </div>
        <div className="space-y-1">
          <PreferenceToggle
            label="Ticket Created"
            description="Confirmation email when you create a support ticket"
            prefKey="support_ticket_created"
          />
          <PreferenceToggle
            label="Support Team Reply"
            description="Notification when support team responds to your ticket"
            prefKey="support_ticket_reply"
          />
          <PreferenceToggle
            label="Status Changes"
            description="Updates when your ticket status changes"
            prefKey="support_ticket_status_change"
          />
        </div>
      </div>

      <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-5 h-5 dark:text-text-primary light:text-text-light-primary" />
          <h3 className="text-lg font-medium">Campaigns & Tasks</h3>
        </div>
        <div className="space-y-1">
          <PreferenceToggle
            label="Campaign Started"
            description="Notification when a campaign is launched"
            prefKey="campaign_started"
          />
          <PreferenceToggle
            label="Campaign Milestones"
            description="Updates at 25%, 50%, 75%, and 100% completion"
            prefKey="campaign_milestone"
          />
          <PreferenceToggle
            label="Campaign Completed"
            description="Notification when campaign ends"
            prefKey="campaign_completed"
          />
          <PreferenceToggle
            label="Task Assigned"
            description="Email when a task is assigned to you"
            prefKey="task_assigned"
          />
          <PreferenceToggle
            label="Task Due Soon"
            description="Reminders before task deadlines"
            prefKey="task_due_soon"
          />
          <PreferenceToggle
            label="Task Completed"
            description="Notification when assigned tasks are completed"
            prefKey="task_completed"
          />
        </div>
      </div>

      <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-5 h-5 dark:text-text-primary light:text-text-light-primary" />
          <h3 className="text-lg font-medium">Team & Billing</h3>
        </div>
        <div className="space-y-1">
          <PreferenceToggle
            label="Team Invitations"
            description="Email when invited to join a workspace"
            prefKey="team_invitation"
          />
          <PreferenceToggle
            label="Team Members Added"
            description="Notification when someone joins your workspace"
            prefKey="team_member_added"
          />
          <PreferenceToggle
            label="Team Members Removed"
            description="Notification when someone leaves your workspace"
            prefKey="team_member_removed"
          />
          <PreferenceToggle
            label="Payment Success"
            description="Confirmation when payment is processed"
            prefKey="payment_success"
          />
          <PreferenceToggle
            label="Payment Failed"
            description="Alert when payment fails (always enabled for your protection)"
            prefKey="payment_failed"
          />
          <PreferenceToggle
            label="Subscription Changes"
            description="Updates when your plan changes"
            prefKey="subscription_changed"
          />
          <PreferenceToggle
            label="Trial Expiring"
            description="Reminders before your trial ends"
            prefKey="trial_expiring"
          />
        </div>
      </div>

      <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Mail className="w-5 h-5 dark:text-text-primary light:text-text-light-primary" />
          <h3 className="text-lg font-medium">Digest Emails</h3>
        </div>
        <div className="space-y-4">
          <PreferenceToggle
            label="Daily Digest"
            description="Daily summary of workspace activity"
            prefKey="daily_digest_enabled"
          />
          <PreferenceToggle
            label="Weekly Digest"
            description="Weekly recap of campaigns, creators, and content"
            prefKey="weekly_digest_enabled"
          />
          {preferences.weekly_digest_enabled && (
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-text-secondary light:text-text-light-secondary">
                Send weekly digest on
              </label>
              <select
                value={preferences.digest_day}
                onChange={(e) => handleChange('digest_day', e.target.value)}
                className="w-full px-4 py-2 rounded-linear border dark:bg-linear-bg light:bg-linear-light-bg dark:border-linear-border light:border-linear-light-border dark:text-text-primary light:text-text-light-primary focus:outline-none focus:border-linear-accent"
              >
                <option value="monday">Monday</option>
                <option value="tuesday">Tuesday</option>
                <option value="wednesday">Wednesday</option>
                <option value="thursday">Thursday</option>
                <option value="friday">Friday</option>
                <option value="saturday">Saturday</option>
                <option value="sunday">Sunday</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Clock className="w-5 h-5 dark:text-text-primary light:text-text-light-primary" />
          <h3 className="text-lg font-medium">Quiet Hours</h3>
        </div>
        <div className="space-y-4">
          <PreferenceToggle
            label="Enable Quiet Hours"
            description="Don't send non-urgent emails during specific hours"
            prefKey="quiet_hours_enabled"
          />
          {preferences.quiet_hours_enabled && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-text-secondary light:text-text-light-secondary">
                    Start time
                  </label>
                  <input
                    type="time"
                    value={preferences.quiet_hours_start}
                    onChange={(e) => handleChange('quiet_hours_start', e.target.value)}
                    className="w-full px-4 py-2 rounded-linear border dark:bg-linear-bg light:bg-linear-light-bg dark:border-linear-border light:border-linear-light-border dark:text-text-primary light:text-text-light-primary focus:outline-none focus:border-linear-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-text-secondary light:text-text-light-secondary">
                    End time
                  </label>
                  <input
                    type="time"
                    value={preferences.quiet_hours_end}
                    onChange={(e) => handleChange('quiet_hours_end', e.target.value)}
                    className="w-full px-4 py-2 rounded-linear border dark:bg-linear-bg light:bg-linear-light-bg dark:border-linear-border light:border-linear-light-border dark:text-text-primary light:text-text-light-primary focus:outline-none focus:border-linear-accent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-text-secondary light:text-text-light-secondary">
                  Timezone
                </label>
                <select
                  value={preferences.quiet_hours_timezone}
                  onChange={(e) => handleChange('quiet_hours_timezone', e.target.value)}
                  className="w-full px-4 py-2 rounded-linear border dark:bg-linear-bg light:bg-linear-light-bg dark:border-linear-border light:border-linear-light-border dark:text-text-primary light:text-text-light-primary focus:outline-none focus:border-linear-accent"
                >
                  <option value="UTC">UTC</option>
                  <option value="Europe/Amsterdam">Europe/Amsterdam (CET)</option>
                  <option value="America/New_York">America/New York (EST)</option>
                  <option value="America/Los_Angeles">America/Los Angeles (PST)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-linear border flex items-center gap-3 ${
          message.type === 'success'
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {message.type === 'success' ? (
            <Check className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-4">
        <p className="text-sm dark:text-text-tertiary light:text-text-light-tertiary">
          Transactional emails like receipts will always be sent regardless of your preferences.
        </p>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 dark:bg-linear-accent light:bg-linear-light-accent dark:text-linear-bg light:text-linear-light-bg rounded-linear font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}
