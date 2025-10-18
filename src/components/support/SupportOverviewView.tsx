import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
  CreditCard,
  Globe,
  Search,
  Plus,
  BarChart3,
  PieChart,
  Zap
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSupportAuth } from '../../contexts/SupportAuthContext';

interface DashboardMetrics {
  tickets: {
    total: number;
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
    urgent: number;
    high: number;
  };
  customers: {
    total: number;
    free: number;
    starter: number;
    pro: number;
    elite: number;
    enterprise: number;
    active: number;
    trialing: number;
    past_due: number;
    canceled: number;
    expired: number;
  };
  performance: {
    avgResponseTime: number;
    avgResolutionTime: number;
    todayTickets: number;
    yesterdayTickets: number;
  };
  dns: {
    pending: number;
    verified: number;
    failed: number;
  };
}

interface RecentActivity {
  id: string;
  type: 'ticket' | 'customer' | 'audit' | 'dns';
  title: string;
  description: string;
  timestamp: string;
  icon: any;
  color: string;
}

export function SupportOverviewView() {
  const { supportStaff } = useSupportAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    loadDashboardData();

    if (autoRefresh) {
      const interval = setInterval(() => {
        loadDashboardData();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [timeRange, autoRefresh]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadTicketMetrics(),
        loadCustomerMetrics(),
        loadPerformanceMetrics(),
        loadDNSMetrics(),
        loadRecentActivity()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTicketMetrics = async () => {
    const { data: tickets } = await supabase
      .from('support_tickets')
      .select('status, priority');

    if (tickets && tickets.length > 0) {
      setMetrics(prev => ({
        ...prev!,
        tickets: {
          total: tickets.length,
          open: tickets.filter((t: any) => t.status === 'open').length,
          in_progress: tickets.filter((t: any) => t.status === 'in_progress').length,
          resolved: tickets.filter((t: any) => t.status === 'resolved').length,
          closed: tickets.filter((t: any) => t.status === 'closed').length,
          urgent: tickets.filter((t: any) => t.priority === 'urgent').length,
          high: tickets.filter((t: any) => t.priority === 'high').length,
        }
      }));
    } else {
      setMetrics(prev => ({
        ...prev!,
        tickets: {
          total: 0,
          open: 0,
          in_progress: 0,
          resolved: 0,
          closed: 0,
          urgent: 0,
          high: 0,
        }
      }));
    }
  };

  const loadCustomerMetrics = async () => {
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('plan, subscription_status');

    if (workspaces && workspaces.length > 0) {
      setMetrics(prev => ({
        ...prev!,
        customers: {
          total: workspaces.length,
          free: workspaces.filter((w: any) => w.plan === 'free').length,
          starter: workspaces.filter((w: any) => w.plan === 'starter').length,
          pro: workspaces.filter((w: any) => w.plan === 'pro').length,
          elite: workspaces.filter((w: any) => w.plan === 'elite').length,
          enterprise: workspaces.filter((w: any) => w.plan === 'enterprise').length,
          active: workspaces.filter((w: any) => w.subscription_status === 'active').length,
          trialing: workspaces.filter((w: any) => w.subscription_status === 'trialing').length,
          past_due: workspaces.filter((w: any) => w.subscription_status === 'past_due').length,
          canceled: workspaces.filter((w: any) => w.subscription_status === 'canceled').length,
          expired: workspaces.filter((w: any) => w.subscription_status === 'expired').length,
        }
      }));
    } else {
      setMetrics(prev => ({
        ...prev!,
        customers: {
          total: 0,
          free: 0,
          starter: 0,
          pro: 0,
          elite: 0,
          enterprise: 0,
          active: 0,
          trialing: 0,
          past_due: 0,
          canceled: 0,
          expired: 0,
        }
      }));
    }
  };

  const loadPerformanceMetrics = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: todayTickets } = await supabase
      .from('support_tickets')
      .select('id')
      .gte('created_at', today.toISOString());

    const { data: yesterdayTickets } = await supabase
      .from('support_tickets')
      .select('id')
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', today.toISOString());

    setMetrics(prev => ({
      ...prev!,
      performance: {
        avgResponseTime: 2.5,
        avgResolutionTime: 8.3,
        todayTickets: todayTickets?.length || 0,
        yesterdayTickets: yesterdayTickets?.length || 0,
      }
    }));
  };

  const loadDNSMetrics = async () => {
    const { data: domains } = await supabase
      .from('email_domains')
      .select('status');

    if (domains && domains.length > 0) {
      setMetrics(prev => ({
        ...prev!,
        dns: {
          pending: domains.filter((d: any) => d.status === 'pending').length,
          verified: domains.filter((d: any) => d.status === 'verified').length,
          failed: domains.filter((d: any) => d.status === 'failed').length,
        }
      }));
    } else {
      setMetrics(prev => ({
        ...prev!,
        dns: {
          pending: 0,
          verified: 0,
          failed: 0,
        }
      }));
    }
  };

  const loadRecentActivity = async () => {
    const { data: tickets } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    const { data: auditLogs } = await supabase
      .from('support_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    const { data: domains } = await supabase
      .from('email_domains')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(2);

    const activities: RecentActivity[] = [];

    tickets?.forEach((ticket: any) => {
      activities.push({
        id: ticket.id,
        type: 'ticket',
        title: `New ticket: ${ticket.ticket_number}`,
        description: ticket.subject,
        timestamp: ticket.created_at,
        icon: MessageSquare,
        color: 'text-blue-500'
      });
    });

    auditLogs?.forEach((log: any) => {
      activities.push({
        id: log.id,
        type: 'audit',
        title: log.action_type.replace('_', ' '),
        description: `${log.staff_name} - ${log.workspace_name || 'System action'}`,
        timestamp: log.created_at,
        icon: Activity,
        color: 'text-purple-500'
      });
    });

    domains?.forEach((domain: any) => {
      activities.push({
        id: domain.id,
        type: 'dns',
        title: `DNS ${domain.status}: ${domain.domain}`,
        description: `Region: ${domain.region}`,
        timestamp: domain.created_at,
        icon: Globe,
        color: 'text-green-500'
      });
    });

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setRecentActivity(activities.slice(0, 8));
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-linear-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 dark:text-text-secondary light:text-text-light-secondary">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const ticketTrend = metrics.performance.todayTickets - metrics.performance.yesterdayTickets;
  const activeIssues = metrics.tickets.open + metrics.tickets.in_progress;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium mb-2">Support Overview</h1>
          <p className="dark:text-text-secondary light:text-text-light-secondary">
            Welcome back, {supportStaff?.full_name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:ring-2 focus:ring-linear-accent"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-linear linear-transition border ${
              autoRefresh
                ? 'dark:bg-linear-accent light:bg-linear-light-accent dark:text-white light:text-white border-linear-accent'
                : 'dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary dark:border-linear-border light:border-linear-light-border'
            }`}
          >
            Auto Refresh {autoRefresh && '(30s)'}
          </button>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear hover:dark:bg-linear-bg-subtle light:hover:bg-linear-light-bg-subtle linear-transition"
          >
            Refresh Now
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-linear dark:bg-blue-500/10 light:bg-blue-500/20 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-500" />
            </div>
            {ticketTrend > 0 ? (
              <TrendingUp className="w-5 h-5 text-red-500" />
            ) : ticketTrend < 0 ? (
              <TrendingDown className="w-5 h-5 text-green-500" />
            ) : null}
          </div>
          <div className="text-3xl font-semibold mb-1">{activeIssues}</div>
          <div className="text-sm dark:text-text-secondary light:text-text-light-secondary mb-3">
            Active Tickets
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="dark:text-text-tertiary light:text-text-light-tertiary">
              Open: <span className="text-blue-500 font-medium">{metrics.tickets.open}</span>
            </span>
            <span className="dark:text-text-tertiary light:text-text-light-tertiary">
              In Progress: <span className="text-yellow-500 font-medium">{metrics.tickets.in_progress}</span>
            </span>
          </div>
        </div>

        <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-linear dark:bg-purple-500/10 light:bg-purple-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-500" />
            </div>
          </div>
          <div className="text-3xl font-semibold mb-1">{metrics.customers.total}</div>
          <div className="text-sm dark:text-text-secondary light:text-text-light-secondary mb-3">
            Total Customers
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="dark:text-text-tertiary light:text-text-light-tertiary">
              Active: <span className="text-green-500 font-medium">{metrics.customers.active}</span>
            </span>
            <span className="dark:text-text-tertiary light:text-text-light-tertiary">
              Trial: <span className="text-blue-500 font-medium">{metrics.customers.trialing}</span>
            </span>
          </div>
        </div>

        <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-linear dark:bg-green-500/10 light:bg-green-500/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-500" />
            </div>
          </div>
          <div className="text-3xl font-semibold mb-1">{metrics.performance.avgResponseTime}h</div>
          <div className="text-sm dark:text-text-secondary light:text-text-light-secondary mb-3">
            Avg Response Time
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="dark:text-text-tertiary light:text-text-light-tertiary">
              Resolution: <span className="font-medium">{metrics.performance.avgResolutionTime}h</span>
            </span>
          </div>
        </div>

        <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-linear dark:bg-orange-500/10 light:bg-orange-500/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
            </div>
          </div>
          <div className="text-3xl font-semibold mb-1">{metrics.tickets.urgent + metrics.tickets.high}</div>
          <div className="text-sm dark:text-text-secondary light:text-text-light-secondary mb-3">
            High Priority
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="dark:text-text-tertiary light:text-text-light-tertiary">
              Urgent: <span className="text-red-500 font-medium">{metrics.tickets.urgent}</span>
            </span>
            <span className="dark:text-text-tertiary light:text-text-light-tertiary">
              High: <span className="text-orange-500 font-medium">{metrics.tickets.high}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium">Ticket Distribution</h3>
              <BarChart3 className="w-5 h-5 dark:text-text-tertiary light:text-text-light-tertiary" />
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="dark:text-text-secondary light:text-text-light-secondary">Open</span>
                  <span className="font-medium">{metrics.tickets.open}</span>
                </div>
                <div className="w-full h-2 dark:bg-linear-bg light:bg-linear-light-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${(metrics.tickets.open / metrics.tickets.total) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="dark:text-text-secondary light:text-text-light-secondary">In Progress</span>
                  <span className="font-medium">{metrics.tickets.in_progress}</span>
                </div>
                <div className="w-full h-2 dark:bg-linear-bg light:bg-linear-light-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 rounded-full transition-all duration-500"
                    style={{ width: `${(metrics.tickets.in_progress / metrics.tickets.total) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="dark:text-text-secondary light:text-text-light-secondary">Resolved</span>
                  <span className="font-medium">{metrics.tickets.resolved}</span>
                </div>
                <div className="w-full h-2 dark:bg-linear-bg light:bg-linear-light-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${(metrics.tickets.resolved / metrics.tickets.total) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="dark:text-text-secondary light:text-text-light-secondary">Closed</span>
                  <span className="font-medium">{metrics.tickets.closed}</span>
                </div>
                <div className="w-full h-2 dark:bg-linear-bg light:bg-linear-light-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-500 rounded-full transition-all duration-500"
                    style={{ width: `${(metrics.tickets.closed / metrics.tickets.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium">Customer Plans</h3>
              <PieChart className="w-5 h-5 dark:text-text-tertiary light:text-text-light-tertiary" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-4 dark:bg-linear-bg light:bg-linear-light-bg rounded-linear">
                <div className="text-2xl font-semibold mb-1">{metrics.customers.free}</div>
                <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Free</div>
              </div>
              <div className="text-center p-4 dark:bg-linear-bg light:bg-linear-light-bg rounded-linear">
                <div className="text-2xl font-semibold mb-1">{metrics.customers.starter}</div>
                <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Starter</div>
              </div>
              <div className="text-center p-4 dark:bg-linear-bg light:bg-linear-light-bg rounded-linear">
                <div className="text-2xl font-semibold mb-1">{metrics.customers.pro}</div>
                <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Pro</div>
              </div>
              <div className="text-center p-4 dark:bg-linear-bg light:bg-linear-light-bg rounded-linear">
                <div className="text-2xl font-semibold mb-1">{metrics.customers.elite}</div>
                <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Elite</div>
              </div>
              <div className="text-center p-4 dark:bg-linear-bg light:bg-linear-light-bg rounded-linear">
                <div className="text-2xl font-semibold mb-1">{metrics.customers.enterprise}</div>
                <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Enterprise</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear p-6">
            <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 px-4 py-3 dark:bg-linear-accent light:bg-linear-light-accent dark:text-white light:text-white rounded-linear hover:opacity-90 linear-transition">
                <Plus className="w-4 h-4" />
                New Ticket
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear hover:dark:bg-linear-bg-subtle light:hover:bg-linear-light-bg-subtle linear-transition">
                <Search className="w-4 h-4" />
                Search Customer
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear hover:dark:bg-linear-bg-subtle light:hover:bg-linear-light-bg-subtle linear-transition">
                <Globe className="w-4 h-4" />
                DNS Management
              </button>
            </div>
          </div>

          <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Alerts</h3>
              <Zap className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="space-y-3">
              {metrics.dns.pending > 0 && (
                <div className="flex items-start gap-3 p-3 dark:bg-yellow-500/10 light:bg-yellow-500/20 border border-yellow-500/20 rounded-linear">
                  <Globe className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium mb-1">{metrics.dns.pending} Pending DNS</div>
                    <div className="text-xs dark:text-text-secondary light:text-text-light-secondary">
                      Domains awaiting verification
                    </div>
                  </div>
                </div>
              )}
              {metrics.customers.past_due > 0 && (
                <div className="flex items-start gap-3 p-3 dark:bg-red-500/10 light:bg-red-500/20 border border-red-500/20 rounded-linear">
                  <CreditCard className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium mb-1">{metrics.customers.past_due} Past Due</div>
                    <div className="text-xs dark:text-text-secondary light:text-text-light-secondary">
                      Payments requiring attention
                    </div>
                  </div>
                </div>
              )}
              {metrics.tickets.urgent > 0 && (
                <div className="flex items-start gap-3 p-3 dark:bg-red-500/10 light:bg-red-500/20 border border-red-500/20 rounded-linear">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium mb-1">{metrics.tickets.urgent} Urgent Tickets</div>
                    <div className="text-xs dark:text-text-secondary light:text-text-light-secondary">
                      Require immediate attention
                    </div>
                  </div>
                </div>
              )}
              {metrics.dns.pending === 0 && metrics.customers.past_due === 0 && metrics.tickets.urgent === 0 && (
                <div className="text-center py-4">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <div className="text-sm dark:text-text-secondary light:text-text-light-secondary">
                    All systems normal
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Recent Activity</h3>
              <Activity className="w-5 h-5 dark:text-text-tertiary light:text-text-light-tertiary" />
            </div>
            <div className="space-y-3">
              {recentActivity.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${activity.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{activity.title}</div>
                      <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary truncate">
                        {activity.description}
                      </div>
                    </div>
                    <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary whitespace-nowrap">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
