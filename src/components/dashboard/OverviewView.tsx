import { useState, useEffect } from 'react';
import { Target, Users, CheckSquare, TrendingUp, Calendar, DollarSign, ListChecks, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type Campaign = Database['public']['Tables']['campaigns']['Row'];
type Creator = Database['public']['Tables']['creators']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];
type Deliverable = Database['public']['Tables']['deliverables']['Row'];

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
  totalDeliverables: number;
  deliverablesInReview: number;
  deliverablesOverdue: number;
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
    totalDeliverables: 0,
    deliverablesInReview: 0,
    deliverablesOverdue: 0,
  });
  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [topCreators, setTopCreators] = useState<Creator[]>([]);
  const [upcomingDeliverables, setUpcomingDeliverables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverviewData();
  }, [workspace.id]);

  const loadOverviewData = async () => {
    const [campaignsData, creatorsData, tasksData, deliverablesData] = await Promise.all([
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
      supabase
        .from('deliverables')
        .select(`
          *,
          campaign:campaigns!inner(workspace_id, name),
          creator:creators(name)
        `)
        .eq('campaign.workspace_id', workspace.id)
        .order('due_date', { ascending: true, nullsFirst: false }),
    ]);

    if (campaignsData.data) {
      const campaigns = campaignsData.data;
      const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;
      const totalBudget = campaigns.reduce((sum, c) => sum + (Number(c.budget) || 0), 0);

      // Get total revenue from ad_sets instead of campaigns
      const { data: adSetsData } = await supabase
        .from('ad_sets')
        .select('revenue');

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

    if (deliverablesData.data) {
      const deliverables = deliverablesData.data;
      const inReview = deliverables.filter((d: any) => d.status === 'in_review').length;
      const now = new Date();
      const overdue = deliverables.filter((d: any) =>
        d.due_date && new Date(d.due_date) < now && d.status !== 'completed'
      ).length;

      setStats((prev) => ({
        ...prev,
        totalDeliverables: deliverables.length,
        deliverablesInReview: inReview,
        deliverablesOverdue: overdue,
      }));

      const upcoming = deliverables
        .filter((d: any) => d.due_date && d.status !== 'completed')
        .slice(0, 5);
      setUpcomingDeliverables(upcoming);
    }

    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'done':
        return 'dark:text-linear-success dark:bg-linear-success-subtle dark:border-linear-success-border light:text-linear-light-success light:bg-linear-light-success-subtle light:border-linear-light-success-border';
      case 'completed':
        return 'dark:text-linear-info dark:bg-linear-info-subtle dark:border-linear-info-border light:text-linear-light-info light:bg-linear-light-info-subtle light:border-linear-light-info-border';
      case 'in_progress':
        return 'dark:text-linear-warning dark:bg-linear-warning-subtle dark:border-linear-warning-border light:text-linear-light-warning light:bg-linear-light-warning-subtle light:border-linear-light-warning-border';
      default:
        return 'dark:text-text-tertiary dark:bg-linear-bg-hover dark:border-linear-border light:text-text-light-tertiary light:bg-linear-light-bg-hover light:border-linear-light-border';
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
        <div className="border rounded-linear-lg p-4 md:p-6 dark:bg-linear-bg-secondary dark:border-linear-border-subtle light:bg-white light:border-linear-light-border">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-linear flex items-center justify-center dark:bg-linear-info-subtle light:bg-linear-light-info-subtle">
              <Target className="w-5 h-5 dark:text-linear-info light:text-linear-light-info" />
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

        <div className="border rounded-linear-lg p-4 md:p-6 dark:bg-linear-bg-secondary dark:border-linear-border-subtle light:bg-white light:border-linear-light-border">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-linear flex items-center justify-center dark:bg-linear-warning-subtle light:bg-linear-light-warning-subtle">
              <ListChecks className="w-5 h-5 dark:text-linear-warning light:text-linear-light-warning" />
            </div>
            <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Deliverables</span>
          </div>
          <div className="space-y-1">
            <div className="text-xl md:text-2xl font-medium">{stats.totalDeliverables}</div>
            <div className="text-xs md:text-sm dark:text-text-secondary light:text-text-light-secondary flex items-center gap-1">
              {stats.deliverablesInReview} in review
              {stats.deliverablesOverdue > 0 && (
                <span className="flex items-center gap-1 dark:text-linear-error light:text-linear-light-error">
                  • {stats.deliverablesOverdue} overdue
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="border rounded-linear-lg p-4 md:p-6 dark:bg-linear-bg-secondary dark:border-linear-border-subtle light:bg-white light:border-linear-light-border">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-linear flex items-center justify-center dark:bg-linear-accent-subtle light:bg-linear-light-accent-subtle">
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

        <div className="border rounded-linear-lg p-4 md:p-6 dark:bg-linear-bg-secondary dark:border-linear-border-subtle light:bg-white light:border-linear-light-border">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-linear flex items-center justify-center dark:bg-linear-success-subtle light:bg-linear-light-success-subtle">
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

        <div className="border rounded-linear-lg p-4 md:p-6 dark:bg-linear-bg-secondary dark:border-linear-border-subtle light:bg-white light:border-linear-light-border">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-linear flex items-center justify-center dark:bg-linear-warning-subtle light:bg-linear-light-warning-subtle">
              <DollarSign className="w-5 h-5 dark:text-linear-warning light:text-linear-light-warning" />
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

      <div className="border rounded-linear-lg p-4 md:p-6 dark:bg-linear-bg-secondary dark:border-linear-border-subtle light:bg-white light:border-linear-light-border">
        <h3 className="text-sm md:text-base font-medium mb-4 flex items-center gap-2">
          <ListChecks className="w-4 h-4" />
          Upcoming Deliverables
        </h3>
        {upcomingDeliverables.length === 0 ? (
          <p className="text-xs md:text-sm dark:text-text-secondary light:text-text-light-secondary py-8 text-center">No upcoming deliverables</p>
        ) : (
          <div className="space-y-3">
            {upcomingDeliverables.map((deliverable: any) => {
              const dueDate = deliverable.due_date ? new Date(deliverable.due_date) : null;
              const isOverdue = dueDate && dueDate < new Date();
              const daysUntil = dueDate ? Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

              return (
                <div
                  key={deliverable.id}
                  className="flex items-center justify-between p-3 rounded-linear linear-transition dark:bg-linear-bg dark:hover:bg-linear-bg-subtle light:bg-linear-light-bg-subtle light:hover:bg-linear-light-bg-hover"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate flex items-center gap-2">
                      {deliverable.title}
                      {isOverdue && <AlertCircle className="w-4 h-4 dark:text-linear-error light:text-linear-light-error" />}
                    </div>
                    <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">
                      {deliverable.creator?.name} • {deliverable.campaign?.name}
                    </div>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                    isOverdue
                      ? 'dark:text-linear-error dark:bg-linear-error-subtle light:text-linear-light-error light:bg-linear-light-error-subtle'
                      : daysUntil && daysUntil <= 3
                      ? 'dark:text-linear-warning dark:bg-linear-warning-subtle light:text-linear-light-warning light:bg-linear-light-warning-subtle'
                      : 'dark:text-text-tertiary dark:bg-linear-bg-hover light:text-text-light-tertiary light:bg-linear-light-bg-hover'
                  }`}>
                    {isOverdue ? 'Overdue' : daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil}d`}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
        <div className="border rounded-linear-lg p-4 md:p-6 dark:bg-linear-bg-secondary dark:border-linear-border-subtle light:bg-white light:border-linear-light-border">
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
                  className="flex items-center justify-between p-3 rounded-linear linear-transition dark:bg-linear-bg dark:hover:bg-linear-bg-subtle light:bg-linear-light-bg-subtle light:hover:bg-linear-light-bg-hover"
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

        <div className="border rounded-linear-lg p-4 md:p-6 dark:bg-linear-bg-secondary dark:border-linear-border-subtle light:bg-white light:border-linear-light-border">
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
                  className="flex items-center justify-between p-3 rounded-linear linear-transition dark:bg-linear-bg dark:hover:bg-linear-bg-subtle light:bg-linear-light-bg-subtle light:hover:bg-linear-light-bg-hover"
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

      <div className="border rounded-linear-lg p-4 md:p-6 dark:bg-linear-bg-secondary dark:border-linear-border-subtle light:bg-white light:border-linear-light-border">
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
                className="p-4 rounded-linear linear-transition relative dark:bg-linear-bg dark:hover:bg-linear-bg-subtle light:bg-linear-light-bg-subtle light:hover:bg-linear-light-bg-hover"
              >
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border dark:bg-linear-bg-secondary dark:text-linear-warning dark:border-linear-warning-border light:bg-white light:text-linear-light-warning light:border-linear-light-warning-border">
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
                <div className="pt-3 border-t dark:border-linear-border-subtle light:border-linear-light-border">
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
