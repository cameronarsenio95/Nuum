import { useState, useEffect } from 'react';
import { Search, Filter, Calendar, User, FileText, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type AuditLog = Database['public']['Tables']['support_audit_logs']['Row'];

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    actionType: 'all',
    entityType: 'all',
    staffEmail: '',
    dateFrom: '',
    dateTo: '',
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    loadAuditLogs();
  }, [filters]);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('support_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filters.actionType !== 'all') {
        query = query.eq('action_type', filters.actionType);
      }
      if (filters.entityType !== 'all') {
        query = query.eq('entity_type', filters.entityType);
      }
      if (filters.staffEmail) {
        query = query.ilike('staff_email', `%${filters.staffEmail}%`);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;

      setLogs(data || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeColor = (actionType: string) => {
    if (actionType.startsWith('view')) {
      return 'text-linear-info bg-linear-info/10 border-linear-info-border/20';
    } else if (actionType.startsWith('modify')) {
      return 'text-linear-warning bg-linear-warning/10 border-linear-warning-border/20';
    } else if (actionType.startsWith('delete')) {
      return 'text-linear-error bg-linear-error/10 border-linear-error-border/20';
    } else {
      return 'text-linear-success bg-linear-success/10 border-linear-success-border/20';
    }
  };

  const formatActionType = (actionType: string) => {
    return actionType
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      log.customer_email?.toLowerCase().includes(searchLower) ||
      log.workspace_name?.toLowerCase().includes(searchLower) ||
      log.staff_email.toLowerCase().includes(searchLower) ||
      log.staff_name.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-medium mb-2">Audit Logs</h2>
          <p className="dark:text-text-secondary light:text-text-light-secondary">
            Complete history of all support actions
          </p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 dark:text-text-tertiary light:text-text-light-tertiary" />
            <input
              type="text"
              placeholder="Search by email, workspace name, or staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
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
          <div className="p-4 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2">Action Type</label>
              <select
                value={filters.actionType}
                onChange={(e) => setFilters({ ...filters, actionType: e.target.value })}
                className="w-full px-3 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
              >
                <option value="all">All Actions</option>
                <option value="view_customer">View Customer</option>
                <option value="view_workspace">View Workspace</option>
                <option value="modify_plan">Modify Plan</option>
                <option value="modify_subscription">Modify Subscription</option>
                <option value="modify_limits">Modify Limits</option>
                <option value="reset_password">Reset Password</option>
                <option value="extend_trial">Extend Trial</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Entity Type</label>
              <select
                value={filters.entityType}
                onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
                className="w-full px-3 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
              >
                <option value="all">All Entities</option>
                <option value="workspace">Workspace</option>
                <option value="user">User</option>
                <option value="profile">Profile</option>
                <option value="subscription">Subscription</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Staff Email</label>
              <input
                type="text"
                value={filters.staffEmail}
                onChange={(e) => setFilters({ ...filters, staffEmail: e.target.value })}
                placeholder="Filter by staff..."
                className="w-full px-3 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full px-3 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-full px-3 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilters({
                    actionType: 'all',
                    entityType: 'all',
                    staffEmail: '',
                    dateFrom: '',
                    dateTo: '',
                  });
                }}
                className="w-full px-3 py-2 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle hover:dark:bg-linear-border-subtle rounded-linear linear-transition"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-2 border-linear-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 dark:text-text-secondary light:text-text-light-secondary">Loading audit logs...</p>
        </div>
      )}

      {!loading && filteredLogs.length === 0 && (
        <div className="text-center py-12 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear">
          <FileText className="w-12 h-12 dark:text-text-tertiary light:text-text-light-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No audit logs found</h3>
          <p className="dark:text-text-secondary light:text-text-light-secondary">Try adjusting your search or filters</p>
        </div>
      )}

      {!loading && filteredLogs.length > 0 && (
        <div className="space-y-2">
          {filteredLogs.map((log) => (
            <button
              key={log.id}
              onClick={() => setSelectedLog(log)}
              className="w-full p-4 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear hover:dark:border-linear-border light:border-linear-light-border linear-transition text-left"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-1 rounded-full border ${getActionBadgeColor(log.action_type)}`}>
                      {formatActionType(log.action_type)}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full border dark:text-text-secondary light:text-text-light-secondary dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle">
                      {log.entity_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm dark:text-text-secondary light:text-text-light-secondary">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{log.staff_name}</span>
                    </div>
                    {log.workspace_name && (
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span className="truncate">{log.workspace_name}</span>
                      </div>
                    )}
                    {log.customer_email && (
                      <div className="flex items-center gap-1">
                        <span className="truncate">{log.customer_email}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs dark:text-text-tertiary light:text-text-light-tertiary whitespace-nowrap">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(log.created_at).toLocaleString()}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50" onClick={() => setSelectedLog(null)}>
          <div className="dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border light:border-linear-light-border rounded-linear p-6 w-full max-w-2xl max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-medium">Audit Log Details</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 hover:dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-linear"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Action</label>
                <span className={`inline-block text-sm px-3 py-1 rounded-full border ${getActionBadgeColor(selectedLog.action_type)}`}>
                  {formatActionType(selectedLog.action_type)}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Staff Member</label>
                  <p className="dark:text-text-secondary light:text-text-light-secondary">{selectedLog.staff_name}</p>
                  <p className="text-sm dark:text-text-tertiary light:text-text-light-tertiary">{selectedLog.staff_email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Timestamp</label>
                  <p className="dark:text-text-secondary light:text-text-light-secondary">
                    {new Date(selectedLog.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedLog.workspace_name && (
                <div>
                  <label className="block text-sm font-medium mb-1">Workspace</label>
                  <p className="dark:text-text-secondary light:text-text-light-secondary">{selectedLog.workspace_name}</p>
                </div>
              )}

              {selectedLog.customer_email && (
                <div>
                  <label className="block text-sm font-medium mb-1">Customer Email</label>
                  <p className="dark:text-text-secondary light:text-text-light-secondary">{selectedLog.customer_email}</p>
                </div>
              )}

              {selectedLog.previous_state && (
                <div>
                  <label className="block text-sm font-medium mb-2">Previous State</label>
                  <pre className="p-3 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear text-xs overflow-auto">
                    {JSON.stringify(selectedLog.previous_state, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_state && (
                <div>
                  <label className="block text-sm font-medium mb-2">New State</label>
                  <pre className="p-3 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear text-xs overflow-auto">
                    {JSON.stringify(selectedLog.new_state, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.notes && (
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <p className="dark:text-text-secondary light:text-text-light-secondary">{selectedLog.notes}</p>
                </div>
              )}

              {selectedLog.ticket_reference && (
                <div>
                  <label className="block text-sm font-medium mb-1">Ticket Reference</label>
                  <p className="dark:text-text-secondary light:text-text-light-secondary">{selectedLog.ticket_reference}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
