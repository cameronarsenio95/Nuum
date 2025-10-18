import { useState, useEffect } from 'react';
import { Save, User, Crown, Zap, TrendingUp, Users, HardDrive, Target, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { usePlanLimits } from '../../contexts/PlanLimitsContext';
import { UpgradeModal } from '../modals/UpgradeModal';
import { AccountSettings } from './AccountSettings';
import { EmailPreferences } from './EmailPreferences';
import { WorkspaceSettings } from './WorkspaceSettings';
import type { Database } from '../../lib/database.types';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface SettingsViewProps {
  workspace: Workspace;
}

type SettingsTab = 'profile' | 'email' | 'account';

export function SettingsView({ workspace }: SettingsViewProps) {
  const { user } = useAuth();
  const { usage, limits, trialInfo, getCreatorUsagePercent, getStorageUsagePercent, getTeamMemberUsagePercent, isTrialExpiringSoon } = usePlanLimits();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    company: '',
    job_title: '',
    bio: '',
    avatar_url: '',
    timezone: 'UTC',
    language: 'en',
    notifications_enabled: true,
  });

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error loading profile:', error);
    } else if (data) {
      setProfile({
        full_name: data.full_name || '',
        phone: data.phone || '',
        company: data.company || '',
        job_title: data.job_title || '',
        bio: data.bio || '',
        avatar_url: data.avatar_url || '',
        timezone: data.timezone || 'UTC',
        language: data.language || 'en',
        notifications_enabled: data.notifications_enabled ?? true,
      });
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage(null);

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    let error;

    if (existingProfile) {
      const result = await supabase
        .from('profiles')
        .update({
          ...profile,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      error = result.error;
    } else {
      const result = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          ...profile,
        });
      error = result.error;
    }

    if (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: 'Failed to save profile. Please try again.' });
    } else {
      if (profile.full_name) {
        const { data: workspaceData } = await supabase
          .from('workspaces')
          .select('id, name')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (workspaceData && workspaceData.name.includes('@')) {
          await supabase
            .from('workspaces')
            .update({ name: `${profile.full_name}'s Workspace` })
            .eq('id', workspaceData.id);
        }
      }

      setMessage({ type: 'success', text: 'Profile saved successfully!' });
      setTimeout(() => {
        setMessage(null);
        window.location.reload();
      }, 1500);
    }

    setSaving(false);
  };

  if (loading) {
    return <div className="dark:text-text-secondary light:text-text-light-secondary">Loading settings...</div>;
  }

  const getPlanIcon = () => {
    switch (workspace.plan) {
      case 'elite':
        return Crown;
      case 'enterprise':
        return Target;
      default:
        return Zap;
    }
  };

  const getPlanColor = () => {
    switch (workspace.plan) {
      case 'free':
        return 'text-gray-400';
      case 'standard':
        return 'text-blue-400';
      case 'elite':
        return 'text-linear-accent';
      case 'enterprise':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-3xl">
        <div className="mb-8">
          <h2 className="text-2xl font-medium mb-2">Settings</h2>
          <p className="dark:text-text-secondary light:text-text-light-secondary">Manage your profile and preferences</p>
        </div>

        <div className="flex gap-2 mb-6 border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 font-medium text-sm transition-colors relative ${
              activeTab === 'profile'
                ? 'dark:text-text-primary light:text-text-light-primary'
                : 'dark:text-text-tertiary light:text-text-light-tertiary hover:text-text-secondary'
            }`}
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </div>
            {activeTab === 'profile' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-accent" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`px-4 py-2.5 font-medium text-sm transition-colors relative ${
              activeTab === 'email'
                ? 'dark:text-text-primary light:text-text-light-primary'
                : 'dark:text-text-tertiary light:text-text-light-tertiary hover:text-text-secondary'
            }`}
          >
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Notifications
            </div>
            {activeTab === 'email' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-accent" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`px-4 py-2.5 font-medium text-sm transition-colors relative ${
              activeTab === 'account'
                ? 'dark:text-text-primary light:text-text-light-primary'
                : 'dark:text-text-tertiary light:text-text-light-tertiary hover:text-text-secondary'
            }`}
          >
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Account & Security
            </div>
            {activeTab === 'account' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-accent" />
            )}
          </button>
        </div>
        {trialInfo.isActive && (
          <div className={`p-6 rounded-linear-lg mb-6 border-2 ${
            isTrialExpiringSoon()
              ? 'bg-red-500/10 border-red-500/30'
              : 'bg-green-500/10 border-green-500/30'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-linear-accent" />
                <div>
                  <h3 className="text-lg font-medium">7-Day Trial Active</h3>
                  <p className="text-sm dark:text-text-secondary light:text-text-light-secondary">
                    You're experiencing all Elite features
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{trialInfo.daysRemaining}</div>
                <div className="text-sm dark:text-text-tertiary light:text-text-light-tertiary">
                  {trialInfo.daysRemaining === 1 ? 'day' : 'days'} remaining
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="flex-1 py-2.5 bg-linear-accent hover:bg-linear-accent-hover text-linear-bg rounded-linear text-sm font-medium linear-transition"
              >
                Upgrade Now to Keep Access
              </button>
              {isTrialExpiringSoon() && (
                <div className="text-sm dark:text-text-tertiary light:text-text-light-tertiary">
                  Trial expires {trialInfo.endsAt ? new Date(trialInfo.endsAt).toLocaleDateString() : 'soon'}
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t dark:border-linear-border-subtle light:border-linear-light-border-subtle">
              <p className="text-xs dark:text-text-tertiary light:text-text-light-tertiary mb-2">
                After trial ends, upgrade to unlock more features:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs dark:text-text-secondary light:text-text-light-secondary">
                <div>• Elite: 50 creators</div>
                <div>• Elite: 25GB storage</div>
                <div>• Elite: Advanced analytics</div>
                <div>• Elite: Revenue tracking</div>
                <div>• Elite: 5 team members</div>
                <div>• Elite: Priority support</div>
              </div>
            </div>
          </div>
        )}

        <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium flex items-center gap-2">
              {(() => {
                const Icon = getPlanIcon();
                return <Icon className={`w-5 h-5 ${getPlanColor()}`} />;
              })()}
              Your Plan
            </h3>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPlanColor()} dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle border dark:border-linear-border light:border-linear-light-border`}>
                {trialInfo.isActive ? '7-Day Trial' : workspace.plan.charAt(0).toUpperCase() + workspace.plan.slice(1)}
              </span>
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-linear-accent hover:bg-linear-accent-hover text-linear-bg rounded-linear text-sm font-medium linear-transition"
              >
                <TrendingUp className="w-4 h-4" />
                Upgrade
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary" />
                  Creators
                </span>
                <span className="text-sm dark:text-text-secondary light:text-text-light-secondary">
                  {usage.creatorCount} / {limits.maxCreators === null ? '∞' : limits.maxCreators}
                </span>
              </div>
              {limits.maxCreators !== null && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-full overflow-hidden">
                    <div
                      className={`h-full linear-transition ${
                        getCreatorUsagePercent() >= 100
                          ? 'bg-linear-error'
                          : getCreatorUsagePercent() >= 90
                          ? 'bg-linear-warning'
                          : 'bg-linear-accent'
                      }`}
                      style={{ width: `${Math.min(getCreatorUsagePercent(), 100)}%` }}
                    />
                  </div>
                  <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary w-12 text-right">
                    {getCreatorUsagePercent().toFixed(0)}%
                  </span>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <HardDrive className="w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary" />
                  Storage
                </span>
                <span className="text-sm dark:text-text-secondary light:text-text-light-secondary">
                  {formatBytes(usage.storageUsedBytes)} / {limits.maxStorageGb === null ? '∞' : `${limits.maxStorageGb}GB`}
                </span>
              </div>
              {limits.maxStorageGb !== null && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-full overflow-hidden">
                    <div
                      className={`h-full linear-transition ${
                        getStorageUsagePercent() >= 100
                          ? 'bg-linear-error'
                          : getStorageUsagePercent() >= 90
                          ? 'bg-linear-warning'
                          : 'bg-linear-accent'
                      }`}
                      style={{ width: `${Math.min(getStorageUsagePercent(), 100)}%` }}
                    />
                  </div>
                  <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary w-12 text-right">
                    {getStorageUsagePercent().toFixed(0)}%
                  </span>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary" />
                  Team Members
                </span>
                <span className="text-sm dark:text-text-secondary light:text-text-light-secondary">
                  {usage.teamMemberCount} / {limits.maxTeamMembers === null ? '∞' : limits.maxTeamMembers}
                </span>
              </div>
              {limits.maxTeamMembers !== null && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-full overflow-hidden">
                    <div
                      className={`h-full linear-transition ${
                        getTeamMemberUsagePercent() >= 100
                          ? 'bg-linear-error'
                          : getTeamMemberUsagePercent() >= 90
                          ? 'bg-linear-warning'
                          : 'bg-linear-accent'
                      }`}
                      style={{ width: `${Math.min(getTeamMemberUsagePercent(), 100)}%` }}
                    />
                  </div>
                  <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary w-12 text-right">
                    {getTeamMemberUsagePercent().toFixed(0)}%
                  </span>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Target className="w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary" />
                  Campaigns
                </span>
                <span className="text-sm dark:text-text-secondary light:text-text-light-secondary">
                  {usage.campaignCount}
                </span>
              </div>
              <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">
                Unlimited campaigns
              </div>
            </div>
          </div>

          {workspace.subscription_status && workspace.subscription_status === 'expired' && (
            <div className="mt-6 p-4 bg-linear-error/10 border border-linear-error/20 rounded-linear">
              <p className="text-sm text-linear-error font-medium mb-2">
                Your trial has expired. Upgrade to continue using all features.
              </p>
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="text-sm text-linear-error underline hover:no-underline"
              >
                View upgrade options →
              </button>
            </div>
          )}
          {workspace.subscription_status && workspace.subscription_status !== 'active' && workspace.subscription_status !== 'trialing' && workspace.subscription_status !== 'expired' && (
            <div className="mt-6 p-4 bg-linear-warning/10 border border-linear-warning-border/20 rounded-linear">
              <p className="text-sm text-linear-warning">
                Your subscription is currently {workspace.subscription_status}.
                {workspace.subscription_expires_at && (
                  <span> Expires on {new Date(workspace.subscription_expires_at).toLocaleDateString()}.</span>
                )}
              </p>
            </div>
          )}
        </div>

        {activeTab === 'email' && <EmailPreferences />}

        {activeTab === 'account' && (
          <AccountSettings
            profile={profile}
            onAvatarUpdate={(url) => setProfile({ ...profile, avatar_url: url })}
          />
        )}

        {activeTab === 'profile' && (
        <form onSubmit={handleSave} className="space-y-8">
          <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-6">
            <h3 className="text-lg font-medium mb-6 flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-2 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle border dark:border-linear-border light:border-linear-light-border rounded-linear dark:text-text-tertiary light:text-text-light-tertiary cursor-not-allowed"
                />
                <p className="text-xs dark:text-text-tertiary light:text-text-light-tertiary mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                  placeholder="John Doe"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                    placeholder="+31 6 12345678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Company</label>
                  <input
                    type="text"
                    value={profile.company}
                    onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                    className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                    placeholder="Company Name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Job Title</label>
                <input
                  type="text"
                  value={profile.job_title}
                  onChange={(e) => setProfile({ ...profile, job_title: e.target.value })}
                  className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                  placeholder="Marketing Manager"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Bio</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent h-24"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>
          </div>

          <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-6">
            <h3 className="text-lg font-medium mb-6">Preferences</h3>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Timezone</label>
                  <select
                    value={profile.timezone}
                    onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                    className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                  >
                    <option value="UTC">UTC</option>
                    <option value="Europe/Amsterdam">Europe/Amsterdam</option>
                    <option value="America/New_York">America/New York</option>
                    <option value="America/Los_Angeles">America/Los Angeles</option>
                    <option value="Asia/Tokyo">Asia/Tokyo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Language</label>
                  <select
                    value={profile.language}
                    onChange={(e) => setProfile({ ...profile, language: e.target.value })}
                    className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                  >
                    <option value="en">English</option>
                    <option value="nl">Nederlands</option>
                    <option value="de">Deutsch</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 px-4 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear">
                <div>
                  <p className="font-medium text-sm">Email Notifications</p>
                  <p className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Receive email updates about your campaigns and tasks</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.notifications_enabled}
                    onChange={(e) => setProfile({ ...profile, notifications_enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-linear-accent rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:dark:bg-linear-accent light:bg-linear-light-accent dark:text-linear-bg light:text-linear-light-bg"></div>
                </label>
              </div>
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-linear border ${
              message.type === 'success'
                ? 'bg-linear-success/10 border-linear-success-border/20 text-linear-success'
                : 'bg-linear-error/10 border-linear-error-border/20 text-linear-error'
            }`}>
              {message.text}
            </div>
          )}

          <div className="flex justify-center pb-8">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
        )}

        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          currentPlan={workspace.plan}
          workspaceId={workspace.id}
          reason="Compare plans and choose the one that fits your needs."
          trialDaysRemaining={trialInfo.daysRemaining}
          isTrialActive={trialInfo.isActive}
        />
        </div>
    </div>
  );
}
