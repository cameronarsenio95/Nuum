import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Link2, RefreshCw, CheckCircle, XCircle, AlertCircle, Facebook, Music, Ghost } from 'lucide-react';
import type { Database } from '../../lib/database.types';
import type { LucideIcon } from 'lucide-react';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type PlatformIntegration = Database['public']['Tables']['platform_integrations']['Row'];

interface Props {
  workspace: Workspace;
}

interface Platform {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

const PLATFORMS: Platform[] = [
  {
    id: 'meta',
    name: 'META (Facebook & Instagram)',
    description: 'Connect your META Business account to sync ad campaigns and performance data',
    icon: Facebook,
    color: 'blue',
  },
  {
    id: 'tiktok',
    name: 'TikTok Ads',
    description: 'Sync TikTok ad campaigns and creator performance metrics',
    icon: Music,
    color: 'pink',
  },
  {
    id: 'snapchat',
    name: 'Snapchat Ads',
    description: 'Import Snapchat ad data and track campaign performance',
    icon: Ghost,
    color: 'yellow',
  },
];

export function PlatformIntegrationsView({ workspace }: Props) {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<Record<string, PlatformIntegration>>({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    loadIntegrations();
  }, [workspace.id]);

  const loadIntegrations = async () => {
    const { data, error } = await supabase
      .from('platform_integrations')
      .select('*')
      .eq('workspace_id', workspace.id);

    if (error) {
      console.error('Error loading integrations:', error);
    } else if (data) {
      const integrationsMap = data.reduce((acc, integration) => {
        acc[integration.platform] = integration;
        return acc;
      }, {} as Record<string, PlatformIntegration>);
      setIntegrations(integrationsMap);
    }

    setLoading(false);
  };

  const handleConnect = async (platformId: string) => {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    const redirectUri = `${window.location.origin}/dashboard`;

    let oauthUrl = '';
    if (platformId === 'meta') {
      oauthUrl = `${baseUrl}/functions/v1/meta-oauth-start?workspace_id=${workspace.id}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    } else {
      oauthUrl = `${baseUrl}/functions/v1/platform-oauth-callback?platform=${platformId}&workspace_id=${workspace.id}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    }

    window.location.href = oauthUrl;
  };

  const handleSync = async (platformId: string) => {
    setSyncing(platformId);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-platform-ads`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workspace_id: workspace.id,
            platform: platformId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      await loadIntegrations();
    } catch (error) {
      console.error('Error syncing:', error);
    } finally {
      setSyncing(null);
    }
  };

  const getStatusBadge = (integration?: PlatformIntegration) => {
    if (!integration) {
      return (
        <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-gray-500/5 text-gray-500">
          <XCircle className="w-3 h-3" />
          Not Connected
        </span>
      );
    }

    if (integration.status === 'error') {
      return (
        <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">
          <AlertCircle className="w-3 h-3" />
          Error
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
        <CheckCircle className="w-3 h-3" />
        Connected
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="dark:text-text-secondary light:text-text-light-secondary">Loading integrations...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold dark:text-text-primary light:text-text-light-primary mb-1">
          Platform Integrations
        </h1>
        <p className="text-sm text-gray-400">
          Connect your advertising platforms to automatically sync campaign data and performance metrics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {PLATFORMS.map((platform) => {
          const integration = integrations[platform.id];
          const isConnected = integration?.status === 'active';
          const PlatformIcon = platform.icon;

          return (
            <div
              key={platform.id}
              className="bg-[#1a1a1a] rounded-lg p-6 flex flex-col hover:bg-[#1f1f1f] linear-transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                    <PlatformIcon className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-[15px] dark:text-text-primary light:text-text-light-primary leading-tight">
                      {platform.name}
                    </h3>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {getStatusBadge(integration)}
                </div>
              </div>

              <p className="text-[13px] text-gray-400 mb-4 flex-grow leading-relaxed">
                {platform.description}
              </p>

              {integration?.last_sync_at && (
                <p className="text-[11px] text-gray-500 mb-3">
                  Last synced: {new Date(integration.last_sync_at).toLocaleString()}
                </p>
              )}

              {integration?.error_message && (
                <div className="mb-3 p-2.5 rounded-lg bg-red-500/5">
                  <p className="text-[11px] text-red-400">{integration.error_message}</p>
                </div>
              )}

              <div className="flex gap-2">
                {!isConnected ? (
                  <button
                    onClick={() => handleConnect(platform.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-linear-accent text-[#0a0a0a] text-sm font-medium hover:bg-linear-accent/90 linear-transition"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    Connect
                  </button>
                ) : (
                  <button
                    onClick={() => handleSync(platform.id)}
                    disabled={syncing === platform.id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-800 text-gray-300 text-sm hover:bg-[#252525] linear-transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncing === platform.id ? 'animate-spin' : ''}`} />
                    {syncing === platform.id ? 'Syncing...' : 'Sync Now'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-5 bg-[#1a1a1a] rounded-lg">
        <h3 className="font-medium text-[15px] dark:text-text-primary light:text-text-light-primary mb-3">
          How it works
        </h3>
        <ul className="space-y-2 text-[13px] text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-linear-accent font-medium">1.</span>
            Click "Connect" to authorize NUUM to access your advertising platform
          </li>
          <li className="flex items-start gap-2">
            <span className="text-linear-accent font-medium">2.</span>
            We'll securely store your access credentials and sync your campaign data
          </li>
          <li className="flex items-start gap-2">
            <span className="text-linear-accent font-medium">3.</span>
            Use "Sync Now" to manually refresh data or wait for automatic syncs every hour
          </li>
          <li className="flex items-start gap-2">
            <span className="text-linear-accent font-medium">4.</span>
            View synced campaigns in the Ad Sets section with real-time performance metrics
          </li>
        </ul>
      </div>
    </div>
  );
}
