import { useState, useEffect } from 'react';
import { Upload, X, Play, Download, Eye, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type Creator = Database['public']['Tables']['creators']['Row'];
type Campaign = Database['public']['Tables']['campaigns']['Row'];
type AdSet = Database['public']['Tables']['ad_sets']['Row'];

interface ContentMediaItem {
  id: string;
  workspace_id: string;
  creator_id: string;
  campaign_id: string | null;
  ad_set_id: string | null;
  platform: 'Instagram' | 'TikTok' | 'Snapchat' | 'YouTube' | null;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  title: string | null;
  description: string | null;
  tags: string[] | null;
  created_at: string;
  creators?: { name: string } | null;
  campaigns?: { id: string; name: string } | null;
  ad_sets?: { id: string; name: string } | null;
}

interface ContentLibraryViewProps {
  workspace: Workspace;
}

export function ContentLibraryView({ workspace }: ContentLibraryViewProps) {
  const [content, setContent] = useState<ContentMediaItem[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentMediaItem | null>(null);
  const [uploading, setUploading] = useState(false);

  const [filters, setFilters] = useState({
    creator: 'all',
    sortBy: 'newest'
  });

  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    creator_id: '',
    campaign_id: '',
    platform: '' as 'Instagram' | 'TikTok' | 'Snapchat' | 'YouTube' | ''
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
      loadCreators(),
      loadCampaigns()
    ]);
    setLoading(false);
  };

  const loadContent = async () => {
    const { data: contentData, error } = await supabase
      .from('content_media')
      .select(`
        *,
        creators(name),
        campaigns(id, name)
      `)
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading content:', error);
      setContent([]);
      return;
    }

    if (!contentData || contentData.length === 0) {
      setContent([]);
      return;
    }

    const adSetIds = contentData
      .map(item => item.ad_set_id)
      .filter((id): id is string => id !== null);

    let adSetsMap = new Map<string, { id: string; name: string }>();

    if (adSetIds.length > 0) {
      const { data: adSetsData } = await supabase
        .from('ad_sets')
        .select('id, name')
        .in('id', adSetIds);

      if (adSetsData) {
        adSetsData.forEach(adSet => {
          adSetsMap.set(adSet.id, adSet);
        });
      }
    }

    const enrichedContent = contentData.map(item => ({
      ...item,
      ad_sets: item.ad_set_id ? adSetsMap.get(item.ad_set_id) || null : null
    }));

    setContent(enrichedContent);
  };

  const loadCreators = async () => {
    const { data, error } = await supabase
      .from('creators')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('name');

    if (error) {
      console.error('[ContentLibrary] Error loading creators:', error);
    } else {
      console.log('[ContentLibrary] Loaded creators from Supabase:', {
        workspace_id: workspace.id,
        count: data?.length || 0,
        creators: data?.map(c => ({ id: c.id, name: c.name }))
      });
      setCreators(data || []);
    }
  };

  const loadCampaigns = async () => {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('name');

    if (error) {
      console.error('[ContentLibrary] Error loading campaigns:', error);
    } else {
      console.log('[ContentLibrary] Loaded campaigns from Supabase:', {
        workspace_id: workspace.id,
        count: data?.length || 0,
        campaigns: data?.map(c => ({ id: c.id, name: c.name }))
      });
      setCampaigns(data || []);
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
          platform: uploadForm.platform || null,
          file_name: uploadForm.file.name,
          file_type: uploadForm.file.type,
          file_size: uploadForm.file.size,
          file_url: urlData.publicUrl,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (insertError) throw insertError;

      setShowUploadModal(false);
      setUploadForm({
        file: null,
        creator_id: '',
        campaign_id: '',
        platform: ''
      });
      loadContent();
    } catch (error: any) {
      console.error('Upload error:', error);
      alert('Failed to upload content. Please try again.');
    }

    setUploading(false);
  };

  const filteredContent = content.filter(item => {
    if (filters.creator !== 'all' && item.creator_id !== filters.creator) return false;
    return true;
  }).sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.creators?.name || 'Unknown Creator'}</p>
                    <p className="text-xs dark:text-text-tertiary light:text-text-light-tertiary truncate">
                      {new Date(item.created_at).toLocaleDateString('nl-NL')}
                    </p>
                  </div>

                  {(item.campaigns?.name || item.platform || item.ad_sets?.name) && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {item.campaigns?.name && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle dark:text-text-secondary light:text-text-light-secondary">
                          {item.campaigns.name}
                        </span>
                      )}
                      {item.platform && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium dark:bg-blue-500/10 light:bg-blue-500/10 dark:text-blue-400 light:text-blue-600">
                          {item.platform}
                        </span>
                      )}
                      {item.ad_sets?.name && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium dark:bg-green-500/10 light:bg-green-500/10 dark:text-green-400 light:text-green-600">
                          🔗 {item.ad_sets.name}
                        </span>
                      )}
                    </div>
                  )}
                </div>
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
                <label className="block text-sm font-medium mb-2">Campaign (Optional)</label>
                <select
                  value={uploadForm.campaign_id}
                  onChange={(e) => setUploadForm({ ...uploadForm, campaign_id: e.target.value })}
                  className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-lg focus:outline-none focus:border-linear-accent"
                >
                  <option value="">Select Campaign (Optional)</option>
                  {campaigns.map(campaign => (
                    <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
                  ))}
                </select>
              </div>

              <div className="dark:bg-blue-500/10 light:bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm dark:text-blue-400 light:text-blue-600">
                  <strong>💡 Tip:</strong> To link content to an Ad Set, upload it here first. Then go to your Campaign detail page → Ad Sets (Meta) section → click "Link Content" on the relevant ad set.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Platform (Optional)</label>
                <select
                  value={uploadForm.platform}
                  onChange={(e) => setUploadForm({ ...uploadForm, platform: e.target.value as any })}
                  className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-lg focus:outline-none focus:border-linear-accent"
                >
                  <option value="">Select Platform (Optional)</option>
                  <option value="Instagram">Instagram</option>
                  <option value="TikTok">TikTok</option>
                  <option value="Snapchat">Snapchat</option>
                  <option value="YouTube">YouTube</option>
                </select>
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
                    {(selectedContent.campaigns?.name || selectedContent.platform) && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedContent.campaigns?.name && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle dark:text-text-secondary light:text-text-light-secondary">
                            {selectedContent.campaigns.name}
                          </span>
                        )}
                        {selectedContent.platform && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium dark:bg-blue-500/10 light:bg-blue-500/10 dark:text-blue-400 light:text-blue-600">
                            {selectedContent.platform}
                          </span>
                        )}
                      </div>
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-lg p-4">
                    <p className="text-xs uppercase dark:text-text-tertiary light:text-text-light-tertiary mb-2 opacity-70">Campaign</p>
                    <p className="text-base font-medium">{selectedContent.campaigns?.name || '—'}</p>
                  </div>
                  <div className="dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-lg p-4">
                    <p className="text-xs uppercase dark:text-text-tertiary light:text-text-light-tertiary mb-2 opacity-70">Platform</p>
                    <p className="text-base font-medium">{selectedContent.platform || '—'}</p>
                  </div>
                </div>

                {selectedContent.ad_sets?.name && (
                  <div className="dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-lg p-4">
                    <p className="text-xs uppercase dark:text-text-tertiary light:text-text-light-tertiary mb-2 opacity-70">Linked Ad Set</p>
                    <p className="text-base font-medium">{selectedContent.ad_sets.name}</p>
                  </div>
                )}

                <div className="dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-lg p-4">
                  <p className="text-sm dark:text-text-tertiary light:text-text-light-tertiary mb-1">File Information</p>
                  <div className="space-y-2 mt-3">
                    <div className="flex justify-between text-sm">
                      <span className="dark:text-text-tertiary light:text-text-light-tertiary">File Name</span>
                      <span className="font-medium">{selectedContent.file_name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="dark:text-text-tertiary light:text-text-light-tertiary">File Type</span>
                      <span className="font-medium">{selectedContent.file_type}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="dark:text-text-tertiary light:text-text-light-tertiary">File Size</span>
                      <span className="font-medium">{(selectedContent.file_size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="dark:text-text-tertiary light:text-text-light-tertiary">Uploaded</span>
                      <span className="font-medium">{new Date(selectedContent.created_at).toLocaleDateString('nl-NL', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
