import { usePlanLimits } from '../../contexts/PlanLimitsContext';
import { useState, useEffect } from 'react';
import { Plus, Instagram, Mail, Phone, Tag, Edit2, Trash2, X, Link2, User, Lock, Ghost } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { usePlanLimits } from '../../contexts/PlanLimitsContext';
import { useWritePermission } from '../../hooks/useWritePermission';
import { UpgradeModal } from '../modals/UpgradeModal';
import type { Database } from '../../lib/database.types';
import { CreatorFormModal, CreatorDetailModal, AddToCampaignModal } from './CreatorsView-modals';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type Creator = Database['public']['Tables']['creators']['Row'];
type Campaign = Database['public']['Tables']['campaigns']['Row'];
type AdSet = Database['public']['Tables']['ad_sets']['Row'];

interface CreatorsViewProps {
  workspace: Workspace;
}

export function CreatorsView({ workspace }: CreatorsViewProps) {
  const { user } = useAuth();
  const { limits, usage, getCreatorUsagePercent, refreshUsage } = usePlanLimits();
  const { canWrite, canCreateCreator, checkWritePermission } = useWritePermission();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [creatorRevenues, setCreatorRevenues] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [creatorToDelete, setCreatorToDelete] = useState<Creator | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [creatorAdSets, setCreatorAdSets] = useState<AdSet[]>([]);
  const [newCreator, setNewCreator] = useState({
    name: '',
    email: '',
    phone: '',
    instagram_handle: '',
    tiktok_handle: '',
    snapchat_handle: '',
    notes: '',
    status: 'active' as 'active' | 'inactive' | 'blacklisted',
    tags: [] as string[],
    discount_code: '',
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    loadCreators();
    loadCampaigns();
    loadCreatorRevenues();
  }, [workspace.id]);

  const loadCreators = async () => {
    const { data, error } = await supabase
      .from('creators')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading creators:', error);
    } else {
      setCreators(data || []);
    }
    await refreshUsage();
    setLoading(false);
  };

  const loadCampaigns = async () => {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading campaigns:', error);
    }
    setCampaigns(data || []);
  };

  const loadCreatorRevenues = async () => {
    const { data: creatorsList } = await supabase
      .from('creators')
      .select('id')
      .eq('workspace_id', workspace.id);

    if (!creatorsList) return;

    const revenues: Record<string, number> = {};

    for (const creator of creatorsList) {
      const { data } = await supabase
        .from('ad_sets')
        .select('revenue')
        .eq('creator_id', creator.id);

      if (data) {
        revenues[creator.id] = data.reduce((sum, adSet) => {
          return sum + (Number(adSet.revenue) || 0);
        }, 0);
      }
    }

    setCreatorRevenues(revenues);
  };

  const loadCreatorAdSets = async (creatorId: string) => {
    const { data, error } = await supabase
      .from('ad_sets')
      .select('*, campaign:campaigns(name)')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading ad sets:', error);
    } else {
      setCreatorAdSets(data || []);
    }
  };

  const handleCreateCreator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!canCreateCreator()) {
      setShowCreateModal(false);
      setShowUpgradeModal(true);
      return;
    }

    const { data, error } = await supabase.from('creators').insert({
      workspace_id: workspace.id,
      name: newCreator.name,
      email: newCreator.email || null,
      phone: newCreator.phone || null,
      instagram_handle: newCreator.instagram_handle || null,
      tiktok_handle: newCreator.tiktok_handle || null,
      snapchat_handle: newCreator.snapchat_handle || null,
      notes: newCreator.notes || null,
      created_by: user.id,
      status: newCreator.status,
      tags: newCreator.tags.length > 0 ? newCreator.tags : null,
      discount_code: newCreator.discount_code || null,
    }).select();

    if (error) {
      console.error('Error creating creator:', error);
      alert(`Failed to create creator: ${error.message}`);
    } else {
      console.log('Creator created successfully:', data);
      setShowCreateModal(false);
      resetForm();
      loadCreators();
    }
  };

  const handleUpdateCreator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCreator) return;

    if (!checkWritePermission('update creators')) {
      setShowEditModal(false);
      setShowUpgradeModal(true);
      return;
    }

    const { error } = await supabase
      .from('creators')
      .update({
        name: newCreator.name,
        email: newCreator.email || null,
        phone: newCreator.phone || null,
        instagram_handle: newCreator.instagram_handle || null,
        tiktok_handle: newCreator.tiktok_handle || null,
        snapchat_handle: newCreator.snapchat_handle || null,
        notes: newCreator.notes || null,
        status: newCreator.status,
        tags: newCreator.tags.length > 0 ? newCreator.tags : null,
        discount_code: newCreator.discount_code || null,
      })
      .eq('id', selectedCreator.id);

    if (error) {
      console.error('Error updating creator:', error);
    } else {
      setShowEditModal(false);
      setSelectedCreator(null);
      resetForm();
      loadCreators();
    }
  };

  const handleDeleteCreator = async () => {
    if (!creatorToDelete) return;

    const { error } = await supabase
      .from('creators')
      .delete()
      .eq('id', creatorToDelete.id);

    if (error) {
      console.error('Error deleting creator:', error);
    } else {
      setShowDeleteConfirm(false);
      setCreatorToDelete(null);
      loadCreators();
    }
  };

  const handleAddToCampaign = async (campaignId: string) => {
    if (!selectedCreator) return;

    const { error } = await supabase.from('ad_sets').insert({
      campaign_id: campaignId,
      creator_id: selectedCreator.id,
      name: `${selectedCreator.name} - Ad Set`,
      platform: 'META',
      status: 'draft',
      revenue: 0,
      spend: 0,
    });

    if (error) {
      console.error('Error creating ad set:', error);
    } else {
      setShowCampaignModal(false);
      loadCreatorAdSets(selectedCreator.id);
    }
  };

  const handleRemoveAdSet = async (adSetId: string) => {
    const { error } = await supabase
      .from('ad_sets')
      .delete()
      .eq('id', adSetId);

    if (error) {
      console.error('Error removing ad set:', error);
    } else if (selectedCreator) {
      loadCreatorAdSets(selectedCreator.id);
      loadCreatorRevenues();
    }
  };

  const openEditModal = (creator: Creator) => {
    setSelectedCreator(creator);
    setNewCreator({
      name: creator.name,
      email: creator.email || '',
      phone: creator.phone || '',
      instagram_handle: creator.instagram_handle || '',
      tiktok_handle: creator.tiktok_handle || '',
      snapchat_handle: creator.snapchat_handle || '',
      notes: creator.notes || '',
      status: creator.status as 'active' | 'inactive' | 'blacklisted',
      tags: creator.tags || [],
      discount_code: creator.discount_code || '',
    });
    setShowEditModal(true);
  };

  const openDetailModal = async (creator: Creator) => {
    setSelectedCreator(creator);
    await loadCreatorAdSets(creator.id);
    setShowDetailModal(true);
  };

  const openDeleteConfirm = (creator: Creator) => {
    setCreatorToDelete(creator);
    setShowDeleteConfirm(true);
  };

  const openCampaignModal = (creator: Creator) => {
    setSelectedCreator(creator);
    setShowCampaignModal(true);
  };

  const resetForm = () => {
    setNewCreator({
      name: '',
      email: '',
      phone: '',
      instagram_handle: '',
      tiktok_handle: '',
      snapchat_handle: '',
      notes: '',
      status: 'active',
      tags: [],
      discount_code: '',
    });
    setTagInput('');
  };

  const addTag = () => {
    if (tagInput.trim() && !newCreator.tags.includes(tagInput.trim())) {
      setNewCreator({ ...newCreator, tags: [...newCreator.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setNewCreator({ ...newCreator, tags: newCreator.tags.filter(t => t !== tag) });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-nuum-accent-green bg-nuum-dark-green border-nuum-accent-green/20';
      case 'inactive':
        return 'text-nuum-accent-orange bg-nuum-accent-brown border-nuum-accent-orange/20';
      case 'blacklisted':
        return 'text-nuum-accent-red bg-nuum-dark-red border-nuum-accent-red/20';
      default:
        return 'text-nuum-text-secondary bg-nuum-border border-nuum-border';
    }
  };

  if (loading) {
    return <div className="text-nuum-text-secondary">Loading creators...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl md:text-2xl font-medium">Creators</h2>
            {limits.maxCreators !== null && (
              <span className="text-sm text-nuum-text-secondary">
                {usage.creatorCount} / {limits.maxCreators} creators
              </span>
            )}
          </div>
          <p className="text-nuum-text-secondary">Manage your influencer database</p>
          {limits.maxCreators !== null && getCreatorUsagePercent() > 80 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-2 bg-nuum-border rounded-full overflow-hidden">
                <div
                  className={`h-full linear-transition ${
                    getCreatorUsagePercent() >= 100
                      ? 'bg-nuum-accent-red'
                      : getCreatorUsagePercent() >= 90
                      ? 'bg-nuum-accent-orange'
                      : 'bg-nuum-accent-blue'
                  }`}
                  style={{ width: `${Math.min(getCreatorUsagePercent(), 100)}%` }}
                />
              </div>
              <span className="text-xs text-nuum-text-secondary whitespace-nowrap">
                {getCreatorUsagePercent().toFixed(0)}%
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => {
            if (canCreateCreator()) {
              setShowCreateModal(true);
            } else {
              setShowUpgradeModal(true);
            }
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg linear-transition ${
            canCreateCreator()
              ? 'bg-nuum-accent-blue hover:bg-nuum-dark-blue text-white'
              : 'bg-nuum-border text-nuum-text-secondary cursor-not-allowed'
          }`}
        >
          {canCreateCreator() ? <Plus className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          Add Creator
        </button>
      </div>

      {creators.length === 0 ? (
        <div className="text-center py-20 bg-nuum-surface border border-nuum-border rounded-xl">
          <UsersIcon className="w-12 h-12 text-nuum-text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No creators yet</h3>
          <p className="text-nuum-text-secondary mb-6">Add your first creator to start building your database</p>
          <button
            onClick={() => {
              if (canCreateCreator()) {
                setShowCreateModal(true);
              } else {
                setShowUpgradeModal(true);
              }
            }}
            className={`px-4 py-2 rounded-lg linear-transition ${
              canCreateCreator()
                ? 'bg-nuum-accent-blue hover:bg-nuum-dark-blue text-white'
                : 'bg-nuum-border text-nuum-text-secondary cursor-not-allowed'
            }`}
          >
            Add Creator
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {creators.map((creator) => (
            <div
              key={creator.id}
              className="bg-nuum-surface border border-nuum-border rounded-xl p-6 hover:border-nuum-accent-blue/40 linear-transition cursor-pointer group"
              onClick={() => openDetailModal(creator)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-medium text-lg mb-1">{creator.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(creator.status)}`}>
                    {creator.status}
                  </span>
                </div>
                <div className="opacity-0 group-hover:opacity-100 linear-transition">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(creator);
                    }}
                    className="p-1 hover:bg-nuum-border rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {creator.email && (
                  <div className="flex items-center gap-2 text-sm text-nuum-text-secondary">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{creator.email}</span>
                  </div>
                )}
                {creator.phone && (
                  <div className="flex items-center gap-2 text-sm text-nuum-text-secondary">
                    <Phone className="w-4 h-4" />
                    <span>{creator.phone}</span>
                  </div>
                )}
                {creator.discount_code && (
                  <div className="flex items-center gap-2 text-sm text-nuum-text-secondary">
                    <Tag className="w-4 h-4" />
                    <span className="font-mono text-white">{creator.discount_code}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {creator.instagram_handle && (
                  <a
                    href={`https://instagram.com/${creator.instagram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 px-2 py-1 bg-nuum-dark-blue rounded-lg text-xs text-nuum-text-secondary hover:text-nuum-text-main linear-transition"
                  >
                    <Instagram className="w-3 h-3" />
                    <span>@{creator.instagram_handle}</span>
                  </a>
                )}
                {creator.tiktok_handle && (
                  <a
                    href={`https://tiktok.com/@${creator.tiktok_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 px-2 py-1 bg-nuum-dark-blue rounded-lg text-xs text-nuum-text-secondary hover:text-nuum-text-main linear-transition"
                  >
                    <Tag className="w-3 h-3" />
                    <span>@{creator.tiktok_handle}</span>
                  </a>
                )}
                {creator.snapchat_handle && (
                  <a
                    href={`https://snapchat.com/add/${creator.snapchat_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 px-2 py-1 bg-nuum-dark-blue rounded-lg text-xs text-nuum-text-secondary hover:text-nuum-text-main linear-transition"
                  >
                    <Ghost className="w-3 h-3" />
                    <span>@{creator.snapchat_handle}</span>
                  </a>
                )}
              </div>

              {creator.tags && creator.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {creator.tags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 bg-nuum-dark-blue text-nuum-accent-blue text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                  {creator.tags.length > 3 && (
                    <span className="px-2 py-0.5 text-nuum-text-secondary text-xs">
                      +{creator.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {creatorRevenues[creator.id] > 0 && (
                <div className="mt-3 pt-3 border-t border-nuum-border">
                  <div className="text-xs text-nuum-text-secondary mb-1">Total Revenue</div>
                  <div className="text-lg font-medium text-nuum-accent-green">
                    ${creatorRevenues[creator.id].toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreatorFormModal
          newCreator={newCreator}
          setNewCreator={setNewCreator}
          tagInput={tagInput}
          setTagInput={setTagInput}
          addTag={addTag}
          removeTag={removeTag}
          onSubmit={handleCreateCreator}
          onCancel={() => { setShowCreateModal(false); resetForm(); }}
          submitLabel="Add Creator"
          title="Add New Creator"
        />
      )}

      {showEditModal && selectedCreator && (
        <CreatorFormModal
          newCreator={newCreator}
          setNewCreator={setNewCreator}
          tagInput={tagInput}
          setTagInput={setTagInput}
          addTag={addTag}
          removeTag={removeTag}
          onSubmit={handleUpdateCreator}
          onCancel={() => { setShowEditModal(false); resetForm(); }}
          submitLabel="Save Changes"
          title="Edit Creator"
          onDelete={() => {
            setShowEditModal(false);
            openDeleteConfirm(selectedCreator);
          }}
        />
      )}

      {showDetailModal && selectedCreator && (
        <CreatorDetailModal
          creator={selectedCreator}
          adSets={creatorAdSets}
          onClose={() => setShowDetailModal(false)}
          onEdit={() => {
            setShowDetailModal(false);
            openEditModal(selectedCreator);
          }}
          onAddToCampaign={() => {
            setShowDetailModal(false);
            openCampaignModal(selectedCreator);
          }}
          onRemoveAdSet={handleRemoveAdSet}
        />
      )}

      {showCampaignModal && selectedCreator && (
        <AddToCampaignModal
          campaigns={campaigns}
          onSelect={(campaignId) => handleAddToCampaign(campaignId)}
          onClose={() => setShowCampaignModal(false)}
        />
      )}

      {showDeleteConfirm && creatorToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-nuum-surface border border-nuum-border rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-medium mb-4">Delete Creator</h3>
            <p className="text-nuum-text-secondary mb-6">
              Are you sure you want to delete <span className="font-medium text-nuum-text-main">{creatorToDelete.name}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-nuum-border hover:bg-nuum-border/70 rounded-lg linear-transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCreator}
                className="flex-1 px-4 py-2 bg-nuum-accent-red hover:bg-nuum-dark-red text-white rounded-lg linear-transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={workspace.plan}
        workspaceId={workspace.id}
        reason="You've reached your creator limit. Upgrade to add more creators to your workspace."
        suggestedPlan={workspace.plan === 'free' ? 'standard' : 'elite'}
      />
    </div>
  );
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
