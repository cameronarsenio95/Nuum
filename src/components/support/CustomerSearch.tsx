import { useState, useEffect } from 'react';
import { Search, X, Filter, Mail, Calendar, CreditCard, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSupportAuth } from '../../contexts/SupportAuthContext';
import type { Database } from '../../lib/database.types';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface CustomerResult {
  workspace: Workspace;
  owner: Profile;
  ownerEmail: string;
  creatorCount: number;
  campaignCount: number;
  teamMemberCount: number;
}

interface CustomerSearchProps {
  onSelectCustomer: (customer: CustomerResult) => void;
}

export function CustomerSearch({ onSelectCustomer }: CustomerSearchProps) {
  const { logAction } = useSupportAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<CustomerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    plan: 'all',
    subscriptionStatus: 'all',
  });

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchCustomers();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setResults([]);
    }
  }, [searchQuery, filters]);

  const searchCustomers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('workspaces')
        .select('*')
        .or(`name.ilike.%${searchQuery}%,slug.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (filters.plan !== 'all') {
        query = query.eq('plan', filters.plan);
      }
      if (filters.subscriptionStatus !== 'all') {
        query = query.eq('subscription_status', filters.subscriptionStatus);
      }

      const { data: workspaces, error: workspaceError } = await query;

      if (workspaceError) throw workspaceError;

      if (!workspaces || workspaces.length === 0) {
        setResults([]);
        return;
      }

      const customerResults: CustomerResult[] = [];

      for (const workspace of workspaces) {
        const { data: ownerData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', workspace.owner_id)
          .maybeSingle();

        const { data: userData } = await supabase.auth.admin.getUserById(workspace.owner_id);

        const { count: creatorCount } = await supabase
          .from('creators')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspace.id);

        const { count: campaignCount } = await supabase
          .from('campaigns')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspace.id);

        const { count: teamMemberCount } = await supabase
          .from('workspace_members')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspace.id);

        customerResults.push({
          workspace,
          owner: ownerData || {} as Profile,
          ownerEmail: userData?.user?.email || 'No email',
          creatorCount: creatorCount || 0,
          campaignCount: campaignCount || 0,
          teamMemberCount: (teamMemberCount || 0) + 1,
        });
      }

      setResults(customerResults);

      await logAction('view_customer', 'workspace', '', {
        actionDetails: { search_query: searchQuery, results_count: customerResults.length },
      });
    } catch (error) {
      console.error('Error searching customers:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'elite':
        return 'text-linear-accent bg-linear-accent/10 border-linear-accent/20';
      case 'standard':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'free':
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
      default:
        return 'text-text-tertiary bg-text-tertiary/10 border-linear-border/20';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-linear-success bg-linear-success/10 border-linear-success-border/20';
      case 'trialing':
        return 'text-linear-info bg-linear-info/10 border-linear-info-border/20';
      case 'past_due':
        return 'text-linear-warning bg-linear-warning/10 border-linear-warning-border/20';
      case 'canceled':
      case 'expired':
        return 'text-linear-error bg-linear-error/10 border-linear-error-border/20';
      default:
        return 'text-text-tertiary bg-text-tertiary/10 border-linear-border/20';
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 dark:text-text-tertiary light:text-text-light-tertiary" />
            <input
              type="text"
              placeholder="Search by workspace name, slug, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent text-base"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-linear"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-linear linear-transition border ${
              showFilters
                ? 'dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle dark:border-linear-border light:border-linear-light-border'
                : 'dark:bg-linear-bg-secondary light:bg-white dark:border-linear-border-subtle light:border-linear-light-border'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="p-4 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">Plan</label>
              <select
                value={filters.plan}
                onChange={(e) => setFilters({ ...filters, plan: e.target.value })}
                className="w-full px-3 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
              >
                <option value="all">All Plans</option>
                <option value="free">Free</option>
                <option value="standard">Standard</option>
                <option value="elite">Elite</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Subscription Status</label>
              <select
                value={filters.subscriptionStatus}
                onChange={(e) => setFilters({ ...filters, subscriptionStatus: e.target.value })}
                className="w-full px-3 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="trialing">Trialing</option>
                <option value="past_due">Past Due</option>
                <option value="canceled">Canceled</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-2 border-linear-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 dark:text-text-secondary light:text-text-light-secondary">Searching customers...</p>
        </div>
      )}

      {!loading && searchQuery.length >= 2 && results.length === 0 && (
        <div className="text-center py-12 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear">
          <AlertCircle className="w-12 h-12 dark:text-text-tertiary light:text-text-light-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No customers found</h3>
          <p className="dark:text-text-secondary light:text-text-light-secondary">Try adjusting your search or filters</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-4">
          {results.map((customer) => (
            <button
              key={customer.workspace.id}
              onClick={() => onSelectCustomer(customer)}
              className="w-full p-6 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear hover:dark:border-linear-border light:border-linear-light-border linear-transition text-left"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-medium mb-1">{customer.workspace.name}</h3>
                  <p className="text-sm dark:text-text-secondary light:text-text-light-secondary">
                    /{customer.workspace.slug}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full border capitalize ${getPlanBadgeColor(customer.workspace.plan)}`}>
                    {customer.workspace.plan}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full border capitalize ${getStatusBadgeColor(customer.workspace.subscription_status)}`}>
                    {customer.workspace.subscription_status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary mb-1">Creators</div>
                  <div className="font-medium">{customer.creatorCount}</div>
                </div>
                <div>
                  <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary mb-1">Campaigns</div>
                  <div className="font-medium">{customer.campaignCount}</div>
                </div>
                <div>
                  <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary mb-1">Team</div>
                  <div className="font-medium">{customer.teamMemberCount}</div>
                </div>
                <div>
                  <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary mb-1">Storage</div>
                  <div className="font-medium">
                    {(customer.workspace.storage_used_bytes / (1024 * 1024 * 1024)).toFixed(2)} GB
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm dark:text-text-secondary light:text-text-light-secondary">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{customer.ownerEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Created {new Date(customer.workspace.created_at).toLocaleDateString()}</span>
                </div>
                {customer.workspace.subscription_expires_at && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span>Expires {new Date(customer.workspace.subscription_expires_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
