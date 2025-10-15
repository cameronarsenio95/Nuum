import { useState } from 'react';
import { Instagram, Music2, ExternalLink, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface SocialMediaConnectProps {
  workspaceId: string;
  onConnect: () => void;
}

interface PlatformConnection {
  platform: 'instagram' | 'tiktok';
  connected: boolean;
  username?: string;
  lastSync?: string;
}

export function SocialMediaConnect({ workspaceId, onConnect }: SocialMediaConnectProps) {
  const { showToast } = useToast();
  const [connections, setConnections] = useState<PlatformConnection[]>([
    { platform: 'instagram', connected: false },
    { platform: 'tiktok', connected: false },
  ]);
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnect = async (platform: 'instagram' | 'tiktok') => {
    setConnecting(platform);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/connect-social-media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          workspaceId,
        }),
      });

      const data = await response.json();

      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else if (data.error) {
        showToast(data.message || 'Platform integration coming soon', 'info');
      }
    } catch (error) {
      console.error('Connection error:', error);
      showToast('Platform integration coming soon', 'info');
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (platform: 'instagram' | 'tiktok') => {
    setConnections(connections.map(conn =>
      conn.platform === platform
        ? { ...conn, connected: false, username: undefined, lastSync: undefined }
        : conn
    ));
    showToast(`Disconnected from ${platform === 'instagram' ? 'Instagram' : 'TikTok'}`, 'success');
  };

  const handleSync = async (platform: 'instagram' | 'tiktok') => {
    showToast(`Syncing ${platform === 'instagram' ? 'Instagram' : 'TikTok'} content...`, 'info');
  };

  const getPlatformIcon = (platform: 'instagram' | 'tiktok') => {
    return platform === 'instagram' ? Instagram : Music2;
  };

  const getPlatformName = (platform: 'instagram' | 'tiktok') => {
    return platform === 'instagram' ? 'Instagram' : 'TikTok';
  };

  const getPlatformColor = (platform: 'instagram' | 'tiktok') => {
    return platform === 'instagram'
      ? 'from-purple-500 to-pink-500'
      : 'from-black to-cyan-500';
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-linear-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-400 mb-1">Social Media Auto-Collection</p>
            <p className="dark:text-text-secondary light:text-text-light-secondary">
              Connect your social media accounts to automatically import UGC content from creators who tag your brand or use your hashtags.
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {connections.map((connection) => {
          const Icon = getPlatformIcon(connection.platform);
          const platformName = getPlatformName(connection.platform);
          const platformColor = getPlatformColor(connection.platform);

          return (
            <div
              key={connection.platform}
              className="dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear-lg p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-linear bg-gradient-to-br ${platformColor} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium">{platformName}</h3>
                    {connection.connected ? (
                      <div className="flex items-center gap-2 text-sm text-green-500">
                        <Check className="w-4 h-4" />
                        Connected
                      </div>
                    ) : (
                      <p className="text-sm dark:text-text-tertiary light:text-text-light-tertiary">Not connected</p>
                    )}
                  </div>
                </div>
              </div>

              {connection.connected ? (
                <div className="space-y-4">
                  <div className="p-3 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-linear text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="dark:text-text-tertiary light:text-text-light-tertiary">Account</span>
                      <span className="font-medium">@{connection.username}</span>
                    </div>
                    {connection.lastSync && (
                      <div className="flex items-center justify-between">
                        <span className="dark:text-text-tertiary light:text-text-light-tertiary">Last sync</span>
                        <span className="font-medium">{new Date(connection.lastSync).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSync(connection.platform)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle hover:dark:bg-linear-bg-hover hover:light:bg-linear-light-bg-hover rounded-linear text-sm linear-transition"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Sync Now
                    </button>
                    <button
                      onClick={() => handleDisconnect(connection.platform)}
                      className="flex-1 px-4 py-2 dark:bg-red-500/10 dark:text-red-500 dark:hover:bg-red-500/20 light:bg-red-100 light:text-red-600 light:hover:bg-red-200 rounded-linear text-sm linear-transition"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <ul className="space-y-2 mb-4 text-sm dark:text-text-secondary light:text-text-light-secondary">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      Auto-import tagged content
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      Track hashtag mentions
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      Monitor creator posts
                    </li>
                  </ul>

                  <button
                    onClick={() => handleConnect(connection.platform)}
                    disabled={connecting === connection.platform}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-linear linear-transition disabled:opacity-50"
                  >
                    {connecting === connection.platform ? (
                      <>Connecting...</>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4" />
                        Connect {platformName}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear-lg">
        <h4 className="font-medium mb-2">Coming Soon</h4>
        <p className="text-sm dark:text-text-secondary light:text-text-light-secondary mb-3">
          More platforms will be added including YouTube, Facebook, and Twitter/X. Contact us if you need a specific platform.
        </p>
        <button className="text-sm dark:text-linear-accent light:text-linear-light-accent hover:underline">
          Request a Platform
        </button>
      </div>
    </div>
  );
}
