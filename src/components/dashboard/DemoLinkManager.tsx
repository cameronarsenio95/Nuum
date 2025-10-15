import { useState, useEffect } from 'react';
import { Link, Copy, Eye, Trash2, Plus, ExternalLink, Calendar, Users, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import type { Database } from '../../lib/database.types';

type Workspace = Database['public']['Tables']['workspaces']['Row'];

interface DemoLink {
  id: string;
  token: string;
  name: string;
  expires_at: string | null;
  max_views: number | null;
  view_count: number;
  is_active: boolean;
  created_at: string;
  last_accessed_at: string | null;
}

interface DemoWorkspace {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

interface DemoLinkManagerProps {
  workspace: Workspace;
}

export function DemoLinkManager({ workspace }: DemoLinkManagerProps) {
  const { showToast } = useToast();
  const [demoWorkspace, setDemoWorkspace] = useState<DemoWorkspace | null>(null);
  const [demoLinks, setDemoLinks] = useState<DemoLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLinkName, setNewLinkName] = useState('');
  const [expiresInDays, setExpiresInDays] = useState<number | ''>('');
  const [maxViews, setMaxViews] = useState<number | ''>('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    loadDemoWorkspace();
  }, [workspace.id]);

  const loadDemoWorkspace = async () => {
    setLoading(true);
    try {
      const { data: demoWs, error: wsError } = await supabase
        .from('demo_workspaces')
        .select('*')
        .eq('workspace_id', workspace.id)
        .eq('is_active', true)
        .maybeSingle();

      if (wsError) throw wsError;

      if (demoWs) {
        setDemoWorkspace(demoWs);
        await loadDemoLinks(demoWs.id);
      }
    } catch (error) {
      console.error('Error loading demo workspace:', error);
      showToast('Failed to load demo workspace', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadDemoLinks = async (demoWorkspaceId: string) => {
    try {
      const { data: links, error: linksError } = await supabase
        .from('demo_links')
        .select('*')
        .eq('demo_workspace_id', demoWorkspaceId)
        .order('created_at', { ascending: false });

      if (linksError) throw linksError;
      setDemoLinks(links || []);
    } catch (error) {
      console.error('Error loading demo links:', error);
      showToast('Failed to load demo links', 'error');
    }
  };

  const createDemoWorkspace = async () => {
    setCreating(true);
    try {
      const { data: newDemoWorkspaceId, error } = await supabase
        .rpc('create_demo_workspace_from_template', {
          source_workspace_id: workspace.id,
          demo_name: 'NUUM Platform Demo',
          demo_description: 'Experience the full power of NUUM with real campaign data, creator management, and analytics'
        });

      if (error) throw error;

      showToast('Demo workspace created successfully!', 'success');
      await loadDemoWorkspace();
    } catch (error: any) {
      console.error('Error creating demo workspace:', error);
      showToast(error.message || 'Failed to create demo workspace', 'error');
    } finally {
      setCreating(false);
    }
  };

  const createDemoLink = async () => {
    if (!demoWorkspace || !newLinkName.trim()) {
      showToast('Please enter a name for the demo link', 'error');
      return;
    }

    setCreating(true);
    try {
      const expiresAt = expiresInDays
        ? new Date(Date.now() + Number(expiresInDays) * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { data: newLink, error } = await supabase
        .from('demo_links')
        .insert({
          demo_workspace_id: demoWorkspace.id,
          name: newLinkName.trim(),
          expires_at: expiresAt,
          max_views: maxViews || null,
          created_by: workspace.owner_id,
        })
        .select()
        .single();

      if (error) throw error;

      showToast('Demo link created successfully!', 'success');
      setDemoLinks([newLink, ...demoLinks]);
      setShowCreateForm(false);
      setNewLinkName('');
      setExpiresInDays('');
      setMaxViews('');
    } catch (error: any) {
      console.error('Error creating demo link:', error);
      showToast(error.message || 'Failed to create demo link', 'error');
    } finally {
      setCreating(false);
    }
  };

  const copyDemoLink = (token: string) => {
    const demoUrl = `${window.location.origin}?demo=${token}`;
    navigator.clipboard.writeText(demoUrl);
    setCopiedToken(token);
    showToast('Demo link copied to clipboard!', 'success');
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const toggleLinkStatus = async (linkId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('demo_links')
        .update({ is_active: !currentStatus })
        .eq('id', linkId);

      if (error) throw error;

      setDemoLinks(demoLinks.map(link =>
        link.id === linkId ? { ...link, is_active: !currentStatus } : link
      ));
      showToast(`Demo link ${!currentStatus ? 'activated' : 'deactivated'}`, 'success');
    } catch (error) {
      console.error('Error toggling link status:', error);
      showToast('Failed to update link status', 'error');
    }
  };

  const deleteLink = async (linkId: string) => {
    if (!confirm('Are you sure you want to delete this demo link?')) return;

    try {
      const { error } = await supabase
        .from('demo_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

      setDemoLinks(demoLinks.filter(link => link.id !== linkId));
      showToast('Demo link deleted', 'success');
    } catch (error) {
      console.error('Error deleting link:', error);
      showToast('Failed to delete link', 'error');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const isMaxViewsReached = (maxViews: number | null, viewCount: number) => {
    if (!maxViews) return false;
    return viewCount >= maxViews;
  };

  if (loading) {
    return (
      <div className="dark:bg-linear-bg-secondary light:bg-white rounded-linear-lg border dark:border-linear-border light:border-gray-200 p-8">
        <div className="text-center dark:text-text-secondary light:text-text-light-secondary">
          Loading demo links...
        </div>
      </div>
    );
  }

  if (!demoWorkspace) {
    return (
      <div className="dark:bg-linear-bg-secondary light:bg-white rounded-linear-lg border dark:border-linear-border light:border-gray-200 p-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full dark:bg-linear-bg-hover light:bg-gray-100">
            <ExternalLink className="w-8 h-8 dark:text-text-secondary light:text-text-light-secondary" />
          </div>
          <h3 className="text-xl font-semibold dark:text-text-primary light:text-text-light-primary">
            Create Demo Workspace
          </h3>
          <p className="dark:text-text-secondary light:text-text-light-secondary max-w-md mx-auto">
            Create a shareable demo workspace with sample data to showcase your NUUM setup to clients, investors, or team members.
          </p>
          <button
            onClick={createDemoWorkspace}
            disabled={creating}
            className="inline-flex items-center gap-2 px-6 py-3 bg-linear-accent text-text-primary rounded-linear-md hover:bg-linear-accent-hover linear-transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
            {creating ? 'Creating...' : 'Create Demo Workspace'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="dark:bg-linear-bg-secondary light:bg-white rounded-linear-lg border dark:border-linear-border light:border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Link className="w-6 h-6 dark:text-linear-accent light:text-blue-600" />
              <h3 className="text-xl font-semibold dark:text-text-primary light:text-text-light-primary">
                Demo Links
              </h3>
            </div>
            <p className="dark:text-text-secondary light:text-text-light-secondary">
              Create shareable links to give external viewers access to your demo workspace
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-linear-accent text-text-primary rounded-linear-md hover:bg-linear-accent-hover linear-transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Link
          </button>
        </div>

        {showCreateForm && (
          <div className="mb-6 p-4 dark:bg-linear-bg-hover light:bg-gray-50 rounded-linear-lg border dark:border-linear-border light:border-gray-200">
            <h4 className="text-sm font-semibold dark:text-text-primary light:text-text-light-primary mb-4">
              Create New Demo Link
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium dark:text-text-secondary light:text-text-light-secondary mb-2">
                  Link Name
                </label>
                <input
                  type="text"
                  value={newLinkName}
                  onChange={(e) => setNewLinkName(e.target.value)}
                  placeholder="e.g., Client Presentation, Investor Demo"
                  className="w-full px-4 py-2 dark:bg-linear-bg dark:border-linear-border dark:text-text-primary light:bg-white light:border-gray-300 light:text-text-light-primary border rounded-linear-md focus:outline-none focus:ring-2 focus:ring-linear-accent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium dark:text-text-secondary light:text-text-light-secondary mb-2">
                    Expires In (Days)
                  </label>
                  <input
                    type="number"
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="Optional"
                    min="1"
                    className="w-full px-4 py-2 dark:bg-linear-bg dark:border-linear-border dark:text-text-primary light:bg-white light:border-gray-300 light:text-text-light-primary border rounded-linear-md focus:outline-none focus:ring-2 focus:ring-linear-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-text-secondary light:text-text-light-secondary mb-2">
                    Max Views
                  </label>
                  <input
                    type="number"
                    value={maxViews}
                    onChange={(e) => setMaxViews(e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="Optional"
                    min="1"
                    className="w-full px-4 py-2 dark:bg-linear-bg dark:border-linear-border dark:text-text-primary light:bg-white light:border-gray-300 light:text-text-light-primary border rounded-linear-md focus:outline-none focus:ring-2 focus:ring-linear-accent"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={createDemoLink}
                  disabled={creating || !newLinkName.trim()}
                  className="px-4 py-2 bg-linear-accent text-text-primary rounded-linear-md hover:bg-linear-accent-hover linear-transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create Link'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewLinkName('');
                    setExpiresInDays('');
                    setMaxViews('');
                  }}
                  className="px-4 py-2 dark:bg-linear-bg-hover light:bg-gray-200 dark:text-text-secondary light:text-text-light-secondary rounded-linear-md hover:bg-linear-bg-active linear-transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {demoLinks.length === 0 ? (
          <div className="text-center py-12 dark:text-text-secondary light:text-text-light-secondary">
            No demo links created yet. Click "New Link" to create one.
          </div>
        ) : (
          <div className="space-y-3">
            {demoLinks.map((link) => {
              const expired = isExpired(link.expires_at);
              const maxed = isMaxViewsReached(link.max_views, link.view_count);
              const isInactive = !link.is_active || expired || maxed;

              return (
                <div
                  key={link.id}
                  className={`p-4 rounded-linear-lg border ${
                    isInactive
                      ? 'dark:bg-linear-bg dark:border-linear-border/50 light:bg-gray-50 light:border-gray-300 opacity-60'
                      : 'dark:bg-linear-bg-hover dark:border-linear-border light:bg-white light:border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold dark:text-text-primary light:text-text-light-primary">
                          {link.name}
                        </h4>
                        {isInactive && (
                          <span className="px-2 py-0.5 text-xs rounded-full dark:bg-red-500/20 dark:text-red-400 light:bg-red-100 light:text-red-700">
                            {expired ? 'Expired' : maxed ? 'Max Views' : 'Inactive'}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm dark:text-text-secondary light:text-text-light-secondary mb-3">
                        <div className="flex items-center gap-1.5">
                          <Eye className="w-4 h-4" />
                          <span>
                            {link.view_count}
                            {link.max_views && ` / ${link.max_views}`} views
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {link.expires_at ? `Expires ${formatDate(link.expires_at)}` : 'No expiration'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs dark:text-text-tertiary light:text-text-light-tertiary">
                        <code className="px-2 py-1 dark:bg-linear-bg light:bg-gray-100 rounded truncate max-w-xs">
                          {`${window.location.origin}?demo=${link.token}`}
                        </code>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyDemoLink(link.token)}
                        className="p-2 dark:hover:bg-linear-bg light:hover:bg-gray-100 rounded-linear-md linear-transition"
                        title="Copy link"
                      >
                        {copiedToken === link.token ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <Copy className="w-5 h-5 dark:text-text-secondary light:text-text-light-secondary" />
                        )}
                      </button>
                      <button
                        onClick={() => toggleLinkStatus(link.id, link.is_active)}
                        className={`px-3 py-1 rounded-linear-md text-sm linear-transition ${
                          link.is_active
                            ? 'dark:bg-green-500/20 dark:text-green-400 light:bg-green-100 light:text-green-700'
                            : 'dark:bg-gray-500/20 dark:text-gray-400 light:bg-gray-200 light:text-gray-700'
                        }`}
                      >
                        {link.is_active ? 'Active' : 'Inactive'}
                      </button>
                      <button
                        onClick={() => deleteLink(link.id)}
                        className="p-2 dark:hover:bg-red-500/20 dark:text-red-400 light:hover:bg-red-100 light:text-red-600 rounded-linear-md linear-transition"
                        title="Delete link"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
