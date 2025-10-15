import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Workspace = Database['public']['Tables']['workspaces']['Row'];

interface WorkspaceUsage {
  creatorCount: number;
  storageUsedBytes: number;
  teamMemberCount: number;
  campaignCount: number;
  taskCount: number;
}

interface PlanLimits {
  maxCreators: number | null;
  maxStorageGb: number | null;
  maxTeamMembers: number | null;
  features: Record<string, boolean>;
}

interface TrialInfo {
  isActive: boolean;
  daysRemaining: number;
  startedAt: string | null;
  endsAt: string | null;
}

interface PlanLimitsContextType {
  workspace: Workspace | null;
  usage: WorkspaceUsage;
  limits: PlanLimits;
  trialInfo: TrialInfo;
  loading: boolean;
  canCreateCreator: () => boolean;
  canUploadContent: (fileSizeBytes: number) => boolean;
  canAddTeamMember: () => boolean;
  hasFeature: (featureKey: string) => boolean;
  getStorageUsagePercent: () => number;
  getCreatorUsagePercent: () => number;
  getTeamMemberUsagePercent: () => number;
  refreshUsage: () => Promise<void>;
  isTrialExpiringSoon: () => boolean;
}

const PlanLimitsContext = createContext<PlanLimitsContextType | undefined>(undefined);

export function PlanLimitsProvider({ children, workspace }: { children: ReactNode; workspace: Workspace | null }) {
  const [usage, setUsage] = useState<WorkspaceUsage>({
    creatorCount: 0,
    storageUsedBytes: 0,
    teamMemberCount: 0,
    campaignCount: 0,
    taskCount: 0,
  });
  const [limits, setLimits] = useState<PlanLimits>({
    maxCreators: null,
    maxStorageGb: null,
    maxTeamMembers: null,
    features: {},
  });
  const [trialInfo, setTrialInfo] = useState<TrialInfo>({
    isActive: false,
    daysRemaining: 0,
    startedAt: null,
    endsAt: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (workspace) {
      loadLimitsAndUsage();
    }
  }, [workspace?.id]);

  const loadLimitsAndUsage = async () => {
    if (!workspace) return;

    const isTrial = workspace.subscription_status === 'trialing';
    const trialEndsAt = workspace.trial_ends_at ? new Date(workspace.trial_ends_at) : null;
    const now = new Date();
    const isTrialActive = isTrial && trialEndsAt && trialEndsAt > now;

    let daysRemaining = 0;
    if (trialEndsAt && trialEndsAt > now) {
      daysRemaining = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    setTrialInfo({
      isActive: isTrialActive || false,
      daysRemaining,
      startedAt: workspace.trial_started_at,
      endsAt: workspace.trial_ends_at,
    });

    if (isTrialActive) {
      setLimits({
        maxCreators: 25,
        maxStorageGb: 5,
        maxTeamMembers: 3,
        features: {
          revenue_tracking: false,
          advanced_analytics: false,
          team_collaboration: true,
          priority_support: false,
          task_assignment: false,
          ...((workspace.features as Record<string, boolean>) || {}),
        },
      });
    } else if (workspace.plan === 'standard') {
      setLimits({
        maxCreators: 25,
        maxStorageGb: 5,
        maxTeamMembers: 3,
        features: {
          revenue_tracking: false,
          advanced_analytics: false,
          team_collaboration: true,
          priority_support: false,
          task_assignment: false,
          ...((workspace.features as Record<string, boolean>) || {}),
        },
      });
    } else if (workspace.plan === 'elite') {
      setLimits({
        maxCreators: 50,
        maxStorageGb: 25,
        maxTeamMembers: 5,
        features: {
          revenue_tracking: true,
          advanced_analytics: true,
          team_collaboration: true,
          priority_support: true,
          task_assignment: true,
          ...((workspace.features as Record<string, boolean>) || {}),
        },
      });
    } else {
      setLimits({
        maxCreators: workspace.max_creators,
        maxStorageGb: workspace.max_storage_gb,
        maxTeamMembers: workspace.max_team_members,
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

      if (error) {
        console.error('Error loading workspace usage:', error);
        console.log('Falling back to direct queries...');

        const [creatorsRes, storageRes, membersRes, campaignsRes, tasksRes] = await Promise.all([
          supabase.from('creators').select('id', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
          supabase.from('content_media').select('file_size').eq('workspace_id', workspace.id),
          supabase.from('workspace_members').select('id', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
          supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
          supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
        ]);

        const storageUsed = storageRes.data?.reduce((sum, item) => sum + (item.file_size || 0), 0) || 0;

        setUsage({
          creatorCount: creatorsRes.count || 0,
          storageUsedBytes: storageUsed,
          teamMemberCount: (membersRes.count || 0) + 1,
          campaignCount: campaignsRes.count || 0,
          taskCount: tasksRes.count || 0,
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
        });
      }
    } catch (err) {
      console.error('Unexpected error in refreshUsage:', err);
    }
  };

  const canCreateCreator = () => {
    if (limits.maxCreators === null) return true;
    return usage.creatorCount < limits.maxCreators;
  };

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

  const isTrialExpiringSoon = () => {
    return trialInfo.isActive && trialInfo.daysRemaining <= 2;
  };

  return (
    <PlanLimitsContext.Provider
      value={{
        workspace,
        usage,
        limits,
        trialInfo,
        loading,
        canCreateCreator,
        canUploadContent,
        canAddTeamMember,
        hasFeature,
        getStorageUsagePercent,
        getCreatorUsagePercent,
        getTeamMemberUsagePercent,
        refreshUsage,
        isTrialExpiringSoon,
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
