import { useState, useEffect } from 'react';
import { Plus, Calendar, Search, Filter, CheckCircle, Clock, AlertCircle, Eye, List, LayoutGrid } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { DeliverableDetailModal, CreateDeliverableModal } from './DeliverablesView-modals';
import type { Database } from '../../lib/database.types';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type Deliverable = Database['public']['Tables']['deliverables']['Row'];
type Campaign = Database['public']['Tables']['campaigns']['Row'];
type Creator = Database['public']['Tables']['creators']['Row'];

interface DeliverablesViewProps {
  workspace: Workspace;
}

interface DeliverableWithRelations extends Deliverable {
  campaign?: Campaign;
  creator?: Creator;
}

export function DeliverablesView({ workspace }: DeliverablesViewProps) {
  const { user } = useAuth();
  const [deliverables, setDeliverables] = useState<DeliverableWithRelations[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCampaign, setFilterCampaign] = useState<string>('all');
  const [filterCreator, setFilterCreator] = useState<string>('all');
  const [selectedDeliverable, setSelectedDeliverable] = useState<DeliverableWithRelations | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [workspace.id]);

  const loadData = async () => {
    setLoading(true);

    const [deliverablesData, campaignsData, creatorsData] = await Promise.all([
      supabase
        .from('deliverables')
        .select(`
          *,
          campaign:campaigns(*),
          creator:creators(*)
        `)
        .order('due_date', { ascending: true, nullsFirst: false }),
      supabase
        .from('campaigns')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('name'),
      supabase
        .from('creators')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('name')
    ]);

    if (deliverablesData.data) {
      const filtered = deliverablesData.data.filter((d: any) =>
        d.campaign && d.campaign.workspace_id === workspace.id
      );
      setDeliverables(filtered as DeliverableWithRelations[]);
    }

    if (campaignsData.data) setCampaigns(campaignsData.data);
    if (creatorsData.data) setCreators(creatorsData.data);

    setLoading(false);
  };

  const getFilteredDeliverables = () => {
    return deliverables.filter(d => {
      const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           d.creator?.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCampaign = filterCampaign === 'all' || d.campaign_id === filterCampaign;
      const matchesCreator = filterCreator === 'all' || d.creator_id === filterCreator;

      return matchesSearch && matchesCampaign && matchesCreator;
    });
  };

  const getDeliverablesByStatus = (status: string) => {
    return getFilteredDeliverables().filter(d => d.status === status);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'dark:text-text-tertiary dark:bg-linear-bg-hover dark:border-linear-border light:text-text-light-tertiary light:bg-linear-light-bg-hover light:border-linear-light-border';
      case 'in_review':
        return 'dark:text-linear-warning dark:bg-linear-warning-subtle dark:border-linear-warning-border light:text-linear-light-warning light:bg-linear-light-warning-subtle light:border-linear-light-warning-border';
      case 'approved':
        return 'dark:text-linear-info dark:bg-linear-info-subtle dark:border-linear-info-border light:text-linear-light-info light:bg-linear-light-info-subtle light:border-linear-light-info-border';
      case 'posted':
        return 'dark:text-linear-accent dark:bg-linear-accent-subtle dark:border-linear-accent-border light:text-linear-light-accent light:bg-linear-light-accent-subtle light:border-linear-light-accent-border';
      case 'completed':
        return 'dark:text-linear-success dark:bg-linear-success-subtle dark:border-linear-success-border light:text-linear-light-success light:bg-linear-light-success-subtle light:border-linear-light-success-border';
      default:
        return 'dark:text-text-tertiary dark:bg-linear-bg-hover dark:border-linear-border light:text-text-light-tertiary light:bg-linear-light-bg-hover light:border-linear-light-border';
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const getDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return null;
    const days = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const statuses = [
    { value: 'pending', label: 'Pending', icon: Clock },
    { value: 'in_review', label: 'In Review', icon: Eye },
    { value: 'approved', label: 'Approved', icon: CheckCircle },
    { value: 'posted', label: 'Posted', icon: CheckCircle },
    { value: 'completed', label: 'Completed', icon: CheckCircle }
  ];

  if (loading) {
    return <div className="dark:text-text-secondary light:text-text-light-secondary">Loading deliverables...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-medium mb-2">Deliverables</h2>
          <p className="text-sm dark:text-text-secondary light:text-text-light-secondary">
            Manage content deliverables and track progress
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition"
        >
          <Plus className="w-4 h-4" />
          New Deliverable
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary" />
          <input
            type="text"
            placeholder="Search deliverables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
          />
        </div>

        <select
          value={filterCampaign}
          onChange={(e) => setFilterCampaign(e.target.value)}
          className="px-4 py-2 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
        >
          <option value="all">All Campaigns</option>
          {campaigns.map(campaign => (
            <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
          ))}
        </select>

        <select
          value={filterCreator}
          onChange={(e) => setFilterCreator(e.target.value)}
          className="px-4 py-2 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
        >
          <option value="all">All Creators</option>
          {creators.map(creator => (
            <option key={creator.id} value={creator.id}>{creator.name}</option>
          ))}
        </select>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('board')}
            className={`p-2 rounded-linear border linear-transition ${
              viewMode === 'board'
                ? 'dark:bg-linear-accent/10 light:bg-linear-light-accent/10 border-linear-accent'
                : 'dark:bg-linear-bg-secondary light:bg-white dark:border-linear-border light:border-linear-light-border'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-linear border linear-transition ${
              viewMode === 'list'
                ? 'dark:bg-linear-accent/10 light:bg-linear-light-accent/10 border-linear-accent'
                : 'dark:bg-linear-bg-secondary light:bg-white dark:border-linear-border light:border-linear-light-border'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {viewMode === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {statuses.map(status => {
            const statusDeliverables = getDeliverablesByStatus(status.value);
            const StatusIcon = status.icon;

            return (
              <div key={status.value} className="flex flex-col">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-medium text-sm flex items-center gap-2">
                    <StatusIcon className="w-4 h-4" />
                    {status.label}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full dark:bg-linear-bg-hover light:bg-linear-light-bg-hover">
                    {statusDeliverables.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  {statusDeliverables.length === 0 ? (
                    <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary text-center py-8">
                      No deliverables
                    </div>
                  ) : (
                    statusDeliverables.map(deliverable => {
                      const daysUntil = getDaysUntilDue(deliverable.due_date);
                      const overdue = isOverdue(deliverable.due_date);

                      return (
                        <div
                          key={deliverable.id}
                          onClick={() => setSelectedDeliverable(deliverable)}
                          className="p-4 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border light:border-linear-light-border rounded-linear cursor-pointer linear-transition hover:dark:bg-linear-bg-subtle hover:light:bg-linear-light-bg-subtle"
                        >
                          <div className="mb-2">
                            <div className="font-medium text-sm mb-1">{deliverable.title}</div>
                            <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">
                              {deliverable.creator?.name}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className={`px-2 py-1 rounded-full border capitalize ${getStatusColor(deliverable.type)}`}>
                              {deliverable.type}
                            </span>

                            {deliverable.due_date && (
                              <div className={`flex items-center gap-1 ${
                                overdue ? 'dark:text-linear-error light:text-linear-light-error' :
                                daysUntil && daysUntil <= 3 ? 'dark:text-linear-warning light:text-linear-light-warning' :
                                'dark:text-text-tertiary light:text-text-light-tertiary'
                              }`}>
                                <Calendar className="w-3 h-3" />
                                {overdue ? 'Overdue' : daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil}d`}
                              </div>
                            )}
                          </div>

                          {deliverable.campaign && (
                            <div className="mt-2 pt-2 border-t dark:border-linear-border-subtle light:border-linear-light-border">
                              <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary truncate">
                                {deliverable.campaign.name}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border light:border-linear-light-border rounded-linear-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b dark:border-linear-border light:border-linear-light-border">
                <tr>
                  <th className="text-left p-4 text-sm font-medium">Title</th>
                  <th className="text-left p-4 text-sm font-medium">Creator</th>
                  <th className="text-left p-4 text-sm font-medium">Campaign</th>
                  <th className="text-left p-4 text-sm font-medium">Type</th>
                  <th className="text-left p-4 text-sm font-medium">Status</th>
                  <th className="text-left p-4 text-sm font-medium">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredDeliverables().length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-sm dark:text-text-tertiary light:text-text-light-tertiary">
                      No deliverables found
                    </td>
                  </tr>
                ) : (
                  getFilteredDeliverables().map(deliverable => {
                    const overdue = isOverdue(deliverable.due_date);

                    return (
                      <tr
                        key={deliverable.id}
                        onClick={() => setSelectedDeliverable(deliverable)}
                        className="border-b dark:border-linear-border-subtle light:border-linear-light-border cursor-pointer linear-transition hover:dark:bg-linear-bg-subtle hover:light:bg-linear-light-bg-subtle"
                      >
                        <td className="p-4">
                          <div className="font-medium text-sm">{deliverable.title}</div>
                          {deliverable.description && (
                            <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary mt-1 line-clamp-1">
                              {deliverable.description}
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-sm">{deliverable.creator?.name}</td>
                        <td className="p-4 text-sm">{deliverable.campaign?.name}</td>
                        <td className="p-4">
                          <span className="text-xs px-2 py-1 rounded-full border capitalize dark:bg-linear-bg-hover light:bg-linear-light-bg-hover dark:border-linear-border light:border-linear-light-border">
                            {deliverable.type}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-1 rounded-full border capitalize ${getStatusColor(deliverable.status)}`}>
                            {deliverable.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4">
                          {deliverable.due_date ? (
                            <div className={`text-sm flex items-center gap-1 ${
                              overdue ? 'dark:text-linear-error light:text-linear-light-error' : ''
                            }`}>
                              {overdue && <AlertCircle className="w-4 h-4" />}
                              {new Date(deliverable.due_date).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-sm dark:text-text-tertiary light:text-text-light-tertiary">No date</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {deliverables.length === 0 && !loading && (
        <div className="text-center py-12 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border light:border-linear-light-border rounded-linear-lg">
          <Calendar className="w-12 h-12 mx-auto mb-4 dark:text-text-tertiary light:text-text-light-tertiary" />
          <h3 className="text-lg font-medium mb-2">No deliverables yet</h3>
          <p className="text-sm dark:text-text-secondary light:text-text-light-secondary mb-4">
            Create your first deliverable to start tracking content
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition"
          >
            <Plus className="w-4 h-4" />
            Create Deliverable
          </button>
        </div>
      )}

      {selectedDeliverable && (
        <DeliverableDetailModal
          deliverable={selectedDeliverable}
          onClose={() => setSelectedDeliverable(null)}
          onUpdate={loadData}
        />
      )}

      {showCreateModal && (
        <CreateDeliverableModal
          workspaceId={workspace.id}
          campaigns={campaigns}
          creators={creators}
          onClose={() => setShowCreateModal(false)}
          onCreate={loadData}
        />
      )}
    </div>
  );
}
