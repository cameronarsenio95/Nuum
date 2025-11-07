import { useState, useEffect } from 'react';
import { Target, Users, CheckSquare, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';
import { NUUM_COLORS, getStatusColorClass } from '../../utils/designSystem';

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

      // Get total revenue and costs from ad_sets for this workspace via campaigns
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


  if (loading) {
    return <div style={{ color: NUUM_COLORS.textSecondary }}>Loading overview...</div>;
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-2" style={{ color: NUUM_COLORS.textPrimary }}>Overview</h2>
        <p className="text-sm" style={{ color: NUUM_COLORS.textSecondary }}>Dashboard overview of your workspace</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <button
          onClick={() => onViewChange?.('creators')}
          className="border rounded-xl p-6 cursor-pointer text-left w-full transition-all duration-150"
          style={{ backgroundColor: NUUM_COLORS.surface, borderColor: NUUM_COLORS.border }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = NUUM_COLORS.borderHover}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = NUUM_COLORS.border}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(42, 83, 208, 0.1)' }}>
              <Users className="w-5 h-5" style={{ color: NUUM_COLORS.accent }} />
            </div>
            <span className="text-xs uppercase tracking-wide" style={{ color: NUUM_COLORS.textTertiary }}>Creators</span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-semibold" style={{ color: NUUM_COLORS.textPrimary }}>{stats.totalCreators}</div>
            <div className="text-sm" style={{ color: NUUM_COLORS.textSecondary }}>
              Total creators
            </div>
          </div>
        </button>

        <button
          onClick={() => onViewChange?.('campaigns')}
          className="border rounded-xl p-6 cursor-pointer text-left w-full transition-all duration-150"
          style={{ backgroundColor: NUUM_COLORS.surface, borderColor: NUUM_COLORS.border }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = NUUM_COLORS.borderHover}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = NUUM_COLORS.border}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(42, 83, 208, 0.1)' }}>
              <Target className="w-5 h-5" style={{ color: NUUM_COLORS.accent }} />
            </div>
            <span className="text-xs uppercase tracking-wide" style={{ color: NUUM_COLORS.textTertiary }}>Campaigns</span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-semibold" style={{ color: NUUM_COLORS.textPrimary }}>{stats.totalCampaigns}</div>
            <div className="text-sm" style={{ color: NUUM_COLORS.textSecondary }}>
              {stats.activeCampaigns} active
            </div>
          </div>
        </button>

        <button
          onClick={() => onViewChange?.('analytics')}
          className="border rounded-xl p-6 cursor-pointer text-left w-full transition-all duration-150"
          style={{ backgroundColor: NUUM_COLORS.surface, borderColor: NUUM_COLORS.border }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = NUUM_COLORS.borderHover}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = NUUM_COLORS.border}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(231, 76, 60, 0.1)' }}>
              <TrendingUp className="w-5 h-5" style={{ color: NUUM_COLORS.errorMuted }} />
            </div>
            <span className="text-xs uppercase tracking-wide" style={{ color: NUUM_COLORS.textTertiary }}>Total Costs</span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-semibold" style={{ color: NUUM_COLORS.textPrimary }}>${stats.totalCosts.toLocaleString()}</div>
            <div className="text-sm" style={{ color: NUUM_COLORS.textSecondary }}>
              Across all ad sets
            </div>
          </div>
        </button>

        <button
          onClick={() => onViewChange?.('analytics')}
          className="border rounded-xl p-6 cursor-pointer text-left w-full transition-all duration-150"
          style={{ backgroundColor: NUUM_COLORS.surface, borderColor: NUUM_COLORS.border }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = NUUM_COLORS.borderHover}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = NUUM_COLORS.border}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(56, 226, 159, 0.1)' }}>
              <DollarSign className="w-5 h-5" style={{ color: NUUM_COLORS.successMuted }} />
            </div>
            <span className="text-xs uppercase tracking-wide" style={{ color: NUUM_COLORS.textTertiary }}>Total Revenue</span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-semibold" style={{ color: NUUM_COLORS.textPrimary }}>${stats.totalRevenue.toLocaleString()}</div>
            <div className="text-sm" style={{ color: NUUM_COLORS.textSecondary }}>
              Across all ad sets
            </div>
          </div>
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
        <div className="border rounded-xl p-6" style={{ backgroundColor: NUUM_COLORS.surface, borderColor: NUUM_COLORS.border }}>
          <button
            onClick={() => onViewChange?.('campaigns')}
            className="text-sm font-semibold mb-4 flex items-center gap-2 transition-colors duration-150"
            style={{ color: NUUM_COLORS.textPrimary }}
            onMouseEnter={(e) => e.currentTarget.style.color = NUUM_COLORS.accent}
            onMouseLeave={(e) => e.currentTarget.style.color = NUUM_COLORS.textPrimary}
          >
            <Target className="w-4 h-4" />
            Recent Campaigns
          </button>
          {recentCampaigns.length === 0 ? (
            <p className="text-sm py-8 text-center" style={{ color: NUUM_COLORS.textSecondary }}>No campaigns yet — start by creating your first one.</p>
          ) : (
            <div className="space-y-3">
              {recentCampaigns.map((campaign) => (
                <button
                  key={campaign.id}
                  onClick={() => onViewChange?.('campaigns')}
                  className="flex items-center justify-between p-3 rounded-lg w-full text-left transition-all duration-150"
                  style={{ backgroundColor: NUUM_COLORS.background }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = NUUM_COLORS.surfaceHover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = NUUM_COLORS.background}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate" style={{ color: NUUM_COLORS.textPrimary }}>{campaign.name}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColorClass(campaign.status)}`}>
                    {campaign.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border rounded-xl p-6" style={{ backgroundColor: NUUM_COLORS.surface, borderColor: NUUM_COLORS.border }}>
          <button
            onClick={() => onViewChange?.('tasks')}
            className="text-sm font-semibold mb-4 flex items-center gap-2 transition-colors duration-150"
            style={{ color: NUUM_COLORS.textPrimary }}
            onMouseEnter={(e) => e.currentTarget.style.color = NUUM_COLORS.accent}
            onMouseLeave={(e) => e.currentTarget.style.color = NUUM_COLORS.textPrimary}
          >
            <CheckSquare className="w-4 h-4" />
            Recent Tasks
          </button>
          {recentTasks.length === 0 ? (
            <p className="text-sm py-8 text-center" style={{ color: NUUM_COLORS.textSecondary }}>No tasks yet — start by creating your first one.</p>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => onViewChange?.('tasks')}
                  className="flex items-center justify-between p-3 rounded-lg w-full text-left transition-all duration-150"
                  style={{ backgroundColor: NUUM_COLORS.background }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = NUUM_COLORS.surfaceHover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = NUUM_COLORS.background}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate" style={{ color: NUUM_COLORS.textPrimary }}>{task.title}</div>
                    <div className="text-xs capitalize" style={{ color: NUUM_COLORS.textTertiary }}>{task.priority} priority</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColorClass(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border rounded-xl p-6" style={{ backgroundColor: NUUM_COLORS.surface, borderColor: NUUM_COLORS.border }}>
        <button
          onClick={() => onViewChange?.('creators')}
          className="text-sm font-semibold mb-4 flex items-center gap-2 transition-colors duration-150"
          style={{ color: NUUM_COLORS.textPrimary }}
          onMouseEnter={(e) => e.currentTarget.style.color = NUUM_COLORS.accent}
          onMouseLeave={(e) => e.currentTarget.style.color = NUUM_COLORS.textPrimary}
        >
          <Users className="w-4 h-4" />
          Top Creators
        </button>
        {topCreators.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: NUUM_COLORS.textSecondary }}>No creators with revenue yet</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topCreators.map((creator, index) => (
              <button
                key={creator.id}
                onClick={() => onViewChange?.('creators')}
                className="p-4 rounded-lg relative w-full text-left transition-all duration-150"
                style={{ backgroundColor: NUUM_COLORS.background }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = NUUM_COLORS.surfaceHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = NUUM_COLORS.background}
              >
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border" style={{ backgroundColor: NUUM_COLORS.surface, color: NUUM_COLORS.warningMuted, borderColor: 'rgba(243, 156, 18, 0.3)' }}>
                  #{index + 1}
                </div>
                <div className="font-semibold mb-3" style={{ color: NUUM_COLORS.textPrimary }}>{creator.name}</div>
                <div className="space-y-1 text-xs mb-3" style={{ color: NUUM_COLORS.textSecondary }}>
                  {creator.instagram_handle && (
                    <div className="flex items-center gap-1">
                      <span>@{creator.instagram_handle}</span>
                    </div>
                  )}
                  {creator.email && (
                    <div className="truncate">{creator.email}</div>
                  )}
                </div>
                <div className="pt-3 border-t" style={{ borderColor: NUUM_COLORS.border }}>
                  <div className="text-xs uppercase tracking-wide mb-1" style={{ color: NUUM_COLORS.textTertiary }}>Total Revenue</div>
                  <div className="text-lg font-semibold" style={{ color: NUUM_COLORS.successMuted }}>
                    ${((creator as any).totalRevenue || 0).toLocaleString()}
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
