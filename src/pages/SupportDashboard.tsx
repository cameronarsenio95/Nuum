import { useState } from 'react';
import { useSupportAuth } from '../contexts/SupportAuthContext';
import { SupportDashboardLayout } from '../components/support/SupportDashboardLayout';
import { SupportOverviewView } from '../components/support/SupportOverviewView';
import { CustomerSearch } from '../components/support/CustomerSearch';
import { CustomerDetailView } from '../components/support/CustomerDetailView';
import { AuditLogViewer } from '../components/support/AuditLogViewer';
import { TicketsView } from '../components/support/TicketsView';
import { SupportLogin } from './SupportLogin';

export function SupportDashboard() {
  const { user, supportStaff, loading } = useSupportAuth();
  const [currentView, setCurrentView] = useState<'overview' | 'tickets' | 'customers' | 'audit-logs' | 'settings'>('overview');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const handleViewChange = (view: 'overview' | 'tickets' | 'customers' | 'audit-logs' | 'settings') => {
    setSelectedCustomerId(null);
    setCurrentView(view);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-linear-bg light:bg-linear-light-bg">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-linear-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 dark:text-text-secondary light:text-text-light-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !supportStaff) {
    return <SupportLogin />;
  }

  return (
    <SupportDashboardLayout currentView={currentView} onViewChange={handleViewChange}>
      {currentView === 'overview' && <SupportOverviewView />}

      {currentView === 'tickets' && <TicketsView />}

      {currentView === 'customers' && (
        <>
          {selectedCustomerId ? (
            <CustomerDetailView
              workspaceId={selectedCustomerId}
              onBack={() => setSelectedCustomerId(null)}
            />
          ) : (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-medium mb-2">All Customers</h2>
                <p className="dark:text-text-secondary light:text-text-light-secondary">
                  Browse all customer workspaces
                </p>
              </div>
              <CustomerSearch onSelectCustomer={(customer) => setSelectedCustomerId(customer.workspace.id)} />
            </div>
          )}
        </>
      )}

      {currentView === 'audit-logs' && <AuditLogViewer />}

      {currentView === 'settings' && (
        <div>
          <h2 className="text-2xl font-medium mb-2">Support Settings</h2>
          <p className="dark:text-text-secondary light:text-text-light-secondary mb-6">
            Manage support staff and system settings
          </p>
          <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear p-8 text-center">
            <p className="dark:text-text-tertiary light:text-text-light-tertiary">
              Settings management coming soon
            </p>
          </div>
        </div>
      )}
    </SupportDashboardLayout>
  );
}
