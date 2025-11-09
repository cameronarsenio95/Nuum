import { useState, useEffect } from 'react';
import { Target, Users, CheckSquare, TrendingUp, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type Campaign = Database['public']['Tables']['campaigns']['Row'];
type Creator = Database['public']['Tables']['creators']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];

interface OverviewViewProps {
  workspace: Workspace;
  onViewChange?: (view: 'campaigns' | 'creators' | 'tasks' | 'analytics') => void;
}

interface Stats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalCreators: number;
  totalTasks: number;
  tasksCompleted: number;
  tasksPending: number;
  totalBudget: number;
  totalCosts: number;
  totalRevenue: number;
}

export function OverviewView({ workspace, onViewChange }: OverviewViewProps) {
  const [stats, setStats] = useState<Stats>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalCreators: 0,
    totalTasks: 0,
    tasksCompleted: 0,
    tasksPending: 0,
    totalBudget: 0,
    totalCosts: 0,
    totalRevenue: 0,
  });
  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [topCreators, setTopCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverviewData();
  }, [workspace.id]);

  const loadOverviewData = async () => {
    const [campaignsData, creatorsData, tasksData] = await Promise.all([
      supabase
        .from('campaigns')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('creators')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('tasks')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false }),
    ]);

    if (campaignsData.data) {
      const campaigns = campaignsData.data;
      const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;
      const totalBudget = campaigns.reduce((sum, c) => sum + (Number(c.budget) || 0), 0);

      const { data: adSetsData } = await supabase
        .from('ad_sets')
        .select('revenue, spend, campaigns!inner(workspace_id)')
        .eq('campaigns.workspace_id', workspace.id);

      const totalRevenue = adSetsData?.reduce((sum, adSet) => sum + (Number(adSet.revenue) || 0), 0) || 0;
      const totalCosts = adSetsData?.reduce((sum, adSet) => sum + (Number(adSet.spend) || 0), 0) || 0;

      setStats((prev) => ({
        ...prev,
        totalCampaigns: campaigns.length,
        activeCampaigns,
        totalBudget,
        totalCosts,
        totalRevenue,
      }));
      setRecentCampaigns(campaigns.slice(0, 3));
    }

    if (creatorsData.data) {
      setStats((prev) => ({
        ...prev,
        totalCreators: creatorsData.data.length,
      }));

      const creatorsWithRevenue = await Promise.all(
        creatorsData.data.map(async (creator) => {
          const { data: adSetsData } = await supabase
            .from('ad_sets')
            .select('revenue')
            .eq('creator_id', creator.id);

          const totalRevenue = adSetsData?.reduce((sum, adSet) => {
            return sum + (Number(adSet.revenue) || 0);
          }, 0) || 0;

          return { ...creator, totalRevenue };
        })
      );

      const sortedCreators = creatorsWithRevenue
        .filter(c => c.totalRevenue > 0)
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 3);

      setTopCreators(sortedCreators as any);
    }

    if (tasksData.data) {
      const tasks = tasksData.data;
      const completed = tasks.filter((t) => t.status === 'done').length;
      const pending = tasks.filter((t) => t.status === 'todo' || t.status === 'in_progress').length;

      setStats((prev) => ({
        ...prev,
        totalTasks: tasks.length,
        tasksCompleted: completed,
        tasksPending: pending,
      }));
      setRecentTasks(tasks.slice(0, 3));
    }

    setLoading(false);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-nuum-dark-green text-nuum-accent-green';
      case 'in_progress':
        return 'bg-nuum-accent-brown text-nuum-accent-orange';
      case 'todo':
        return 'bg-nuum-dark-red text-white';
      case 'done':
      case 'completed':
        return 'bg-nuum-dark-blue text-nuum-accent-blue';
      default:
        return 'bg-nuum-neutral text-nuum-text-secondary';
    }
  };

  if (loading) {
    return <div className="text-nuum-text-secondary">Loading overview...</div>;
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-2 text-nuum-text-main">Overview</h2>
        <p className="text-sm text-nuum-text-secondary">Dashboard overview of your workspace</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <button
          onClick={() => onViewChange?.('creators')}
          className="bg-nuum-surface border border-nuum-border rounded-xl p-6 cursor-pointer text-left w-full transition-all duration-150 hover:shadow-lg group"
          style={{ boxShadow: '0 0 0 0 rgba(62, 85, 158, 0)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 20px 0 rgba(62, 85, 158, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 0 0 rgba(62, 85, 158, 0)';
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-nuum-dark-blue">
              <Users className="w-5 h-5 text-nuum-accent-blue" />
            </div>
            <span className="text-xs uppercase tracking-wide text-nuum-text-secondary">Creators</span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-semibold text-nuum-text-main">{stats.totalCreators}</div>
            <div className="text-sm text-nuum-text-secondary">Total creators</div>
          </div>
        </button>

        <button
          onClick={() => onViewChange?.('campaigns')}
          className="bg-nuum-surface border border-nuum-border rounded-xl p-6 cursor-pointer text-left w-full transition-all duration-150 hover:shadow-lg group"
          style={{ boxShadow: '0 0 0 0 rgba(62, 85, 158, 0)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 20px 0 rgba(62, 85, 158, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 0 0 rgba(62, 85, 158, 0)';
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-nuum-dark-blue">
              <Target className="w-5 h-5 text-nuum-accent-blue" />
            </div>
            <span className="text-xs uppercase tracking-wide text-nuum-text-secondary">Campaigns</span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-semibold text-nuum-text-main">{stats.totalCampaigns}</div>
            <div className="text-sm text-nuum-text-secondary">{stats.activeCampaigns} active</div>
          </div>
        </button>

        <button
          onClick={() => onViewChange?.('analytics')}
          className="bg-nuum-surface border border-nuum-border rounded-xl p-6 cursor-pointer text-left w-full transition-all duration-150 hover:shadow-lg group"
          style={{ boxShadow: '0 0 0 0 rgba(156, 62, 63, 0)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 20px 0 rgba(156, 62, 63, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 0 0 rgba(156, 62, 63, 0)';
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-nuum-dark-red">
              <TrendingUp className="w-5 h-5 text-nuum-accent-red" />
            </div>
            <span className="text-xs uppercase tracking-wide text-nuum-text-secondary">Total Costs</span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-semibold text-nuum-accent-red">€{stats.totalCosts.toLocaleString()}</div>
            <div className="text-sm text-nuum-text-secondary">Across all ad sets</div>
          </div>
        </button>

        <button
          onClick={() => onViewChange?.('analytics')}
          className="bg-nuum-surface border border-nuum-border rounded-xl p-6 cursor-pointer text-left w-full transition-all duration-150 hover:shadow-lg group"
          style={{ boxShadow: '0 0 0 0 rgba(102, 165, 107, 0)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 20px 0 rgba(102, 165, 107, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 0 0 rgba(102, 165, 107, 0)';
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-nuum-dark-green">
              <DollarSign className="w-5 h-5 text-nuum-accent-green" />
            </div>
            <span className="text-xs uppercase tracking-wide text-nuum-text-secondary">Total Revenue</span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-semibold text-nuum-accent-green">€{stats.totalRevenue.toLocaleString()}</div>
            <div className="text-sm text-nuum-text-secondary">Across all ad sets</div>
          </div>
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-nuum-surface border border-nuum-border rounded-xl p-6">
          <button
            onClick={() => onViewChange?.('campaigns')}
            className="text-sm font-semibold mb-4 flex items-center gap-2 transition-colors duration-150 text-nuum-text-main hover:text-nuum-accent-blue"
          >
            <Target className="w-4 h-4" />
            Recent Campaigns
          </button>
          {recentCampaigns.length === 0 ? (
            <p className="text-sm py-8 text-center text-nuum-text-secondary">No campaigns yet — start by creating your first one.</p>
          ) : (
            <div className="space-y-3">
              {recentCampaigns.map((campaign) => (
                <button
                  key={campaign.id}
                  onClick={() => onViewChange?.('campaigns')}
                  className="flex items-center justify-between p-3 rounded-lg w-full text-left transition-all duration-150 bg-nuum-background hover:bg-nuum-border"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate text-nuum-text-main">{campaign.name}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClass(campaign.status)}`}>
                    {campaign.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-nuum-surface border border-nuum-border rounded-xl p-6">
          <button
            onClick={() => onViewChange?.('tasks')}
            className="text-sm font-semibold mb-4 flex items-center gap-2 transition-colors duration-150 text-nuum-text-main hover:text-nuum-accent-blue"
          >
            <CheckSquare className="w-4 h-4" />
            Recent Tasks
          </button>
          {recentTasks.length === 0 ? (
            <p className="text-sm py-8 text-center text-nuum-text-secondary">No tasks yet — start by creating your first one.</p>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => onViewChange?.('tasks')}
                  className="flex items-center justify-between p-3 rounded-lg w-full text-left transition-all duration-150 bg-nuum-background hover:bg-nuum-border"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate text-nuum-text-main">{task.title}</div>
                    <div className="text-xs capitalize text-nuum-text-secondary">{task.priority} priority</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClass(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-nuum-surface border border-nuum-border rounded-xl p-6">
        <button
          onClick={() => onViewChange?.('creators')}
          className="text-sm font-semibold mb-4 flex items-center gap-2 transition-colors duration-150 text-nuum-text-main hover:text-nuum-accent-blue"
        >
          <Users className="w-4 h-4" />
          Top Creators
        </button>
        {topCreators.length === 0 ? (
          <p className="text-sm py-8 text-center text-nuum-text-secondary">No creators with revenue yet</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topCreators.map((creator, index) => (
              <button
                key={creator.id}
                onClick={() => onViewChange?.('creators')}
                className="p-4 rounded-lg relative w-full text-left transition-all duration-150 bg-nuum-background hover:bg-nuum-border"
              >
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border border-nuum-accent-orange bg-nuum-accent-brown text-nuum-accent-orange">
                  #{index + 1}
                </div>
                <div className="font-semibold mb-3 text-nuum-text-main">{creator.name}</div>
                <div className="space-y-1 text-xs mb-3 text-nuum-text-secondary">
                  {creator.instagram_handle && (
                    <div className="flex items-center gap-1">
                      <span>@{creator.instagram_handle}</span>
                    </div>
                  )}
                  {creator.email && (
                    <div className="truncate">{creator.email}</div>
                  )}
                </div>
                <div className="pt-3 border-t border-nuum-border">
                  <div className="text-xs uppercase tracking-wide mb-1 text-nuum-text-secondary">Total Revenue</div>
                  <div className="text-lg font-semibold text-nuum-accent-green">
                    €{((creator as any).totalRevenue || 0).toLocaleString()}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
