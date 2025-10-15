import { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Save, X, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSupportAuth } from '../../contexts/SupportAuthContext';
import type { Database } from '../../lib/database.types';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface CustomerDetailViewProps {
  workspaceId: string;
  onBack: () => void;
}

interface WorkspaceData {
  workspace: Workspace;
  owner: Profile;
  ownerEmail: string;
  notes: any[];
}

export function CustomerDetailView({ workspaceId, onBack }: CustomerDetailViewProps) {
  const { hasPermission, logAction } = useSupportAuth();
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Workspace>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    loadCustomerData();
  }, [workspaceId]);

  const loadCustomerData = async () => {
    try {
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single();

      if (workspaceError) throw workspaceError;

      const { data: owner } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', workspace.owner_id)
        .maybeSingle();

      const { data: userData } = await supabase.auth.admin.getUserById(workspace.owner_id);

      const { data: notes } = await supabase
        .from('support_workspace_notes')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      setData({
        workspace,
        owner: owner || {} as Profile,
        ownerEmail: userData?.user?.email || 'No email',
        notes: notes || [],
      });

      setEditForm({
        plan: workspace.plan,
        subscription_status: workspace.subscription_status,
        max_creators: workspace.max_creators,
        max_team_members: workspace.max_team_members,
        max_storage_gb: workspace.max_storage_gb,
        subscription_expires_at: workspace.subscription_expires_at,
      });

      await logAction('view_workspace', 'workspace', workspaceId, {
        customerEmail: userData?.user?.email,
        workspaceId: workspace.id,
        workspaceName: workspace.name,
      });
    } catch (error) {
      console.error('Error loading customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!data || !hasPermission('modify')) return;

    setSaving(true);
    try {
      const previousState = {
        plan: data.workspace.plan,
        subscription_status: data.workspace.subscription_status,
        max_creators: data.workspace.max_creators,
        max_team_members: data.workspace.max_team_members,
        max_storage_gb: data.workspace.max_storage_gb,
        subscription_expires_at: data.workspace.subscription_expires_at,
      };

      const { error } = await supabase
        .from('workspaces')
        .update(editForm)
        .eq('id', workspaceId);

      if (error) throw error;

      await logAction('modify_subscription', 'workspace', workspaceId, {
        customerEmail: data.ownerEmail,
        workspaceId: data.workspace.id,
        workspaceName: data.workspace.name,
        previousState,
        newState: editForm,
        actionDetails: { modified_fields: Object.keys(editForm) },
      });

      setEditing(false);
      setShowConfirmDialog(false);
      await loadCustomerData();
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'elite':
        return 'text-linear-accent bg-linear-accent/10 border-linear-accent/20';
      case 'standard':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'free':
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
      default:
        return 'text-text-tertiary bg-text-tertiary/10 border-linear-border/20';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-linear-success bg-linear-success/10 border-linear-success-border/20';
      case 'trialing':
        return 'text-linear-info bg-linear-info/10 border-linear-info-border/20';
      case 'past_due':
        return 'text-linear-warning bg-linear-warning/10 border-linear-warning-border/20';
      case 'canceled':
      case 'expired':
        return 'text-linear-error bg-linear-error/10 border-linear-error-border/20';
      default:
        return 'text-text-tertiary bg-text-tertiary/10 border-linear-border/20';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-2 border-linear-accent border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 dark:text-text-secondary light:text-text-light-secondary">Loading customer data...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="dark:text-text-secondary light:text-text-light-secondary">Customer not found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-linear"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-medium mb-1">{data.workspace.name}</h2>
          <p className="dark:text-text-secondary light:text-text-light-secondary">Customer ID: {data.workspace.id}</p>
        </div>
        {hasPermission('modify') && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
        )}
        {editing && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditing(false);
                setEditForm({
                  plan: data.workspace.plan,
                  subscription_status: data.workspace.subscription_status,
                  max_creators: data.workspace.max_creators,
                  max_team_members: data.workspace.max_team_members,
                  max_storage_gb: data.workspace.max_storage_gb,
                  subscription_expires_at: data.workspace.subscription_expires_at,
                });
              }}
              className="flex items-center gap-2 px-4 py-2 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle hover:dark:bg-linear-border-subtle rounded-linear linear-transition"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={() => setShowConfirmDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-linear-success hover:bg-green-600 text-white rounded-linear linear-transition"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear p-6">
          <h3 className="text-lg font-medium mb-4">Subscription Details</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Plan</label>
              {editing ? (
                <select
                  value={editForm.plan}
                  onChange={(e) => setEditForm({ ...editForm, plan: e.target.value as any })}
                  className="w-full px-3 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                >
                  <option value="free">Free</option>
                  <option value="standard">Standard</option>
                  <option value="elite">Elite</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              ) : (
                <span className={`inline-block text-sm px-3 py-1 rounded-full border capitalize ${getPlanBadgeColor(data.workspace.plan)}`}>
                  {data.workspace.plan}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              {editing ? (
                <select
                  value={editForm.subscription_status}
                  onChange={(e) => setEditForm({ ...editForm, subscription_status: e.target.value as any })}
                  className="w-full px-3 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                >
                  <option value="active">Active</option>
                  <option value="trialing">Trialing</option>
                  <option value="past_due">Past Due</option>
                  <option value="canceled">Canceled</option>
                  <option value="expired">Expired</option>
                </select>
              ) : (
                <span className={`inline-block text-sm px-3 py-1 rounded-full border capitalize ${getStatusBadgeColor(data.workspace.subscription_status)}`}>
                  {data.workspace.subscription_status}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Expires At</label>
              {editing ? (
                <input
                  type="datetime-local"
                  value={editForm.subscription_expires_at ? new Date(editForm.subscription_expires_at).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEditForm({ ...editForm, subscription_expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  className="w-full px-3 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                />
              ) : (
                <p className="dark:text-text-secondary light:text-text-light-secondary">
                  {data.workspace.subscription_expires_at
                    ? new Date(data.workspace.subscription_expires_at).toLocaleString()
                    : 'Never'}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear p-6">
          <h3 className="text-lg font-medium mb-4">Plan Limits</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Max Creators</label>
              {editing ? (
                <input
                  type="number"
                  value={editForm.max_creators === null ? '' : editForm.max_creators}
                  onChange={(e) => setEditForm({ ...editForm, max_creators: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Unlimited"
                  className="w-full px-3 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                />
              ) : (
                <p className="dark:text-text-secondary light:text-text-light-secondary">
                  {data.workspace.max_creators === null ? 'Unlimited' : data.workspace.max_creators}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Max Team Members</label>
              {editing ? (
                <input
                  type="number"
                  value={editForm.max_team_members === null ? '' : editForm.max_team_members}
                  onChange={(e) => setEditForm({ ...editForm, max_team_members: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Unlimited"
                  className="w-full px-3 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                />
              ) : (
                <p className="dark:text-text-secondary light:text-text-light-secondary">
                  {data.workspace.max_team_members === null ? 'Unlimited' : data.workspace.max_team_members}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Max Storage (GB)</label>
              {editing ? (
                <input
                  type="number"
                  value={editForm.max_storage_gb === null ? '' : editForm.max_storage_gb}
                  onChange={(e) => setEditForm({ ...editForm, max_storage_gb: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Unlimited"
                  className="w-full px-3 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                />
              ) : (
                <p className="dark:text-text-secondary light:text-text-light-secondary">
                  {data.workspace.max_storage_gb === null ? 'Unlimited' : `${data.workspace.max_storage_gb} GB`}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear p-6">
        <h3 className="text-lg font-medium mb-4">Owner Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <p className="dark:text-text-secondary light:text-text-light-secondary">{data.ownerEmail}</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <p className="dark:text-text-secondary light:text-text-light-secondary">{data.owner.full_name || 'Not set'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Company</label>
            <p className="dark:text-text-secondary light:text-text-light-secondary">{data.owner.company || 'Not set'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Job Title</label>
            <p className="dark:text-text-secondary light:text-text-light-secondary">{data.owner.job_title || 'Not set'}</p>
          </div>
        </div>
      </div>

      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50" onClick={() => setShowConfirmDialog(false)}>
          <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4 mb-4">
              <div className="p-2 bg-linear-warning/10 rounded-linear">
                <AlertTriangle className="w-6 h-6 text-linear-warning" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-medium mb-2">Confirm Changes</h3>
                <p className="dark:text-text-secondary light:text-text-light-secondary mb-4">
                  Are you sure you want to modify this customer's subscription and limits? This action will be logged in the audit trail.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                disabled={saving}
                className="flex-1 px-4 py-2 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle hover:dark:bg-linear-border-subtle rounded-linear linear-transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-linear-success hover:bg-green-600 text-white rounded-linear linear-transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
