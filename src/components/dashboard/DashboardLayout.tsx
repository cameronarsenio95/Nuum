import { NotificationBell } from './NotificationBell';
import { useState, useEffect } from 'react';
import { LogOut, LayoutDashboard, Users, Target, CheckSquare, Settings as SettingsIcon, User as UserIcon, Image, FileText, CreditCard, Headphones as HeadphonesIcon, Menu, X, BarChart3, ShoppingBag, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePlanLimits } from '../../contexts/PlanLimitsContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ThemeToggle } from '../ThemeToggle';
import { TrialBanner } from './TrialBanner';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';
import { NUUM_COLORS, TRANSITIONS } from '../../utils/designSystem';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface DashboardLayoutProps {
  workspace: Workspace;
  currentView: 'overview' | 'campaigns' | 'creators' | 'tasks' | 'team' | 'content' | 'notions' | 'contact' | 'settings' | 'billing' | 'analytics' | 'shopify';
  onViewChange: (view: 'overview' | 'campaigns' | 'creators' | 'tasks' | 'team' | 'content' | 'notions' | 'contact' | 'settings' | 'billing' | 'analytics' | 'shopify') => void;
  children: React.ReactNode;
}

export function DashboardLayout({ workspace, currentView, onViewChange, children }: DashboardLayoutProps) {
  const { signOut, user } = useAuth();
  const { trialInfo, freeAccountInfo } = usePlanLimits();
  const { theme } = useTheme();
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
    { name: 'Analytics', value: 'analytics' as const, icon: BarChart3 },
    { name: 'Campaigns', value: 'campaigns' as const, icon: Target },
    { name: 'Creators', value: 'creators' as const, icon: Users },
    { name: 'Content', value: 'content' as const, icon: Image },
    { name: 'Tasks', value: 'tasks' as const, icon: CheckSquare },
    { name: 'Notes', value: 'notions' as const, icon: FileText },
    { name: 'Shopify', value: 'shopify' as const, icon: ShoppingBag },
    { name: 'Team', value: 'team' as const, icon: SettingsIcon },
  ];

  const isNavigationDisabled = (itemValue: string) => {
    if (!freeAccountInfo.isFrozen) return false;
    return !['billing', 'settings', 'contact'].includes(itemValue);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: NUUM_COLORS.background }}>
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg border transition-all duration-150"
        style={{ backgroundColor: NUUM_COLORS.surface, borderColor: NUUM_COLORS.border }}
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" style={{ color: NUUM_COLORS.textPrimary }} /> : <Menu className="w-6 h-6" style={{ color: NUUM_COLORS.textPrimary }} />}
      </button>

      <div className="flex h-screen">
        <aside className={`w-64 border-r flex flex-col fixed lg:static inset-y-0 left-0 z-40 transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`} style={{ backgroundColor: NUUM_COLORS.surface, borderColor: NUUM_COLORS.border }}>
          <div className="p-6 border-b" style={{ borderColor: NUUM_COLORS.border }}>
            <div className="flex items-center gap-3">
              <img
                src={theme === 'dark' ? '/assets/members/nuum - White Mark.png' : '/assets/members/nuum - Black Mark.png'}
                alt="NUUM"
                className="h-8 w-8 flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h1 className="font-semibold text-sm truncate" style={{ color: NUUM_COLORS.textPrimary }}>{profile?.company || workspace.name}</h1>
                <span className="text-xs px-2 py-0.5 rounded-full border capitalize inline-block" style={{
                  color: workspace.plan === 'free' ? '#9CA3AF' : workspace.plan === 'standard' ? '#60A5FA' : workspace.plan === 'elite' ? NUUM_COLORS.accent : '#A78BFA',
                  backgroundColor: workspace.plan === 'free' ? 'rgba(156, 163, 175, 0.1)' : workspace.plan === 'standard' ? 'rgba(96, 165, 250, 0.1)' : workspace.plan === 'elite' ? 'rgba(42, 83, 208, 0.1)' : 'rgba(167, 139, 250, 0.1)',
                  borderColor: workspace.plan === 'free' ? 'rgba(156, 163, 175, 0.2)' : workspace.plan === 'standard' ? 'rgba(96, 165, 250, 0.2)' : workspace.plan === 'elite' ? 'rgba(42, 83, 208, 0.2)' : 'rgba(167, 139, 250, 0.2)'
                }}>{workspace.plan}</span>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.value;
                const isDisabled = isNavigationDisabled(item.value);
                return (
                  <li key={item.value} className="relative group">
                    <button
                      type="button"
                      onClick={() => {
                        if (!isDisabled) {
                          onViewChange(item.value);
                          setIsMobileMenuOpen(false);
                        }
                      }}
                      disabled={isDisabled}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150"
                      style={{
                        color: isDisabled ? NUUM_COLORS.textTertiary : isActive ? NUUM_COLORS.textPrimary : NUUM_COLORS.textSecondary,
                        backgroundColor: isActive ? NUUM_COLORS.surfaceHover : 'transparent',
                        borderLeft: isActive ? `2px solid ${NUUM_COLORS.accent}` : '2px solid transparent',
                        opacity: isDisabled ? 0.4 : 1,
                        cursor: isDisabled ? 'not-allowed' : 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        if (!isDisabled && !isActive) {
                          e.currentTarget.style.color = NUUM_COLORS.textPrimary;
                          e.currentTarget.style.backgroundColor = NUUM_COLORS.surfaceHover;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isDisabled && !isActive) {
                          e.currentTarget.style.color = NUUM_COLORS.textSecondary;
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {isDisabled ? <Lock className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                      {item.name}
                    </button>
                    {isDisabled && (
                      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-red-500 text-white text-xs rounded-linear whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none linear-transition z-50 shadow-lg">
                        Upgrade required to access
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="p-4 border-t space-y-1" style={{ borderColor: NUUM_COLORS.border }}>
            <div className="flex items-center justify-between mb-2 px-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium" style={{ color: NUUM_COLORS.textTertiary }}>
                  Theme
                </span>
                <ThemeToggle />
              </div>
              <NotificationBell />
            </div>

            <button
              type="button"
              onClick={() => {
                onViewChange('contact');
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150"
              style={{
                color: currentView === 'contact' ? NUUM_COLORS.textPrimary : NUUM_COLORS.textSecondary,
                backgroundColor: currentView === 'contact' ? NUUM_COLORS.surfaceHover : 'transparent',
                borderLeft: currentView === 'contact' ? `2px solid ${NUUM_COLORS.accent}` : '2px solid transparent'
              }}
              onMouseEnter={(e) => {
                if (currentView !== 'contact') {
                  e.currentTarget.style.color = NUUM_COLORS.textPrimary;
                  e.currentTarget.style.backgroundColor = NUUM_COLORS.surfaceHover;
                }
              }}
              onMouseLeave={(e) => {
                if (currentView !== 'contact') {
                  e.currentTarget.style.color = NUUM_COLORS.textSecondary;
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
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
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150"
              style={{
                color: currentView === 'settings' ? NUUM_COLORS.textPrimary : NUUM_COLORS.textSecondary,
                backgroundColor: currentView === 'settings' ? NUUM_COLORS.surfaceHover : 'transparent',
                borderLeft: currentView === 'settings' ? `2px solid ${NUUM_COLORS.accent}` : '2px solid transparent'
              }}
              onMouseEnter={(e) => {
                if (currentView !== 'settings') {
                  e.currentTarget.style.color = NUUM_COLORS.textPrimary;
                  e.currentTarget.style.backgroundColor = NUUM_COLORS.surfaceHover;
                }
              }}
              onMouseLeave={(e) => {
                if (currentView !== 'settings') {
                  e.currentTarget.style.color = NUUM_COLORS.textSecondary;
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
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
                freeAccountInfo.isFrozen
                  ? currentView === 'billing'
                    ? 'dark:bg-red-500/20 dark:text-red-400 light:bg-red-500/20 light:text-red-400 border border-red-500/30'
                    : 'dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-500/10 light:text-red-400 light:hover:text-red-300 light:hover:bg-red-500/10 border border-red-500/20'
                  : currentView === 'billing'
                  ? 'dark:bg-linear-bg-subtle dark:text-text-primary light:bg-linear-light-bg-subtle light:text-text-light-primary'
                  : 'dark:text-text-secondary dark:hover:text-text-primary dark:hover:bg-linear-bg-subtle light:text-text-light-secondary light:hover:text-text-light-primary light:hover:bg-linear-light-bg-subtle'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Billing
              {freeAccountInfo.isFrozen && (
                <span className="ml-auto text-xs px-2 py-0.5 bg-red-500 text-white rounded-full animate-pulse">
                  Action Required
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: NUUM_COLORS.textSecondary }}
              onMouseEnter={(e) => {
                if (!isSigningOut) {
                  e.currentTarget.style.color = NUUM_COLORS.textPrimary;
                  e.currentTarget.style.backgroundColor = NUUM_COLORS.surfaceHover;
                }
              }}
              onMouseLeave={(e) => {
                if (!isSigningOut) {
                  e.currentTarget.style.color = NUUM_COLORS.textSecondary;
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
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
            <TrialBanner
              daysRemaining={trialInfo.daysRemaining}
              onUpgradeClick={() => onViewChange('billing')}
            />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
