import { useState } from 'react';
import { Shield, Trash2, MoreVertical, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type WorkspaceMember = Database['public']['Tables']['workspace_members']['Row'];

interface MemberWithEmail extends WorkspaceMember {
  user_email?: string;
  user_name?: string;
}

interface TeamManagementProps {
  member: MemberWithEmail;
  isOwner: boolean;
  onMemberUpdated: () => void;
}

export function TeamManagement({ member, isOwner, onMemberUpdated }: TeamManagementProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [newRole, setNewRole] = useState(member.role);
  const [processing, setProcessing] = useState(false);

  const handleRoleChange = async () => {
    if (!isOwner || member.role === 'owner') return;

    try {
      setProcessing(true);

      const { error } = await supabase
        .from('workspace_members')
        .update({ role: newRole })
        .eq('id', member.id);

      if (error) throw error;

      setShowRoleModal(false);
      onMemberUpdated();
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update member role');
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!isOwner || member.role === 'owner') return;

    try {
      setProcessing(true);

      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', member.id);

      if (error) throw error;

      setShowRemoveModal(false);
      onMemberUpdated();
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member');
    } finally {
      setProcessing(false);
    }
  };

  if (!isOwner || member.role === 'owner') {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-1 hover:bg-linear-bg-subtle rounded linear-transition"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-1 w-48 bg-linear-bg-secondary border border-linear-border rounded-linear shadow-xl z-20">
            <button
              onClick={() => {
                setShowRoleModal(true);
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-linear-bg-subtle linear-transition text-left"
            >
              <Shield className="w-4 h-4" />
              Change Role
            </button>
            <button
              onClick={() => {
                setShowRemoveModal(true);
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-linear-error/10 text-linear-error linear-transition text-left"
            >
              <Trash2 className="w-4 h-4" />
              Remove Member
            </button>
          </div>
        </>
      )}

      {showRoleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-linear-bg-secondary border border-linear-border rounded-linear-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium">Change Role</h3>
              <button
                onClick={() => setShowRoleModal(false)}
                className="p-1 hover:bg-linear-bg-subtle rounded linear-transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-text-secondary">
                Change role for <span className="font-medium">{member.user_name}</span>
              </p>

              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 bg-linear-bg border border-linear-border rounded-linear cursor-pointer hover:bg-linear-bg-subtle linear-transition">
                  <input
                    type="radio"
                    value="admin"
                    checked={newRole === 'admin'}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium text-sm">Admin</p>
                    <p className="text-xs text-text-tertiary">Can manage members and settings</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-linear-bg border border-linear-border rounded-linear cursor-pointer hover:bg-linear-bg-subtle linear-transition">
                  <input
                    type="radio"
                    value="member"
                    checked={newRole === 'member'}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium text-sm">Member</p>
                    <p className="text-xs text-text-tertiary">Can create and edit content</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-linear-bg border border-linear-border rounded-linear cursor-pointer hover:bg-linear-bg-subtle linear-transition">
                  <input
                    type="radio"
                    value="viewer"
                    checked={newRole === 'viewer'}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium text-sm">Viewer</p>
                    <p className="text-xs text-text-tertiary">Read-only access</p>
                  </div>
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="flex-1 px-4 py-2 bg-linear-bg-subtle hover:bg-linear-border-subtle rounded-linear linear-transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRoleChange}
                  disabled={processing || newRole === member.role}
                  className="flex-1 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Updating...' : 'Update Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRemoveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-linear-bg-secondary border border-linear-error/20 rounded-linear-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium text-linear-error">Remove Member</h3>
              <button
                onClick={() => setShowRemoveModal(false)}
                className="p-1 hover:bg-linear-bg-subtle rounded linear-transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-text-secondary">
                Are you sure you want to remove <span className="font-medium">{member.user_name}</span> from this workspace?
              </p>
              <p className="text-sm text-text-tertiary">
                They will lose access to all workspace content and data.
              </p>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowRemoveModal(false)}
                  className="flex-1 px-4 py-2 bg-linear-bg-subtle hover:bg-linear-border-subtle rounded-linear linear-transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveMember}
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-linear-error hover:bg-linear-error/90 text-white rounded-linear linear-transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Removing...' : 'Remove Member'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
