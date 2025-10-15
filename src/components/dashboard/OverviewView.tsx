import { useState, useEffect } from 'react';
import { Target, Users, CheckSquare, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type Campaign = Database['public']['Tables']['campaigns']['Row'];
type Creator = Database['public']['Tables']['creators']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];

interface OverviewViewProps {
  workspace: Workspace;
}

interface Stats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalCreators: number;
  totalTasks: number;
  tasksCompleted: number;
  tasksPending: number;
  totalBudget: number;
  totalRevenue: number;
}

export function OverviewView({ workspace }: OverviewViewProps) {
  const [stats, setStats] = useState<Stats>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalCreators: 0,
    totalTasks: 0,
    tasksCompleted: 0,
    tasksPending: 0,
    totalBudget: 0,
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

      // Get total revenue from ad_sets for this workspace via campaigns
      const { data: adSetsData } = await supabase
        .from('ad_sets')
        .select('revenue, campaigns!inner(workspace_id)')
        .eq('campaigns.workspace_id', workspace.id);

      const totalRevenue = adSetsData?.reduce((sum, adSet) => sum + (Number(adSet.revenue) || 0), 0) || 0;

      setStats((prev) => ({
        ...prev,
        totalCampaigns: campaigns.length,
        activeCampaigns,
        totalBudget,
        totalRevenue,
      }));
      setRecentCampaigns(campaigns.slice(0, 5));
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
      setRecentTasks(tasks.slice(0, 5));
    }

    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'done':
        return 'text-linear-success bg-linear-success-subtle border-linear-success-border';
      case 'completed':
        return 'text-linear-info bg-linear-info-subtle border-linear-info-border';
      case 'in_progress':
        return 'text-linear-warning bg-linear-warning-subtle border-linear-warning-border';
      default:
        return 'text-text-tertiary bg-linear-bg-hover border-linear-border';
    }
  };

  if (loading) {
    return <div className="dark:text-text-secondary light:text-text-light-secondary">Loading overview...</div>;
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h2 className="text-xl md:text-2xl font-medium mb-2">Overview</h2>
        <p className="text-sm md:text-base dark:text-text-secondary light:text-text-light-secondary">Dashboard overview of your workspace</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-linear-info-subtle rounded-linear flex items-center justify-center">
              <Target className="w-5 h-5 text-linear-info" />
            </div>
            <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Campaigns</span>
          </div>
          <div className="space-y-1">
            <div className="text-xl md:text-2xl font-medium">{stats.totalCampaigns}</div>
            <div className="text-xs md:text-sm dark:text-text-secondary light:text-text-light-secondary">
              {stats.activeCampaigns} active
            </div>
          </div>
        </div>

        <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-linear-accent-subtle rounded-linear flex items-center justify-center dark:text-linear-bg light:text-linear-light-bg">
              <Users className="w-5 h-5 dark:text-linear-accent light:text-linear-light-accent" />
            </div>
            <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Creators</span>
          </div>
          <div className="space-y-1">
            <div className="text-xl md:text-2xl font-medium">{stats.totalCreators}</div>
            <div className="text-xs md:text-sm dark:text-text-secondary light:text-text-light-secondary">
              Total creators
            </div>
          </div>
        </div>

        <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-linear-success-subtle rounded-linear flex items-center justify-center">
              <CheckSquare className="w-5 h-5 dark:text-linear-success light:text-linear-light-success" />
            </div>
            <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Tasks</span>
          </div>
          <div className="space-y-1">
            <div className="text-xl md:text-2xl font-medium">{stats.totalTasks}</div>
            <div className="text-xs md:text-sm dark:text-text-secondary light:text-text-light-secondary">
              {stats.tasksCompleted} completed, {stats.tasksPending} pending
            </div>
          </div>
        </div>

        <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-linear-warning-subtle rounded-linear flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-linear-warning" />
            </div>
            <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Total Revenue</span>
          </div>
          <div className="space-y-1">
            <div className="text-xl md:text-2xl font-medium">${stats.totalRevenue.toLocaleString()}</div>
            <div className="text-xs md:text-sm dark:text-text-secondary light:text-text-light-secondary">
              Across all ad sets
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
        <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
          <h3 className="text-sm md:text-base font-medium mb-4 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Recent Campaigns
          </h3>
          {recentCampaigns.length === 0 ? (
            <p className="text-xs md:text-sm dark:text-text-secondary light:text-text-light-secondary py-8 text-center">No campaigns yet</p>
          ) : (
            <div className="space-y-3">
              {recentCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between p-3 dark:bg-linear-bg light:bg-linear-light-bg rounded-linear hover:dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle linear-transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{campaign.name}</div>
                    <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">
                      {campaign.start_date && new Date(campaign.start_date).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(campaign.status)}`}>
                    {campaign.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
          <h3 className="text-sm md:text-base font-medium mb-4 flex items-center gap-2">
            <CheckSquare className="w-4 h-4" />
            Recent Tasks
          </h3>
          {recentTasks.length === 0 ? (
            <p className="text-xs md:text-sm dark:text-text-secondary light:text-text-light-secondary py-8 text-center">No tasks yet</p>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 dark:bg-linear-bg light:bg-linear-light-bg rounded-linear hover:dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle linear-transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{task.title}</div>
                    <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary capitalize">{task.priority} priority</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
        <h3 className="text-sm md:text-base font-medium mb-4 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Top Creators
        </h3>
        {topCreators.length === 0 ? (
          <p className="text-xs md:text-sm dark:text-text-secondary light:text-text-light-secondary py-8 text-center">No creators with revenue yet</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topCreators.map((creator, index) => (
              <div
                key={creator.id}
                className="p-4 dark:bg-linear-bg light:bg-linear-light-bg rounded-linear hover:dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle linear-transition relative"
              >
                <div className="absolute top-3 right-3 w-8 h-8 dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary rounded-full flex items-center justify-center text-sm font-medium text-linear-warning border border-linear-warning-border">
                  #{index + 1}
                </div>
                <div className="font-medium mb-3">{creator.name}</div>
                <div className="space-y-1 text-xs dark:text-text-secondary light:text-text-light-secondary mb-3">
                  {creator.instagram_handle && (
                    <div className="flex items-center gap-1">
                      <span>@{creator.instagram_handle}</span>
                    </div>
                  )}
                  {creator.email && (
                    <div className="truncate">{creator.email}</div>
                  )}
                </div>
                <div className="pt-3 border-t dark:border-linear-border-subtle light:border-linear-light-border-subtle">
                  <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary mb-1">Total Revenue</div>
                  <div className="text-lg font-medium dark:text-linear-success light:text-linear-light-success">
                    ${((creator as any).totalRevenue || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
