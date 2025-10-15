import { Database } from 'lucide-react';
import type { Database as DB } from '../../lib/database.types';

type Workspace = DB['public']['Tables']['workspaces']['Row'];

interface WorkspaceSettingsProps {
  workspace: Workspace;
}

export function WorkspaceSettings({ workspace }: WorkspaceSettingsProps) {
  return (
    <div className="space-y-6">

      <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-6">
        <h3 className="text-lg font-medium mb-4">Workspace Information</h3>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle">
            <span className="text-text-secondary">Workspace ID</span>
            <span className="font-mono text-xs">{workspace.id}</span>
          </div>
          <div className="flex justify-between py-2 border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle">
            <span className="text-text-secondary">Slug</span>
            <span className="font-mono">{workspace.slug}</span>
          </div>
          <div className="flex justify-between py-2 border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle">
            <span className="text-text-secondary">Plan</span>
            <span className="capitalize">{workspace.plan}</span>
          </div>
          <div className="flex justify-between py-2 border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle">
            <span className="text-text-secondary">Created</span>
            <span>{new Date(workspace.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-text-secondary">Status</span>
            <span className={`capitalize ${
              workspace.subscription_status === 'active' || workspace.subscription_status === 'trialing'
                ? 'text-linear-success'
                : workspace.subscription_status === 'past_due'
                ? 'text-linear-warning'
                : 'text-linear-error'
            }`}>
              {workspace.subscription_status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
