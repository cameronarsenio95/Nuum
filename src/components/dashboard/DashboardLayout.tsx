import { useState, useEffect } from 'react';
import { LogOut, LayoutDashboard, Users, Target, CheckSquare, Settings as SettingsIcon, User as UserIcon, Image, FileText, CreditCard, Headphones as HeadphonesIcon, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePlanLimits } from '../../contexts/PlanLimitsContext';
import { TrialBanner } from './TrialBanner';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface DashboardLayoutProps {
  workspace: Workspace;
  currentView: 'overview' | 'campaigns' | 'creators' | 'tasks' | 'team' | 'content' | 'notions' | 'contact' | 'settings' | 'billing';
  onViewChange: (view: 'overview' | 'campaigns' | 'creators' | 'tasks' | 'team' | 'content' | 'notions' | 'contact' | 'settings' | 'billing') => void;
  children: React.ReactNode;
}

export function DashboardLayout({ workspace, currentView, onViewChange, children }: DashboardLayoutProps) {
  const { signOut, user } = useAuth();
  const { trialInfo } = usePlanLimits();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showTrialUpgrade, setShowTrialUpgrade] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      setProfile(data);
    }
  };

  const handleSignOut = async () => {
    if (isSigningOut) return;

    console.log('Sign out clicked');
    setIsSigningOut(true);

    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      setIsSigningOut(false);
    }
  };

  const navigation = [
    { name: 'Overview', value: 'overview' as const, icon: LayoutDashboard },
    { name: 'Campaigns', value: 'campaigns' as const, icon: Target },
    { name: 'Creators', value: 'creators' as const, icon: Users },
    { name: 'Tasks', value: 'tasks' as const, icon: CheckSquare },
    { name: 'Content', value: 'content' as const, icon: Image },
    { name: 'Notes', value: 'notions' as const, icon: FileText },
    { name: 'Team', value: 'team' as const, icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen dark:dark:bg-linear-bg light:bg-linear-light-bg light:bg-linear-light-bg">
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <div className="flex h-screen">
        <aside className={`w-64 border-r flex flex-col dark:dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary dark:dark:border-linear-border light:border-linear-light-border light:bg-linear-light-bg-secondary light:border-linear-light-border fixed lg:static inset-y-0 left-0 z-40 transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="p-6 border-b dark:dark:border-linear-border light:border-linear-light-border light:border-linear-light-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-linear flex items-center justify-center flex-shrink-0 dark:dark:bg-linear-accent light:bg-linear-light-accent dark:dark:text-linear-bg light:text-linear-light-bg light:bg-linear-light-accent light:text-linear-light-bg">
                <LayoutDashboard className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="font-medium text-sm truncate dark:dark:text-text-primary light:text-text-light-primary light:text-text-light-primary">{profile?.company || workspace.name}</h1>
                <span className={`text-xs px-2 py-0.5 rounded-full border capitalize inline-block ${
                  workspace.plan === 'free' ? 'text-gray-400 bg-gray-400/10 border-gray-400/20' :
                  workspace.plan === 'standard' ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' :
                  workspace.plan === 'elite' ? 'text-linear-accent bg-linear-accent/10 border-linear-accent/20' :
                  'text-purple-400 bg-purple-400/10 border-purple-400/20'
                }`}>{workspace.plan}</span>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.value;
                return (
                  <li key={item.value}>
                    <button
                      type="button"
                      onClick={() => {
                        onViewChange(item.value);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-linear text-sm linear-transition ${
                        isActive
                          ? 'dark:bg-linear-bg-subtle dark:text-text-primary light:bg-linear-light-bg-subtle light:text-text-light-primary'
                          : 'dark:text-text-secondary dark:hover:text-text-primary dark:hover:bg-linear-bg-subtle light:text-text-light-secondary light:hover:text-text-light-primary light:hover:bg-linear-light-bg-subtle'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="p-4 border-t space-y-1 dark:dark:border-linear-border light:border-linear-light-border light:border-linear-light-border">
            <button
              type="button"
              onClick={() => {
                onViewChange('contact');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-linear text-sm linear-transition ${
                currentView === 'contact'
                  ? 'dark:bg-linear-bg-subtle dark:text-text-primary light:bg-linear-light-bg-subtle light:text-text-light-primary'
                  : 'dark:text-text-secondary dark:hover:text-text-primary dark:hover:bg-linear-bg-subtle light:text-text-light-secondary light:hover:text-text-light-primary light:hover:bg-linear-light-bg-subtle'
              }`}
            >
              <HeadphonesIcon className="w-4 h-4" />
              Contact
            </button>
            <button
              type="button"
              onClick={() => {
                onViewChange('settings');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-linear text-sm linear-transition ${
                currentView === 'settings'
                  ? 'dark:bg-linear-bg-subtle dark:text-text-primary light:bg-linear-light-bg-subtle light:text-text-light-primary'
                  : 'dark:text-text-secondary dark:hover:text-text-primary dark:hover:bg-linear-bg-subtle light:text-text-light-secondary light:hover:text-text-light-primary light:hover:bg-linear-light-bg-subtle'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              Settings
            </button>
            <button
              type="button"
              onClick={() => {
                onViewChange('billing');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-linear text-sm linear-transition ${
                currentView === 'billing'
                  ? 'dark:bg-linear-bg-subtle dark:text-text-primary light:bg-linear-light-bg-subtle light:text-text-light-primary'
                  : 'dark:text-text-secondary dark:hover:text-text-primary dark:hover:bg-linear-bg-subtle light:text-text-light-secondary light:hover:text-text-light-primary light:hover:bg-linear-light-bg-subtle'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Billing
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-linear text-sm linear-transition dark:text-text-secondary light:text-text-light-secondary dark:hover:text-text-primary light:hover:text-text-light-primary dark:hover:bg-linear-bg-subtle light:hover:bg-linear-light-bg-subtle disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut className="w-4 h-4" />
              {isSigningOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </aside>

        {isMobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <main className="flex-1 overflow-auto lg:ml-0">
          <div className="p-4 md:p-8 pt-16 lg:pt-8">
            {trialInfo.isActive && (
              <TrialBanner
                daysRemaining={trialInfo.daysRemaining}
                onUpgradeClick={() => onViewChange('settings')}
              />
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
