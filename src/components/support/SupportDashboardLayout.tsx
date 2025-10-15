import { ReactNode } from 'react';
import { LogOut, Users, Search, FileText, Settings, Shield, MessageSquare } from 'lucide-react';
import { useSupportAuth } from '../../contexts/SupportAuthContext';
import { ThemeToggle } from '../ThemeToggle';

interface SupportDashboardLayoutProps {
  currentView: 'tickets' | 'customers' | 'search' | 'audit-logs' | 'settings';
  onViewChange: (view: 'tickets' | 'customers' | 'search' | 'audit-logs' | 'settings') => void;
  children: ReactNode;
}

export function SupportDashboardLayout({ currentView, onViewChange, children }: SupportDashboardLayoutProps) {
  const { supportStaff, signOut, hasPermission } = useSupportAuth();

  const navigation = [
    { name: 'Tickets', value: 'tickets' as const, icon: MessageSquare, permission: 'view' as const },
    { name: 'Search', value: 'search' as const, icon: Search, permission: 'view' as const },
    { name: 'Customers', value: 'customers' as const, icon: Users, permission: 'view' as const },
    { name: 'Audit Logs', value: 'audit-logs' as const, icon: FileText, permission: 'view' as const },
    { name: 'Settings', value: 'settings' as const, icon: Settings, permission: 'admin' as const },
  ];

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'support_admin':
        return 'text-linear-error bg-linear-error/10 border-linear-error-border/20';
      case 'support_agent':
        return 'text-linear-accent bg-linear-accent/10 border-linear-accent-border/20';
      case 'support_viewer':
        return 'text-linear-info bg-linear-info/10 border-linear-info-border/20';
      default:
        return 'text-text-tertiary bg-text-tertiary/10 border-linear-border/20';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'support_admin':
        return 'Admin';
      case 'support_agent':
        return 'Agent';
      case 'support_viewer':
        return 'Viewer';
      default:
        return role;
    }
  };

  return (
    <div className="min-h-screen dark:bg-linear-bg light:bg-linear-light-bg">
      <div className="flex h-screen">
        <aside className="w-64 border-r flex flex-col dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary dark:border-linear-border light:border-linear-light-border">
          <div className="p-6 border-b dark:border-linear-border light:border-linear-light-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-linear flex items-center justify-center flex-shrink-0 bg-linear-error dark:text-linear-bg light:text-white">
                <Shield className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="font-medium text-sm truncate dark:text-text-primary light:text-text-light-primary">Support Dashboard</h1>
                <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Customer Management</span>
              </div>
            </div>

            {supportStaff && (
              <div className="p-3 rounded-linear dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border-subtle light:border-linear-light-border-subtle">
                <div className="text-sm font-medium dark:text-text-primary light:text-text-light-primary mb-1">
                  {supportStaff.full_name}
                </div>
                <div className="text-xs dark:text-text-secondary light:text-text-light-secondary mb-2">
                  {supportStaff.email}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border inline-block ${getRoleBadgeColor(supportStaff.role)}`}>
                  {getRoleLabel(supportStaff.role)}
                </span>
              </div>
            )}
          </div>

          <nav className="flex-1 p-4">
            <ul className="space-y-1">
              {navigation.map((item) => {
                if (!hasPermission(item.permission)) return null;

                const Icon = item.icon;
                const isActive = currentView === item.value;

                return (
                  <li key={item.value}>
                    <button
                      onClick={() => onViewChange(item.value)}
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

          <div className="p-4 border-t space-y-1 dark:border-linear-border light:border-linear-light-border">
            <div className="flex items-center justify-between mb-2 px-3">
              <span className="text-xs font-medium dark:text-text-tertiary light:text-text-light-tertiary">Theme</span>
              <ThemeToggle />
            </div>
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-linear text-sm linear-transition dark:text-text-secondary light:text-text-light-secondary dark:hover:text-text-primary light:hover:text-text-light-primary dark:hover:bg-linear-bg-subtle light:hover:bg-linear-light-bg-subtle"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-auto">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
