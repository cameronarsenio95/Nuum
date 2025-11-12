import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { PLAN_CONFIG, type PlanLimits as BasePlanLimits } from '../utils/planConfig';

type Workspace = Database['public']['Tables']['workspaces']['Row'];

interface WorkspaceUsage {
  creatorCount: number;
  storageUsedBytes: number;
  teamMemberCount: number;
  campaignCount: number;
  taskCount: number;
  contentCount: number;
}

type PlanLimits = BasePlanLimits & {
  maxStorageGb: number | null;
  features: Record<string, boolean>;
};

interface TrialInfo {
  isActive: boolean;
  daysRemaining: number;
  startedAt: string | null;
  endsAt: string | null;
}

interface FreeAccountInfo {
  isFreePlan: boolean;
  daysRemaining: number;
  expiresAt: Date | null;
  isFrozen: boolean;
  isExpired: boolean;
}

interface PlanLimitsContextType {
  workspace: Workspace | null;
  usage: WorkspaceUsage;
  limits: PlanLimits;
  trialInfo: TrialInfo;
  freeAccountInfo: FreeAccountInfo;
  loading: boolean;

  // bestaande helpers
  canCreateCreator: () => boolean;
  canUploadContent: (fileSizeBytes: number) => boolean;
  canAddTeamMember: () => boolean;
  hasFeature: (featureKey: string) => boolean;
  getStorageUsagePercent: () => number;
  getCreatorUsagePercent: () => number;
  getTeamMemberUsagePercent: () => number;

  // nieuwe helpers/limits
  canCreateCampaign: () => boolean;
  canCreateAdSet: (campaignId: string) => Promise<boolean>;
  canAddContentItem: () => boolean;
  getCampaignUsagePercent: () => number;
  getContentUsagePercent: () => number;
  getAdSetCountForCampaign: (campaignId: string) => Promise<number>;

  // system
  refreshUsage: () => Promise<void>;
  isTrialExpiringSoon: () => boolean;
  isFreeAccountExpiringSoon: () => boolean;
}

const PlanLimitsContext = createContext<PlanLimitsContextType | undefined>(undefined);

export function PlanLimitsProvider({
  children,
  workspace,
}: {
  children: ReactNode;
  workspace: Workspace | null;
}) {
  const [usage, setUsage] = useState<WorkspaceUsage>({
    creatorCount: 0,
    storageUsedBytes: 0,
    teamMemberCount: 0,
    campaignCount: 0,
    taskCount: 0,
    contentCount: 0,
  });

  const [limits, setLimits] = useState<PlanLimits>({
    maxCreators: null,
    maxTeamMembers: null,
    maxCampaigns: null,
    maxAdSetsPerCampaign: null,
    maxContentItems: null,
    maxStorageGb: null,
    features: {},
  });

  const [trialInfo, setTrialInfo] = useState<TrialInfo>({
    isActive: false,
    daysRemaining: 0,
    startedAt: null,
    endsAt: null,
  });

  const [freeAccountInfo, setFreeAccountInfo] = useState<FreeAccountInfo>({
    isFreePlan: false,
    daysRemaining: 0,
    expiresAt: null,
    isFrozen: false,
    isExpired: false,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (workspace) {
      loadLimitsAndUsage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id]);

  const loadLimitsAndUsage = async () => {
    if (!workspace) return;

    const isTrial = workspace.subscription_status === 'trialing';
    const trialEndsAt = workspace.trial_ends_at ? new Date(workspace.trial_ends_at) : null;
    const now = new Date();
    const isTrialActive = isTrial && trialEndsAt != null && trialEndsAt > now;

    let daysRemaining = 0;
    if (trialEndsAt && trialEndsAt > now) {
      daysRemaining = Math.ceil(
        (trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    setTrialInfo({
      isActive: !!isTrialActive,
      daysRemaining,
      startedAt: workspace.trial_started_at,
      endsAt: workspace.trial_ends_at,
    });

    const isFreePlan = workspace.plan === 'free';
    const isFrozen = isFreePlan && workspace.subscription_status === 'frozen';
    const createdAt = new Date(workspace.created_at);
    const freeExpiresAt = new Date(createdAt);
    freeExpiresAt.setDate(freeExpiresAt.getDate() + 7);

    let freeDaysRemaining = 0;
    if (isFreePlan && freeExpiresAt > now) {
      freeDaysRemaining = Math.ceil(
        (freeExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    setFreeAccountInfo({
      isFreePlan,
      daysRemaining: freeDaysRemaining,
      expiresAt: isFreePlan ? freeExpiresAt : null,
      isFrozen,
      isExpired: isFreePlan && freeExpiresAt <= now,
    });

    // Limits via PLAN_CONFIG met trial → Elite cap
    if (isTrialActive) {
      const eliteBase = PLAN_CONFIG.elite;
      setLimits({
        ...eliteBase,
        maxStorageGb: 25,
        features: {
          revenue_tracking: true,
          advanced_analytics: true,
          export_data: true,
          team_collaboration: true,
          priority_support: true,
          task_assignment: true,
          ...((workspace.features as Record<string, boolean>) || {}),
        },
      });
    } else if (workspace.plan === 'standard') {
      const standardBase = PLAN_CONFIG.standard;
      setLimits({
        ...standardBase,
        maxStorageGb: 5,
        features: {
          revenue_tracking: true,
          advanced_analytics: true,
          team_collaboration: true,
          priority_support: false,
          task_assignment: false,
          export_data: false,
          ...((workspace.features as Record<string, boolean>) || {}),
        },
      });
    } else if (workspace.plan === 'elite') {
      const eliteBase = PLAN_CONFIG.elite;
      setLimits({
        ...eliteBase,
        maxStorageGb: 25,
        features: {
          revenue_tracking: true,
          advanced_analytics: true,
          export_data: true,
          team_collaboration: true,
          priority_support: true,
          task_assignment: true,
          ...((workspace.features as Record<string, boolean>) || {}),
        },
      });
    } else if (workspace.plan === 'enterprise') {
      const enterpriseBase = PLAN_CONFIG.enterprise;
      setLimits({
        ...enterpriseBase,
        maxStorageGb: workspace.max_storage_gb,
        features: (workspace.features as Record<string, boolean>) || {},
      });
    } else {
      // fallback / free / legacy
      setLimits({
        maxCreators: workspace.max_creators,
        maxTeamMembers: workspace.max_team_members,
        maxCampaigns: null,
        maxAdSetsPerCampaign: null,
        maxContentItems: null,
        maxStorageGb: workspace.max_storage_gb,
        features: (workspace.features as Record<string, boolean>) || {},
      });
    }

    await refreshUsage();
    setLoading(false);
  };

  const refreshUsage = async () => {
    if (!workspace) return;

    try {
      const { data, error } = await supabase.rpc('get_workspace_usage', {
        workspace_id_input: workspace.id,
      });

      // Altijd losse contentCount ophalen (RPC heeft dit vaak niet)
      const [{ count: contentCount = 0 } = {} as any] = await Promise.all([
        supabase
          .from('content_media')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', workspace.id),
      ]);

      if (error) {
        console.error('Error loading workspace usage:', error);
        // Fallback op directe queries
        const [creatorsRes, storageRes, membersRes, campaignsRes, tasksRes, contentCountRes] =
          await Promise.all([
            supabase
              .from('creators')
              .select('id', { count: 'exact', head: true })
              .eq('workspace_id', workspace.id),
            supabase
              .from('content_media')
              .select('file_size')
              .eq('workspace_id', workspace.id),
            supabase
              .from('workspace_members')
              .select('id', { count: 'exact', head: true })
              .eq('workspace_id', workspace.id),
            supabase
              .from('campaigns')
              .select('id', { count: 'exact', head: true })
              .eq('workspace_id', workspace.id),
            supabase
              .from('tasks')
              .select('id', { count: 'exact', head: true })
              .eq('workspace_id', workspace.id),
            supabase
              .from('content_media')
              .select('id', { count: 'exact', head: true })
              .eq('workspace_id', workspace.id),
          ]);

        const storageUsed =
          storageRes.data?.reduce(
            (sum, item) => sum + (item.file_size || 0),
            0
          ) || 0;

        setUsage({
          creatorCount: creatorsRes.count || 0,
          storageUsedBytes: storageUsed,
          teamMemberCount: (membersRes.count || 0) + 1,
          campaignCount: campaignsRes.count || 0,
          taskCount: tasksRes.count || 0,
          contentCount: contentCountRes.count || 0,
        });
        return;
      }

      if (data && data.length > 0) {
        const usageData = data[0];
        setUsage({
          creatorCount: Number(usageData.creator_count) || 0,
          storageUsedBytes: Number(usageData.storage_used_bytes) || 0,
          teamMemberCount: Number(usageData.team_member_count) || 0,
          campaignCount: Number(usageData.campaign_count) || 0,
          taskCount: Number(usageData.task_count) || 0,
          contentCount: Number((usageData as any).content_count) || contentCount || 0,
        });
      } else {
        // geen data terug → tenminste contentCount invullen
        setUsage((prev) => ({ ...prev, contentCount: contentCount || 0 }));
      }
    } catch (err) {
      console.error('Unexpected error in refreshUsage:', err);
    }
  };

  // -------- Per-campaign ad set count --------
  const getAdSetCountForCampaign = async (campaignId: string) => {
    const { count, error } = await supabase
      .from('ad_sets')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaignId);

    if (error) {
      console.error('getAdSetCountForCampaign error:', error);
      return 0;
    }
    return count || 0;
  };

  // -------- Checks --------
  const canCreateCreator = () => {
    if (limits.maxCreators === null) return true;
    return usage.creatorCount < limits.maxCreators;
  };

  const canCreateCampaign = () => {
    if (limits.maxCampaigns === null) return true;
    return usage.campaignCount < limits.maxCampaigns;
  };

  const canCreateAdSet = async (campaignId: string) => {
    if (limits.maxAdSetsPerCampaign === null) return true;
    const count = await getAdSetCountForCampaign(campaignId);
    return count < limits.maxAdSetsPerCampaign;
  };

  // content-items limiet (aantal records)
  const canAddContentItem = () => {
    if (limits.maxContentItems === null) return true;
    return usage.contentCount < limits.maxContentItems;
  };

  // storage-cap (bestaande)
  const canUploadContent = (fileSizeBytes: number) => {
    if (limits.maxStorageGb === null) return true;
    const maxStorageBytes = limits.maxStorageGb * 1024 * 1024 * 1024;
    return usage.storageUsedBytes + fileSizeBytes <= maxStorageBytes;
  };

  const canAddTeamMember = () => {
    if (limits.maxTeamMembers === null) return true;
    return usage.teamMemberCount < limits.maxTeamMembers;
  };

  const hasFeature = (featureKey: string) => {
    return limits.features[featureKey] === true;
  };

  // -------- Usage percents --------
  const getStorageUsagePercent = () => {
    if (limits.maxStorageGb === null) return 0;
    const maxStorageBytes = limits.maxStorageGb * 1024 * 1024 * 1024;
    return Math.min((usage.storageUsedBytes / maxStorageBytes) * 100, 100);
  };

  const getCreatorUsagePercent = () => {
    if (limits.maxCreators === null) return 0;
    return Math.min((usage.creatorCount / limits.maxCreators) * 100, 100);
  };

  const getTeamMemberUsagePercent = () => {
    if (limits.maxTeamMembers === null) return 0;
    return Math.min((usage.teamMemberCount / limits.maxTeamMembers) * 100, 100);
  };

  const getCampaignUsagePercent = () => {
    if (limits.maxCampaigns === null) return 0;
    return Math.min((usage.campaignCount / limits.maxCampaigns) * 100, 100);
  };

  const getContentUsagePercent = () => {
    if (limits.maxContentItems === null) return 0;
    return Math.min((usage.contentCount / limits.maxContentItems) * 100, 100);
    };

  // -------- Nudges --------
  const isTrialExpiringSoon = () => {
    return trialInfo.isActive && trialInfo.daysRemaining <= 2;
  };

  const isFreeAccountExpiringSoon = () => {
    return (
      freeAccountInfo.isFreePlan &&
      !freeAccountInfo.isFrozen &&
      freeAccountInfo.daysRemaining <= 2
    );
  };

  return (
    <PlanLimitsContext.Provider
      value={{
        workspace,
        usage,
        limits,
        trialInfo,
        freeAccountInfo,
        loading,
        // checks
        canCreateCreator,
        canUploadContent,
        canAddTeamMember,
        hasFeature,
        canCreateCampaign,
        canCreateAdSet,
        canAddContentItem,
        // usage percents
        getStorageUsagePercent,
        getCreatorUsagePercent,
        getTeamMemberUsagePercent,
        getCampaignUsagePercent,
        getContentUsagePercent,
        // tools
        refreshUsage,
        getAdSetCountForCampaign,
        // nudges
        isTrialExpiringSoon,
        isFreeAccountExpiringSoon,
      }}
    >
      {children}
    </PlanLimitsContext.Provider>
  );
}

export function usePlanLimits() {
  const context = useContext(PlanLimitsContext);
  if (context === undefined) {
    throw new Error('usePlanLimits must be used within a PlanLimitsProvider');
  }
  return context;
}
