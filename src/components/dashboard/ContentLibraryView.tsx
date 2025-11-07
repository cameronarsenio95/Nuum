import { useState, useEffect } from 'react';
import { Upload, X, Play, Download, Eye, TrendingUp, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type Campaign = Database['public']['Tables']['campaigns']['Row'];
type Creator = Database['public']['Tables']['creators']['Row'];

interface ContentMediaItem {
  id: string;
  workspace_id: string;
  creator_id: string | null;
  campaign_id: string | null;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  title: string | null;
  description: string | null;
  platform: 'TikTok' | 'Instagram' | 'Snapchat' | 'YouTube' | 'Other' | null;
  performance_views: number | null;
  performance_revenue: number | null;
  tags: string[] | null;
  created_at: string;
  creators?: { name: string } | null;
  campaigns?: { name: string } | null;
}

interface ContentLibraryViewProps {
  workspace: Workspace;
}

export function ContentLibraryView({ workspace }: ContentLibraryViewProps) {
  const [content, setContent] = useState<ContentMediaItem[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentMediaItem | null>(null);
  const [uploading, setUploading] = useState(false);

  const [filters, setFilters] = useState({
    campaign: 'all',
    creator: 'all',
    platform: 'all',
    sortBy: 'newest'
  });

  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    campaign_id: '',
    creator_id: '',
    platform: '',
    views: 0,
    revenue: 0
  });

  useEffect(() => {
    loadData();
    setupRealtime();
  }, [workspace.id]);

  const setupRealtime = () => {
    const channel = supabase
      .channel('content-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'content_media',
          filter: `workspace_id=eq.${workspace.id}`
        },
        () => {
          loadContent();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadData = async () => {
    await Promise.all([
      loadContent(),
      loadCampaigns(),
      loadCreators()
    ]);
    setLoading(false);
  };

  const loadContent = async () => {
    const { data, error } = await supabase
      .from('content_media')
      .select(`
        *,
        creators(name),
        campaigns(name)
      `)
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading content:', error);
    } else {
      setContent(data || []);
    }
  };

  const loadCampaigns = async () => {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('name');

    if (error) {
      console.error('Error loading campaigns:', error);
    } else {
      setCampaigns(data || []);
    }
  };

  const loadCreators = async () => {
    const { data, error } = await supabase
      .from('creators')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('name');

    if (error) {
      console.error('Error loading creators:', error);
    } else {
      setCreators(data || []);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file) return;

    setUploading(true);

    try {
      const fileExt = uploadForm.file.name.split('.').pop();
      const fileName = `${workspace.id}/${uploadForm.creator_id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('content')
        .upload(fileName, uploadForm.file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('content')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from('content_media')
        .insert({
          workspace_id: workspace.id,
          creator_id: uploadForm.creator_id,
          campaign_id: uploadForm.campaign_id || null,
          file_name: uploadForm.file.name,
          file_type: uploadForm.file.type,
          file_size: uploadForm.file.size,
          file_url: urlData.publicUrl,
          platform: uploadForm.platform as any,
          performance_views: uploadForm.views,
          performance_revenue: uploadForm.revenue,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (insertError) throw insertError;

      setShowUploadModal(false);
      setUploadForm({
        file: null,
        campaign_id: '',
        creator_id: '',
        platform: '',
        views: 0,
        revenue: 0
      });
      loadContent();
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error.message}`);
    }

    setUploading(false);
  };

  const filteredContent = content.filter(item => {
    if (filters.campaign !== 'all' && item.campaign_id !== filters.campaign) return false;
    if (filters.creator !== 'all' && item.creator_id !== filters.creator) return false;
    if (filters.platform !== 'all' && item.platform !== filters.platform) return false;
    return true;
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case 'views':
        return (b.performance_views || 0) - (a.performance_views || 0);
      case 'revenue':
        return (b.performance_revenue || 0) - (a.performance_revenue || 0);
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const getPlatformColor = (platform: string | null) => {
    switch (platform) {
      case 'TikTok':
        return 'bg-[#EE1D52]';
      case 'Instagram':
        return 'bg-[#E1306C]';
      case 'Snapchat':
        return 'bg-[#FFFC00] text-black';
      default:
        return 'bg-gray-500';
    }
  };

  const formatRevenue = (amount: number | null | undefined) => {
    const value = amount ?? 0;
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatViews = (views: number | null | undefined) => {
    const value = views ?? 0;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-linear-accent mx-auto mb-4"></div>
          <p className="dark:text-text-secondary light:text-text-light-secondary">Loading content library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-medium mb-2">Content Library</h2>
          <p className="dark:text-text-secondary light:text-text-light-secondary">
            Manage and analyze creator content across campaigns
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors font-medium"
        >
          <Upload className="w-4 h-4" />
          Add Content
        </button>
      </div>

      <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary" />
          <span className="text-sm font-medium dark:text-text-secondary light:text-text-light-secondary">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm mb-2 dark:text-text-secondary light:text-text-light-secondary">Campaign</label>
            <select
              value={filters.campaign}
              onChange={(e) => setFilters({ ...filters, campaign: e.target.value })}
              className="w-full px-3 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-lg text-sm focus:outline-none focus:border-linear-accent"
            >
              <option value="all">All Campaigns</option>
              {campaigns.map(campaign => (
                <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2 dark:text-text-secondary light:text-text-light-secondary">Creator</label>
            <select
              value={filters.creator}
              onChange={(e) => setFilters({ ...filters, creator: e.target.value })}
              className="w-full px-3 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-lg text-sm focus:outline-none focus:border-linear-accent"
            >
              <option value="all">All Creators</option>
              {creators.map(creator => (
                <option key={creator.id} value={creator.id}>{creator.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2 dark:text-text-secondary light:text-text-light-secondary">Platform</label>
            <select
              value={filters.platform}
              onChange={(e) => setFilters({ ...filters, platform: e.target.value })}
              className="w-full px-3 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-lg text-sm focus:outline-none focus:border-linear-accent"
            >
              <option value="all">All Platforms</option>
              <option value="TikTok">TikTok</option>
              <option value="Instagram">Instagram</option>
              <option value="Snapchat">Snapchat</option>
              <option value="YouTube">YouTube</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2 dark:text-text-secondary light:text-text-light-secondary">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="w-full px-3 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-lg text-sm focus:outline-none focus:border-linear-accent"
            >
              <option value="newest">Newest</option>
              <option value="views">Most Views</option>
              <option value="revenue">Highest Revenue</option>
            </select>
          </div>
        </div>
      </div>

      {filteredContent.length === 0 ? (
        <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-lg p-12 text-center">
          <Upload className="w-16 h-16 dark:text-text-tertiary light:text-text-light-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No content uploaded yet</h3>
          <p className="dark:text-text-secondary light:text-text-light-secondary mb-6">
            Start by adding your first UGC
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors font-medium"
          >
            <Upload className="w-4 h-4" />
            Add Content
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredContent.map(item => (
            <div
              key={item.id}
              className="group dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-lg overflow-hidden hover:shadow-lg hover:shadow-[#2A53D0]/20 transition-all cursor-pointer"
              onClick={() => {
                if (item && item.id) {
                  setSelectedContent(item);
                  setShowDetailModal(true);
                }
              }}
            >
              <div className="relative aspect-video dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle flex items-center justify-center overflow-hidden">
                {item.file_type?.startsWith('image/') ? (
                  <img
                    src={item.file_url}
                    alt={item.title || item.file_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : item.file_type?.startsWith('video/') ? (
                  <>
                    <video
                      src={item.file_url}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                      <Play className="w-12 h-12 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center">
                    <Upload className="w-12 h-12 dark:text-text-tertiary light:text-text-light-tertiary" />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-center">
                    <button className="px-4 py-2 bg-white/90 hover:bg-white text-black rounded-lg text-sm font-medium flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.creators?.name || 'Unknown Creator'}</p>
                    {item.campaigns?.name && (
                      <p className="text-xs dark:text-text-tertiary light:text-text-light-tertiary truncate">
                        {item.campaigns.name}
                      </p>
                    )}
                  </div>
                  {item.platform && (
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${getPlatformColor(item.platform)}`}>
                      {item.platform}
                    </span>
                  )}
                </div>

                {((item.performance_revenue ?? 0) > 0 || (item.performance_views ?? 0) > 0) && (
                  <div className="flex items-center gap-3 text-xs dark:text-text-secondary light:text-text-light-secondary">
                    {(item.performance_revenue ?? 0) > 0 && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {formatRevenue(item.performance_revenue)}
                      </span>
                    )}
                    {(item.performance_views ?? 0) > 0 && (
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {formatViews(item.performance_views)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium">Add Content</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 hover:dark:bg-linear-bg-subtle light:hover:bg-linear-light-bg-subtle rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Upload File</label>
                <input
                  type="file"
                  onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                  accept="image/*,video/*"
                  className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-lg focus:outline-none focus:border-linear-accent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Campaign</label>
                <select
                  value={uploadForm.campaign_id}
                  onChange={(e) => setUploadForm({ ...uploadForm, campaign_id: e.target.value })}
                  className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-lg focus:outline-none focus:border-linear-accent"
                  required
                >
                  <option value="">Select Campaign</option>
                  {campaigns.map(campaign => (
                    <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Creator</label>
                <select
                  value={uploadForm.creator_id}
                  onChange={(e) => setUploadForm({ ...uploadForm, creator_id: e.target.value })}
                  className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-lg focus:outline-none focus:border-linear-accent"
                  required
                >
                  <option value="">Select Creator</option>
                  {creators.map(creator => (
                    <option key={creator.id} value={creator.id}>{creator.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Platform</label>
                <select
                  value={uploadForm.platform}
                  onChange={(e) => setUploadForm({ ...uploadForm, platform: e.target.value })}
                  className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-lg focus:outline-none focus:border-linear-accent"
                  required
                >
                  <option value="">Select Platform</option>
                  <option value="TikTok">TikTok</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Snapchat">Snapchat</option>
                  <option value="YouTube">YouTube</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Views</label>
                  <input
                    type="number"
                    value={uploadForm.views}
                    onChange={(e) => setUploadForm({ ...uploadForm, views: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-lg focus:outline-none focus:border-linear-accent"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Revenue (€)</label>
                  <input
                    type="number"
                    value={uploadForm.revenue}
                    onChange={(e) => setUploadForm({ ...uploadForm, revenue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-lg focus:outline-none focus:border-linear-accent"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle hover:dark:bg-linear-border-subtle light:hover:bg-linear-light-border-subtle rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && selectedContent && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setShowDetailModal(false)}>
          <div
            className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle p-5 flex items-center justify-between z-10">
              <h3 className="text-xl font-medium">Content Details</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1 hover:dark:bg-linear-bg-subtle light:hover:bg-linear-light-bg-subtle rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              <div className="aspect-video dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-lg overflow-hidden mb-5">
                {selectedContent.file_type?.startsWith('image/') ? (
                  <img
                    src={selectedContent.file_url}
                    alt={selectedContent.title || selectedContent.file_name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div class="flex items-center justify-center h-full"><p class="dark:text-text-tertiary light:text-text-light-tertiary">Image preview unavailable</p></div>';
                      }
                    }}
                  />
                ) : selectedContent.file_type?.startsWith('video/') ? (
                  <video
                    src={selectedContent.file_url}
                    controls
                    className="w-full h-full"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div class="flex items-center justify-center h-full"><p class="dark:text-text-tertiary light:text-text-light-tertiary">Video preview unavailable</p></div>';
                      }
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="dark:text-text-tertiary light:text-text-light-tertiary">File preview unavailable</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-lg font-medium mb-1">{selectedContent.creators?.name || 'Unknown Creator'}</h4>
                    {selectedContent.platform && (
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getPlatformColor(selectedContent.platform)}`}>
                        {selectedContent.platform}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => window.open(selectedContent.file_url, '_blank')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>

                {selectedContent.campaigns?.name && (
                  <div>
                    <p className="text-sm dark:text-text-tertiary light:text-text-light-tertiary mb-1">Campaign</p>
                    <p className="font-medium">{selectedContent.campaigns.name}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-lg p-4">
                    <p className="text-sm dark:text-text-tertiary light:text-text-light-tertiary mb-1">Views</p>
                    <p className="text-2xl font-semibold">{formatViews(selectedContent.performance_views)}</p>
                  </div>
                  <div className="dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-lg p-4">
                    <p className="text-sm dark:text-text-tertiary light:text-text-light-tertiary mb-1">Revenue</p>
                    <p className="text-2xl font-semibold">{formatRevenue(selectedContent.performance_revenue)}</p>
                  </div>
                </div>

                {(selectedContent.performance_revenue ?? 0) > 0 && (selectedContent.performance_views ?? 0) > 0 && (
                  <div className="dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-lg p-4">
                    <p className="text-sm dark:text-text-tertiary light:text-text-light-tertiary mb-1">ROI per 1K Views</p>
                    <p className="text-xl font-semibold">
                      {formatRevenue(((selectedContent.performance_revenue ?? 0) / (selectedContent.performance_views ?? 1)) * 1000)}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm dark:text-text-tertiary light:text-text-light-tertiary mb-1">Uploaded</p>
                  <p>{new Date(selectedContent.created_at).toLocaleDateString('nl-NL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
