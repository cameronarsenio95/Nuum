import { useState } from 'react';
import { useSupportAuth } from '../contexts/SupportAuthContext';
import { SupportDashboardLayout } from '../components/support/SupportDashboardLayout';
import { CustomerSearch } from '../components/support/CustomerSearch';
import { CustomerDetailView } from '../components/support/CustomerDetailView';
import { AuditLogViewer } from '../components/support/AuditLogViewer';
import { TicketsView } from '../components/support/TicketsView';
import { DNSManagementView } from '../components/support/DNSManagementView';
import { SupportLogin } from './SupportLogin';

export function SupportDashboard() {
  const { user, supportStaff, loading } = useSupportAuth();
  const [currentView, setCurrentView] = useState<'tickets' | 'customers' | 'search' | 'audit-logs' | 'dns' | 'settings'>('tickets');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

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
    <SupportDashboardLayout currentView={currentView} onViewChange={setCurrentView}>
      {currentView === 'tickets' && <TicketsView />}

      {currentView === 'search' && (
        <>
          {selectedCustomerId ? (
            <CustomerDetailView
              workspaceId={selectedCustomerId}
              onBack={() => setSelectedCustomerId(null)}
            />
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-medium mb-2">Customer Search</h2>
                <p className="dark:text-text-secondary light:text-text-light-secondary">
                  Search and manage customer accounts, subscriptions, and settings
                </p>
              </div>
              <CustomerSearch onSelectCustomer={(customer) => setSelectedCustomerId(customer.workspace.id)} />
            </>
          )}
        </>
      )}

      {currentView === 'customers' && (
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

      {currentView === 'audit-logs' && <AuditLogViewer />}

      {currentView === 'dns' && <DNSManagementView />}

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
