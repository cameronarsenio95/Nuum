import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ShoppingBag, RefreshCw, CheckCircle, XCircle, AlertCircle, Link2, ExternalLink, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type Workspace = Database['public']['Tables']['workspaces']['Row'];

interface Props {
  workspace: Workspace;
}

interface ShopifyIntegration {
  id: string;
  platform: string;
  status: string;
  store_url: string | null;
  last_sync_at: string | null;
  error_message: string | null;
  created_at: string;
}

interface ShopifyStats {
  totalOrders: number;
  totalRevenue: number;
  totalConversions: number;
  avgOrderValue: number;
}

export function ShopifyIntegrationView({ workspace }: Props) {
  const { user } = useAuth();
  const [integration, setIntegration] = useState<ShopifyIntegration | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState<ShopifyStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalConversions: 0,
    avgOrderValue: 0,
  });

  useEffect(() => {
    loadIntegration();
    loadStats();
  }, [workspace.id]);

  const loadIntegration = async () => {
    const { data, error } = await supabase
      .from('platform_integrations')
      .select('*')
      .eq('workspace_id', workspace.id)
      .eq('platform', 'shopify')
      .maybeSingle();

    if (error) {
      console.error('Error loading Shopify integration:', error);
    } else {
      setIntegration(data);
    }

    setLoading(false);
  };

  const loadStats = async () => {
    const { data: orders } = await supabase
      .from('shopify_orders')
      .select('total_price')
      .eq('workspace_id', workspace.id);

    const { data: conversions } = await supabase
      .from('conversion_events')
      .select('conversion_value')
      .eq('workspace_id', workspace.id);

    if (orders) {
      const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_price), 0);
      const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

      setStats({
        totalOrders: orders.length,
        totalRevenue,
        totalConversions: conversions?.length || 0,
        avgOrderValue,
      });
    }
  };

  const handleConnect = async () => {
    const shopDomain = prompt('Enter your Shopify store URL (e.g., mystore.myshopify.com):');

    if (!shopDomain) return;

    const cleanDomain = shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');

    const clientId = import.meta.env.VITE_SHOPIFY_CLIENT_ID || 'd22a8ccbfd2c3ff8cdc76bc0c603aa7d';
    const scopes = 'read_orders,read_products,read_customers,read_price_rules,read_analytics';
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    const redirectUri = `${baseUrl}/functions/v1/shopify-oauth-callback`;

    const state = btoa(JSON.stringify({
      workspace_id: workspace.id,
      user_id: user?.id
    }));

    const authUrl = `https://${cleanDomain}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

    window.location.href = authUrl;
  };

  const handleDisconnect = async () => {
    if (!integration) return;

    if (!confirm('Are you sure you want to disconnect Shopify? This will stop order syncing.')) {
      return;
    }

    const { error } = await supabase
      .from('platform_integrations')
      .delete()
      .eq('id', integration.id);

    if (error) {
      console.error('Error disconnecting:', error);
    } else {
      setIntegration(null);
      setStats({
        totalOrders: 0,
        totalRevenue: 0,
        totalConversions: 0,
        avgOrderValue: 0,
      });
    }
  };

  const handleSync = async () => {
    setSyncing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shopify-sync-data`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workspace_id: workspace.id,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      await loadIntegration();
      await loadStats();
    } catch (error) {
      console.error('Error syncing:', error);
    } finally {
      setSyncing(false);
    }
  };

  const getStatusBadge = () => {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="dark:text-text-secondary light:text-text-light-secondary">Loading Shopify integration...</div>
      </div>
    );
  }

  const isConnected = integration?.status === 'active';

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold dark:text-text-primary light:text-text-light-primary mb-1">
          Shopify Integration
        </h1>
        <p className="text-sm text-gray-400">
          Connect your Shopify store to track orders, revenue, and conversions from your creator campaigns
        </p>
      </div>

      <div className="grid gap-6">
        <div className="bg-[#1a1a1a] rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-[#252525] rounded-lg">
                <ShoppingBag className="w-6 h-6 text-gray-300" />
              </div>
              <div className="min-w-0">
                <h3 className="font-medium text-[15px] dark:text-text-primary light:text-text-light-primary leading-tight mb-1">
                  Shopify Store
                </h3>
                {integration?.store_url && (
                  <a
                    href={`https://${integration.store_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] text-gray-400 hover:text-gray-300 flex items-center gap-1 linear-transition"
                  >
                    {integration.store_url}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
            <div className="flex-shrink-0">
              {getStatusBadge()}
            </div>
          </div>

          {integration?.last_sync_at && (
            <p className="text-[11px] text-gray-500 mb-4">
              Last synced: {new Date(integration.last_sync_at).toLocaleString()}
            </p>
          )}

          {integration?.error_message && (
            <div className="mb-4 p-2.5 rounded-lg bg-red-500/5">
              <p className="text-[11px] text-red-400">{integration.error_message}</p>
            </div>
          )}

          <div className="flex gap-2">
            {!isConnected ? (
              <button
                onClick={handleConnect}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-linear-accent text-[#0a0a0a] text-sm font-medium hover:bg-linear-accent/90 linear-transition"
              >
                <Link2 className="w-3.5 h-3.5" />
                Connect Shopify
              </button>
            ) : (
              <>
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-800 text-gray-300 text-sm hover:bg-[#252525] linear-transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </button>
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2 rounded-lg border border-red-500/20 text-red-400 text-sm hover:bg-red-500/5 linear-transition"
                >
                  Disconnect
                </button>
              </>
            )}
          </div>
        </div>

        {isConnected && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#1a1a1a] rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Total Orders</div>
                <div className="w-7 h-7 bg-[#252525] rounded flex items-center justify-center">
                  <ShoppingCart className="w-3.5 h-3.5 text-gray-400" />
                </div>
              </div>
              <div className="text-2xl font-medium text-gray-200 mb-1">{stats.totalOrders.toLocaleString()}</div>
              <div className="text-[11px] text-gray-500">Synced from Shopify</div>
            </div>

            <div className="bg-[#1a1a1a] rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Total Revenue</div>
                <div className="w-7 h-7 bg-[#252525] rounded flex items-center justify-center">
                  <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                </div>
              </div>
              <div className="text-2xl font-medium text-gray-200 mb-1">{formatCurrency(stats.totalRevenue)}</div>
              <div className="text-[11px] text-gray-500">From all orders</div>
            </div>

            <div className="bg-[#1a1a1a] rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Conversions</div>
                <div className="w-7 h-7 bg-[#252525] rounded flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
                </div>
              </div>
              <div className="text-2xl font-medium text-gray-200 mb-1">{stats.totalConversions.toLocaleString()}</div>
              <div className="text-[11px] text-gray-500">Attributed to campaigns</div>
            </div>

            <div className="bg-[#1a1a1a] rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Avg Order Value</div>
                <div className="w-7 h-7 bg-[#252525] rounded flex items-center justify-center">
                  <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                </div>
              </div>
              <div className="text-2xl font-medium text-gray-200 mb-1">{formatCurrency(stats.avgOrderValue)}</div>
              <div className="text-[11px] text-gray-500">Per order</div>
            </div>
          </div>
        )}

        <div className="bg-[#1a1a1a] rounded-lg p-6">
          <h3 className="font-medium text-[15px] dark:text-text-primary light:text-text-light-primary mb-4">
            How Shopify Integration Works
          </h3>
          <ul className="space-y-3 text-[13px] text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-linear-accent font-medium">1.</span>
              <span>Click "Connect Shopify" to authorize NUUM to access your Shopify store data</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-linear-accent font-medium">2.</span>
              <span>We securely sync your orders, products, and revenue data every 6 hours</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-linear-accent font-medium">3.</span>
              <span>Orders are automatically attributed to campaigns using discount codes and UTM parameters</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-linear-accent font-medium">4.</span>
              <span>View attributed revenue in your campaign analytics and creator performance reports</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-linear-accent font-medium">5.</span>
              <span>Use "Sync Now" to manually refresh data or wait for automatic syncs</span>
            </li>
          </ul>
        </div>

        <div className="bg-[#1a1a1a] rounded-lg p-6">
          <h3 className="font-medium text-[15px] dark:text-text-primary light:text-text-light-primary mb-4">
            Attribution Methods
          </h3>
          <div className="space-y-3 text-[13px] text-gray-400">
            <div>
              <div className="font-medium text-gray-300 mb-1">Discount Codes (Highest Accuracy)</div>
              <p>Assign unique discount codes to each creator in their profile. When customers use these codes, orders are automatically attributed.</p>
            </div>
            <div>
              <div className="font-medium text-gray-300 mb-1">UTM Campaign Parameters</div>
              <p>Track which campaign generated the sale using UTM parameters in your creator links.</p>
            </div>
            <div>
              <div className="font-medium text-gray-300 mb-1">Referrer URLs</div>
              <p>Orders can be attributed based on the referring website or social media platform.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
