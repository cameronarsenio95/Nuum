import { useState, useEffect } from 'react';
import { Plug, Search, Paperclip, Brain, Send, CheckCircle, XCircle, Clock, Link as LinkIcon, Code, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Workspace = Database['public']['Tables']['workspaces']['Row'];

interface LinearIntegration {
  id: string;
  linear_team_id: string;
  linear_team_name: string;
  sync_enabled: boolean;
  last_sync_at: string | null;
  sync_status: string;
  sync_error: string | null;
  mcp_config: any;
  created_at: string;
}

interface SyncLog {
  id: string;
  sync_type: string;
  direction: string;
  status: string;
  records_processed: number;
  records_created: number;
  records_updated: number;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
}

interface LinearMCPViewProps {
  workspace: Workspace;
}

export function LinearMCPView({ workspace }: LinearMCPViewProps) {
  const [integration, setIntegration] = useState<LinearIntegration | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatMessage, setChatMessage] = useState('');
  const [mcpConfigExpanded, setMcpConfigExpanded] = useState(false);

  useEffect(() => {
    loadIntegration();
    loadSyncLogs();
    subscribeToChanges();
  }, [workspace.id]);

  const loadIntegration = async () => {
    const { data, error } = await supabase
      .from('linear_integrations')
      .select('*')
      .eq('workspace_id', workspace.id)
      .maybeSingle();

    if (error) {
      console.error('Error loading integration:', error);
    } else {
      setIntegration(data);
    }
    setLoading(false);
  };

  const loadSyncLogs = async () => {
    const { data, error } = await supabase
      .from('integration_sync_logs')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('started_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error loading sync logs:', error);
    } else {
      setSyncLogs(data || []);
    }
  };

  const subscribeToChanges = () => {
    const channel = supabase
      .channel('linear_mcp_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'linear_integrations',
          filter: `workspace_id=eq.${workspace.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setIntegration(payload.new as LinearIntegration);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'integration_sync_logs',
          filter: `workspace_id=eq.${workspace.id}`,
        },
        (payload) => {
          setSyncLogs((prev) => [payload.new as SyncLog, ...prev.slice(0, 9)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-linear-success" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-linear-error" />;
      case 'in_progress':
      case 'started':
        return <Clock className="w-4 h-4 text-linear-info animate-spin" />;
      default:
        return <Clock className="w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary" />;
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleString();
  };

  const handleSendMessage = () => {
    console.log('Sending message:', chatMessage);
    setChatMessage('');
  };

  const defaultMcpConfig = {
    mcpServers: {
      linear: {
        command: "npx",
        args: ["-y", "@linear/mcp-server"],
        env: {
          LINEAR_API_KEY: "lin_api_***"
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="dark:text-text-secondary light:text-text-light-secondary">Loading Linear MCP...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <div className="w-10 h-10 rounded-linear bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Plug className="w-5 h-5 text-white" />
            </div>
            Linear MCP
          </h1>
          <p className="dark:text-text-secondary light:text-text-light-secondary">
            Connect Linear to your favorite tools including Cursor, Claude, ChatGPT, and more.
          </p>
        </div>
      </div>

      <div className="relative rounded-linear-lg overflow-hidden border dark:border-linear-border-subtle light:border-linear-light-border bg-white/5 backdrop-blur-sm p-8">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        </div>

        <div className="relative">
          <div className="flex items-center justify-center gap-8 mb-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-linear bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <LinkIcon className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-linear-accent animate-pulse" />
              <div className="w-3 h-3 rounded-full bg-linear-accent animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-3 h-3 rounded-full bg-linear-accent animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-linear bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Code className="w-6 h-6 text-white" />
              </div>
              <div className="w-12 h-12 rounded-linear bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div className="w-12 h-12 rounded-linear bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-center mb-2">Seamless Two-Way Integration</h3>
          <p className="text-center dark:text-text-secondary light:text-text-light-secondary max-w-2xl mx-auto">
            Real-time synchronization between Linear and your development tools. Use AI assistants with full Linear context.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="dark:bg-linear-bg-secondary light:bg-white rounded-linear-lg border dark:border-linear-border-subtle light:border-linear-light-border p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Connection Status
            </h3>
            {integration ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 dark:bg-linear-bg light:bg-linear-light-bg rounded-linear">
                  <div>
                    <p className="text-sm dark:text-text-tertiary light:text-text-light-tertiary">Team</p>
                    <p className="font-medium">{integration.linear_team_name}</p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 ${
                    integration.sync_status === 'syncing'
                      ? 'bg-linear-info-subtle text-linear-info'
                      : integration.sync_status === 'error'
                      ? 'bg-linear-error-subtle text-linear-error'
                      : 'bg-linear-success-subtle text-linear-success'
                  }`}>
                    {integration.sync_status === 'syncing' && <Clock className="w-3 h-3 animate-spin" />}
                    {integration.sync_status === 'error' && <XCircle className="w-3 h-3" />}
                    {integration.sync_status === 'idle' && <CheckCircle className="w-3 h-3" />}
                    {integration.sync_status.charAt(0).toUpperCase() + integration.sync_status.slice(1)}
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 dark:bg-linear-bg light:bg-linear-light-bg rounded-linear">
                  <div>
                    <p className="text-sm dark:text-text-tertiary light:text-text-light-tertiary">Last Sync</p>
                    <p className="font-medium text-sm">
                      {integration.last_sync_at ? formatDate(integration.last_sync_at) : 'Never'}
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-linear-accent hover:bg-linear-accent-hover text-linear-bg rounded-linear text-sm font-medium linear-transition">
                    Sync Now
                  </button>
                </div>
                {integration.sync_error && (
                  <div className="p-4 bg-linear-error-subtle rounded-linear border border-linear-error-border">
                    <p className="text-sm text-linear-error">{integration.sync_error}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Plug className="w-12 h-12 dark:text-text-tertiary light:text-text-light-tertiary mx-auto mb-4" />
                <p className="dark:text-text-secondary light:text-text-light-secondary mb-4">Not connected to Linear</p>
                <button className="px-6 py-3 bg-linear-accent hover:bg-linear-accent-hover text-linear-bg rounded-linear text-sm font-medium linear-transition">
                  Connect Linear Workspace
                </button>
              </div>
            )}
          </div>

          <div className="dark:bg-linear-bg-secondary light:bg-white rounded-linear-lg border dark:border-linear-border-subtle light:border-linear-light-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Code className="w-5 h-5" />
                MCP Configuration
              </h3>
              <button
                onClick={() => setMcpConfigExpanded(!mcpConfigExpanded)}
                className="text-sm dark:text-text-tertiary light:text-text-light-tertiary hover:dark:text-text-primary light:text-text-light-primary linear-transition"
              >
                {mcpConfigExpanded ? 'Collapse' : 'Expand'}
              </button>
            </div>
            <div className={`overflow-hidden linear-transition ${mcpConfigExpanded ? 'max-h-96' : 'max-h-32'}`}>
              <pre className="text-xs dark:bg-linear-bg light:bg-linear-light-bg p-4 rounded-linear overflow-x-auto">
                <code className="dark:text-text-secondary light:text-text-light-secondary">
                  {JSON.stringify(integration?.mcp_config || defaultMcpConfig, null, 2)}
                </code>
              </pre>
            </div>
            <div className="mt-4 text-xs dark:text-text-tertiary light:text-text-light-tertiary">
              <p>//mcp.linear.app/sse</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="dark:bg-linear-bg-secondary light:bg-white rounded-linear-lg border dark:border-linear-border-subtle light:border-linear-light-border p-6">
            <h3 className="font-semibold text-lg mb-4">Ask anything</h3>
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask anything about Linear data..."
                  className="w-full px-4 py-3 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent linear-transition"
                />
                <button
                  onClick={handleSendMessage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-linear-accent hover:bg-linear-accent-hover text-linear-bg rounded-linear linear-transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-3 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear text-sm hover:dark:border-linear-border light:border-linear-light-border linear-transition">
                  <Paperclip className="w-4 h-4" />
                  Attach
                </button>
                <button className="flex items-center gap-2 px-3 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear text-sm hover:dark:border-linear-border light:border-linear-light-border linear-transition">
                  <Search className="w-4 h-4" />
                  Search
                </button>
                <button className="flex items-center gap-2 px-3 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear text-sm hover:dark:border-linear-border light:border-linear-light-border linear-transition">
                  <Brain className="w-4 h-4" />
                  Reason
                </button>
              </div>
            </div>
          </div>

          <div className="dark:bg-linear-bg-secondary light:bg-white rounded-linear-lg border dark:border-linear-border-subtle light:border-linear-light-border p-6">
            <h3 className="font-semibold text-lg mb-4">Recent Sync Activity</h3>
            <div className="space-y-3">
              {syncLogs.length === 0 ? (
                <p className="text-sm dark:text-text-tertiary light:text-text-light-tertiary text-center py-4">No sync activity yet</p>
              ) : (
                syncLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 dark:bg-linear-bg light:bg-linear-light-bg rounded-linear"
                  >
                    <div className="flex items-center gap-3">
                      {getSyncStatusIcon(log.status)}
                      <div>
                        <p className="text-sm font-medium">
                          {log.sync_type.charAt(0).toUpperCase() + log.sync_type.slice(1)} Sync
                        </p>
                        <p className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">
                          {log.records_created} created, {log.records_updated} updated
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">
                        {formatDuration(log.duration_ms)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
