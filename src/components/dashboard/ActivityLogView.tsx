import { useState, useEffect } from 'react';
import { Activity, Filter, Download, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatDistanceToNow } from '../../utils/dateHelpers';
import type { Database } from '../../lib/database.types';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type ActivityLog = Database['public']['Tables']['activity_log']['Row'];

interface ActivityLogViewProps {
  workspace: Workspace;
}

interface ActivityWithUser extends ActivityLog {
  user_name?: string;
  user_email?: string;
}

export function ActivityLogView({ workspace }: ActivityLogViewProps) {
  const [activities, setActivities] = useState<ActivityWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{
    action?: string;
    entityType?: string;
    userId?: string;
  }>({});
  const [showFilterModal, setShowFilterModal] = useState(false);

  useEffect(() => {
    loadActivities();
  }, [workspace.id, filter]);

  const loadActivities = async () => {
    let query = supabase
      .from('activity_log')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (filter.action) {
      query = query.eq('action', filter.action);
    }

    if (filter.entityType) {
      query = query.eq('entity_type', filter.entityType);
    }

    if (filter.userId) {
      query = query.eq('user_id', filter.userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading activity log:', error);
    } else {
      const activitiesWithUsers = await Promise.all(
        (data || []).map(async (activity) => {
          if (!activity.user_id) {
            return {
              ...activity,
              user_name: 'System',
              user_email: 'system',
            };
          }

          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', activity.user_id)
            .maybeSingle();

          const email = profileData?.email || 'Unknown';
          const name = profileData?.full_name || email;

          return {
            ...activity,
            user_name: name,
            user_email: email,
          };
        })
      );

      setActivities(activitiesWithUsers);
    }
    setLoading(false);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return '✨';
      case 'updated':
        return '✏️';
      case 'deleted':
        return '🗑️';
      case 'completed':
        return '✅';
      default:
        return '📝';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'text-linear-success';
      case 'updated':
        return 'text-linear-info';
      case 'deleted':
        return 'text-linear-error';
      case 'completed':
        return 'text-linear-accent';
      default:
        return 'text-text-secondary';
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'User', 'Action', 'Entity Type', 'Details'];
    const rows = activities.map((activity) => [
      new Date(activity.created_at).toLocaleString(),
      activity.user_name || 'Unknown',
      activity.action,
      activity.entity_type,
      JSON.stringify(activity.details),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return <div className="text-text-secondary">Loading activity log...</div>;
  }

  const uniqueActions = [...new Set(activities.map((a) => a.action))];
  const uniqueEntityTypes = [...new Set(activities.map((a) => a.entity_type))];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h2 className="text-xl md:text-2xl font-medium mb-2">Activity Log</h2>
          <p className="text-sm md:text-base text-text-secondary">
            View all workspace activity and changes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilterModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-linear-bg-secondary border border-linear-border rounded-linear hover:bg-linear-bg-subtle linear-transition"
          >
            <Filter className="w-4 h-4" />
            Filter
            {(filter.action || filter.entityType || filter.userId) && (
              <span className="w-2 h-2 bg-linear-accent rounded-full" />
            )}
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="bg-linear-bg-secondary border border-linear-border-subtle rounded-linear-lg p-12 text-center">
          <Activity className="w-12 h-12 mx-auto mb-3 text-text-tertiary opacity-50" />
          <p className="text-text-secondary">No activity found</p>
        </div>
      ) : (
        <div className="bg-linear-bg-secondary border border-linear-border-subtle rounded-linear-lg divide-y divide-linear-border-subtle">
          {activities.map((activity) => (
            <div key={activity.id} className="p-4 hover:bg-linear-bg-subtle linear-transition">
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-0.5 text-xl">
                  {getActionIcon(activity.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{activity.user_name}</span>
                        <span className={`text-sm ${getActionColor(activity.action)}`}>
                          {activity.action}
                        </span>
                        <span className="text-sm text-text-secondary">
                          {activity.entity_type}
                        </span>
                      </div>
                      {activity.details && typeof activity.details === 'object' && (
                        <div className="text-sm text-text-tertiary">
                          {JSON.stringify(activity.details, null, 2).substring(0, 200)}
                          {JSON.stringify(activity.details).length > 200 && '...'}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-xs text-text-tertiary">
                        {formatDistanceToNow(activity.created_at)}
                      </div>
                      <div className="text-xs text-text-tertiary">
                        {new Date(activity.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showFilterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-linear-bg-secondary border border-linear-border rounded-linear-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-medium mb-6">Filter Activity</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Action</label>
                <select
                  value={filter.action || ''}
                  onChange={(e) => setFilter({ ...filter, action: e.target.value || undefined })}
                  className="w-full px-4 py-2 bg-linear-bg border border-linear-border rounded-linear focus:outline-none focus:border-linear-accent"
                >
                  <option value="">All Actions</option>
                  {uniqueActions.map((action) => (
                    <option key={action} value={action}>
                      {action}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Entity Type</label>
                <select
                  value={filter.entityType || ''}
                  onChange={(e) => setFilter({ ...filter, entityType: e.target.value || undefined })}
                  className="w-full px-4 py-2 bg-linear-bg border border-linear-border rounded-linear focus:outline-none focus:border-linear-accent"
                >
                  <option value="">All Types</option>
                  {uniqueEntityTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setFilter({});
                    setShowFilterModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-linear-bg-subtle hover:bg-linear-border-subtle rounded-linear linear-transition"
                >
                  Clear Filters
                </button>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="flex-1 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
