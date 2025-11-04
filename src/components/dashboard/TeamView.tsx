import { useState, useEffect } from 'react';
import { Plus, Mail, Shield, Crown, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { usePlanLimits } from '../../contexts/PlanLimitsContext';
import { UpgradeModal } from '../modals/UpgradeModal';
import { TeamManagement } from './TeamManagement';
import type { Database } from '../../lib/database.types';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type WorkspaceMember = Database['public']['Tables']['workspace_members']['Row'];

interface TeamViewProps {
  workspace: Workspace;
}

interface MemberWithEmail extends WorkspaceMember {
  user_email?: string;
  user_name?: string;
}

export function TeamView({ workspace }: TeamViewProps) {
  const { user } = useAuth();
  const { canAddTeamMember, refreshUsage } = usePlanLimits();
  const [members, setMembers] = useState<MemberWithEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [currentUserName, setCurrentUserName] = useState<string>('');

  useEffect(() => {
    loadMembers();
    loadCurrentUserName();
  }, [workspace.id, user]);

  const loadCurrentUserName = async () => {
    if (!user) return;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();

    setCurrentUserName(profileData?.full_name || user.email || 'You');
  };

  const loadMembers = async () => {
    const { data, error } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading members:', error);
    } else {
      const membersWithEmails = await Promise.all(
        (data || []).map(async (member) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', member.user_id)
            .maybeSingle();

          const email = profileData?.email || 'Unknown';
          const name = profileData?.full_name || email;

          return {
            ...member,
            user_email: email,
            user_name: name,
          };
        })
      );
      setMembers(membersWithEmails);
    }
    await refreshUsage();
    setLoading(false);
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!canAddTeamMember()) {
      setShowInviteModal(false);
      setShowUpgradeModal(true);
      return;
    }

    setInviting(true);

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', inviteEmail)
        .maybeSingle();

      if (profileError || !profileData) {
        alert('User not found. They must create an account first with this email address.');
        setInviting(false);
        return;
      }

      const { error } = await supabase.from('workspace_members').insert({
        workspace_id: workspace.id,
        user_id: profileData.id,
        role: inviteRole,
        invited_by: user.id,
      });

      if (error) {
        console.error('Error inviting member:', error);
        if (error.code === '23505') {
          alert('This user is already a member of this workspace.');
        } else {
          alert('Failed to invite member. Please try again.');
        }
      } else {
        setShowInviteModal(false);
        setInviteEmail('');
        setInviteRole('member');
        await refreshUsage();
        loadMembers();
      }
    } catch (error) {
      console.error('Error inviting member:', error);
      alert('Failed to invite member. Please try again.');
    } finally {
      setInviting(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-linear-warning" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-linear-info" />;
      default:
        return null;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'text-linear-warning bg-linear-warning/10 border-linear-warning-border/20';
      case 'admin':
        return 'text-linear-info bg-linear-info/10 border-linear-info-border/20';
      case 'member':
        return 'text-linear-success bg-linear-success/10 border-linear-success-border/20';
      default:
        return 'text-text-tertiary bg-text-tertiary/10 border-linear-border/20';
    }
  };

  if (loading) {
    return <div className="text-text-secondary">Loading team members...</div>;
  }

  const isOwner = workspace.owner_id === user?.id;
  const memberLimit = workspace.max_team_members;
  const canAddMore = workspace.plan === 'elite' || !memberLimit || members.length + 1 < memberLimit;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h2 className="text-xl md:text-2xl font-medium mb-2">Team</h2>
          <p className="text-sm md:text-base text-text-secondary">
            Manage workspace members and permissions
            {memberLimit && workspace.plan === 'standard' && (
              <span className="ml-2 text-text-tertiary">
                ({members.length + 1}/{memberLimit} members)
              </span>
            )}
          </p>
        </div>
        {isOwner && (
          <button
            onClick={() => {
              if (canAddTeamMember()) {
                setShowInviteModal(true);
              } else {
                setShowUpgradeModal(true);
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-linear linear-transition ${
              canAddTeamMember()
                ? 'bg-white hover:bg-gray-100 text-black'
                : 'dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle dark:text-text-tertiary light:text-text-light-tertiary cursor-not-allowed'
            }`}
          >
            {canAddTeamMember() ? <Plus className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            Invite Member
          </button>
        )}
      </div>

      {!canAddMore && workspace.plan === 'standard' && (
        <div className="mb-6 p-4 bg-linear-warning/10 border border-linear-warning-border/20 rounded-linear-lg">
          <p className="text-sm text-linear-warning">
            You've reached the team member limit for the Standard plan. Upgrade to Elite for unlimited members.
          </p>
        </div>
      )}

      <div className="bg-linear-bg-secondary border border-linear-border-subtle rounded-linear-lg overflow-hidden">
        <div className="divide-y divide-linear-border-subtle">
          {members.map((member) => {
            const isCurrentUser = member.user_id === user?.id;
            const isMemberOwner = member.role === 'owner';
            return (
              <div key={member.id} className={`p-4 ${isMemberOwner ? 'bg-linear-bg-subtle' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isMemberOwner ? 'bg-linear-accent' : 'bg-linear-bg-subtle'}`}>
                    <span className={`text-sm font-medium ${isMemberOwner ? 'text-black' : 'text-text-secondary'}`}>
                      {member.user_name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">
                        {member.user_name}
                        {isCurrentUser && ' (You)'}
                      </h3>
                      {getRoleIcon(member.role)}
                    </div>
                    <p className="text-sm text-text-secondary">
                      Joined {new Date(member.joined_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full border ${getRoleColor(member.role)}`}>
                      {member.role}
                    </span>
                    <TeamManagement
                      member={member}
                      isOwner={isOwner}
                      onMemberUpdated={loadMembers}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-linear-bg-secondary border border-linear-border rounded-linear-lg p-6 w-full max-w-lg">
            <h3 className="text-xl font-medium mb-6">Invite Team Member</h3>
            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-linear-bg border border-linear-border rounded-linear focus:outline-none focus:border-linear-accent"
                  placeholder="colleague@company.com"
                  required
                />
                <p className="text-xs text-text-tertiary mt-1">
                  They must have an existing account to be invited
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full px-4 py-2 bg-linear-bg border border-linear-border rounded-linear focus:outline-none focus:border-linear-accent"
                >
                  <option value="member">Member - Can create and edit</option>
                  <option value="admin">Admin - Can manage members</option>
                  <option value="viewer">Viewer - Read-only access</option>
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 bg-linear-bg-subtle hover:bg-linear-border-subtle rounded-linear linear-transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail}
                  className="flex-1 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {inviting ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={workspace.plan}
        workspaceId={workspace.id}
        reason="You've reached your team member limit. Upgrade to add more team members to your workspace."
        suggestedPlan={workspace.plan === 'free' ? 'standard' : workspace.plan === 'standard' ? 'elite' : 'enterprise'}
      />
    </div>
  );
}
