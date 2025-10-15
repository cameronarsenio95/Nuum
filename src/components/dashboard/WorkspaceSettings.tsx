import { useState } from 'react';
import { Download, Database, FileText, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database as DB } from '../../lib/database.types';

type Workspace = DB['public']['Tables']['workspaces']['Row'];

interface WorkspaceSettingsProps {
  workspace: Workspace;
}

export function WorkspaceSettings({ workspace }: WorkspaceSettingsProps) {
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const exportWorkspaceData = async () => {
    try {
      setExporting(true);
      setExportStatus(null);

      const [
        { data: campaigns },
        { data: creators },
        { data: tasks },
        { data: content },
        { data: adSets },
        { data: notes },
      ] = await Promise.all([
        supabase.from('campaigns').select('*').eq('workspace_id', workspace.id),
        supabase.from('creators').select('*').eq('workspace_id', workspace.id),
        supabase.from('tasks').select('*').eq('workspace_id', workspace.id),
        supabase.from('content_media').select('*').eq('workspace_id', workspace.id),
        supabase.from('ad_sets').select('*'),
        supabase.from('notes').select('*').eq('workspace_id', workspace.id),
      ]);

      const exportData = {
        workspace: {
          id: workspace.id,
          name: workspace.name,
          plan: workspace.plan,
          exported_at: new Date().toISOString(),
        },
        campaigns: campaigns || [],
        creators: creators || [],
        tasks: tasks || [],
        content: content || [],
        adSets: adSets || [],
        notes: notes || [],
      };

      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${workspace.slug}-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setExportStatus({ type: 'success', text: 'Workspace data exported successfully!' });
    } catch (error: any) {
      console.error('Export error:', error);
      setExportStatus({ type: 'error', text: error.message || 'Failed to export data' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 mt-6">
      <div className="dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear-lg p-6 md:p-8">
        <h3 className="text-lg font-medium mb-6 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Workspace Data
        </h3>

        <div className="space-y-4">
          <div className="flex items-start justify-between p-4 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-text-secondary" />
                <h4 className="font-medium">Export All Data</h4>
              </div>
              <p className="text-sm text-text-secondary mb-4">
                Download a complete JSON export of your workspace data including campaigns, creators, tasks, content, and notes.
              </p>
              <button
                onClick={exportWorkspaceData}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                {exporting ? 'Exporting...' : 'Export Data'}
              </button>
            </div>
          </div>

          <div className="p-4 bg-linear-info/10 border border-linear-info/20 rounded-linear">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-linear-info flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-linear-info mb-1">GDPR Compliance</p>
                <p className="text-text-secondary">
                  Your data is stored securely and can be exported at any time. You can also request complete data deletion by deleting your account in Settings.
                </p>
              </div>
            </div>
          </div>
        </div>

        {exportStatus && (
          <div className={`mt-4 p-4 rounded-linear border ${
            exportStatus.type === 'success'
              ? 'bg-linear-success/10 border-linear-success-border/20 text-linear-success'
              : 'bg-linear-error/10 border-linear-error-border/20 text-linear-error'
          }`}>
            {exportStatus.text}
          </div>
        )}
      </div>

    </div>
  );
}
