export type PlanName = 'standard' | 'elite' | 'enterprise';

export interface PlanLimits {
  maxTeamMembers: number | null;
  maxCreators: number | null;
  maxCampaigns: number | null;
  maxAdSetsPerCampaign: number | null;
  maxContentItems: number | null;
}

export const PLAN_CONFIG: Record<PlanName, PlanLimits> = {
  standard: {
    maxTeamMembers: 1,
    maxCreators: 25,
    maxCampaigns: 5,
    maxAdSetsPerCampaign: 5,
    maxContentItems: 100,
  },
  elite: {
    maxTeamMembers: 5,
    maxCreators: 50,
    maxCampaigns: 10,
    maxAdSetsPerCampaign: 10,
    maxContentItems: 200,
  },
  enterprise: {
    maxTeamMembers: null,      // null = praktisch onbeperkt
    maxCreators: null,
    maxCampaigns: null,
    maxAdSetsPerCampaign: null,
    maxContentItems: null,
  },
};
