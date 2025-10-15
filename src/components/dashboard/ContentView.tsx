import { useState, useEffect } from 'react';
import { Folder, Upload, X, Image as ImageIcon, Video, File, Trash2, Search, Download, Eye, HardDrive, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { usePlanLimits } from '../../contexts/PlanLimitsContext';
import { UpgradeModal } from '../modals/UpgradeModal';
import type { Database } from '../../lib/database.types';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type Creator = Database['public']['Tables']['creators']['Row'];
type ContentMedia = Database['public']['Tables']['content_media']['Row'];

interface ContentViewProps {
  workspace: Workspace;
}

interface CreatorWithContent extends Creator {
  content_count: number;
}

export function ContentView({ workspace }: ContentViewProps) {
  const { user } = useAuth();
  const { canUploadContent, limits, usage, getStorageUsagePercent, refreshUsage } = usePlanLimits();
  const [creators, setCreators] = useState<CreatorWithContent[]>([]);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [content, setContent] = useState<ContentMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewMedia, setPreviewMedia] = useState<ContentMedia | null>(null);
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    title: '',
    description: '',
    tags: '',
  });

  useEffect(() => {
    loadCreators();
  }, [workspace.id]);

  useEffect(() => {
    if (selectedCreator) {
      loadContent();
    }
  }, [selectedCreator]);

  const loadCreators = async () => {
    const { data: creatorsData, error } = await supabase
      .from('creators')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('name');

    if (error) {
      console.error('Error loading creators:', error);
    } else if (creatorsData) {
      const creatorsWithCount = await Promise.all(
        creatorsData.map(async (creator) => {
          const { count } = await supabase
            .from('content_media')
            .select('*', { count: 'exact', head: true })
            .eq('creator_id', creator.id);

          return {
            ...creator,
            content_count: count || 0,
          };
        })
      );
      setCreators(creatorsWithCount);
    }
    setLoading(false);
  };

  const loadContent = async () => {
    if (!selectedCreator) return;

    const { data, error } = await supabase
      .from('content_media')
      .select('*')
      .eq('creator_id', selectedCreator.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading content:', error);
    } else {
      setContent(data || []);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!canUploadContent(file.size)) {
        alert(`File size exceeds your storage limit. You have ${formatFileSize(limits.maxStorageGb! * 1024 * 1024 * 1024 - usage.storageUsedBytes)} remaining.`);
        e.target.value = '';
        return;
      }
      setUploadForm({ ...uploadForm, file });
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file || !selectedCreator || !user) return;

    if (!canUploadContent(uploadForm.file.size)) {
      setShowUploadModal(false);
      setShowUpgradeModal(true);
      return;
    }

    setUploading(true);

    try {
      const fileExt = uploadForm.file.name.split('.').pop();
      const fileName = `${workspace.id}/${selectedCreator.id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('content')
        .upload(fileName, uploadForm.file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Error uploading to storage:', uploadError);
        alert(`Failed to upload file: ${uploadError.message}`);
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('content')
        .getPublicUrl(fileName);

      const fileUrl = urlData.publicUrl;

      const insertData = {
        workspace_id: workspace.id,
        creator_id: selectedCreator.id,
        file_name: uploadForm.file.name,
        file_type: uploadForm.file.type,
        file_size: uploadForm.file.size,
        file_url: fileUrl,
        title: uploadForm.title || uploadForm.file.name,
        description: uploadForm.description || null,
        tags: uploadForm.tags ? uploadForm.tags.split(',').map(t => t.trim()) : [],
        uploaded_by: user.id,
      };

      console.log('Attempting to insert:', insertData);

      const { data, error } = await supabase.from('content_media').insert(insertData).select();

      if (error) {
        console.error('Error saving to database:', error);
        alert(`Failed to save file info: ${error.message}`);
      } else {
        console.log('Upload successful:', data);
        setShowUploadModal(false);
        setUploadForm({ file: null, title: '', description: '', tags: '' });
        await refreshUsage();
        loadContent();
        loadCreators();
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('An unexpected error occurred');
    }

    setUploading(false);
  };

  const handleDelete = async (contentId: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    const contentItem = content.find(c => c.id === contentId);

    if (contentItem && contentItem.file_url.includes('supabase')) {
      const urlParts = contentItem.file_url.split('/storage/v1/object/public/content/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        const { error: storageError } = await supabase.storage
          .from('content')
          .remove([filePath]);

        if (storageError) {
          console.error('Error deleting from storage:', storageError);
        }
      }
    }

    const { error } = await supabase
      .from('content_media')
      .delete()
      .eq('id', contentId);

    if (error) {
      console.error('Error deleting content:', error);
      alert('Failed to delete content.');
    } else {
      await refreshUsage();
      loadContent();
      loadCreators();
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5" />;
    } else if (fileType.startsWith('video/')) {
      return <Video className="w-5 h-5" />;
    }
    return <File className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDownload = async (item: ContentMedia) => {
    try {
      // For external URLs (like placeholder images), open in new tab
      if (item.file_url.startsWith('http://') || item.file_url.startsWith('https://')) {
        // Try to download with fetch first
        try {
          const response = await fetch(item.file_url, { mode: 'cors' });
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = item.file_name;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } catch (fetchError) {
          // If fetch fails due to CORS, open in new tab
          console.log('CORS prevented download, opening in new tab');
          window.open(item.file_url, '_blank');
        }
      } else {
        // For local files or blob URLs
        const a = document.createElement('a');
        a.href = item.file_url;
        a.download = item.file_name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. Opening in new tab instead.');
      window.open(item.file_url, '_blank');
    }
  };

  const filteredCreators = creators.filter(creator =>
    creator.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="dark:text-text-secondary light:text-text-light-secondary">Loading content...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl md:text-2xl font-medium">Content Library</h2>
            {limits.maxStorageGb !== null && (
              <span className="text-sm dark:text-text-tertiary light:text-text-light-tertiary flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                {formatFileSize(usage.storageUsedBytes)} / {limits.maxStorageGb}GB
              </span>
            )}
          </div>
          <p className="dark:text-text-secondary light:text-text-light-secondary">Manage creator content and media files</p>
          {limits.maxStorageGb !== null && getStorageUsagePercent() > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 max-w-xs h-2 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-full overflow-hidden">
                <div
                  className={`h-full linear-transition ${
                    getStorageUsagePercent() >= 100
                      ? 'bg-linear-error'
                      : getStorageUsagePercent() >= 90
                      ? 'bg-linear-warning'
                      : 'bg-linear-accent'
                  }`}
                  style={{ width: `${Math.min(getStorageUsagePercent(), 100)}%` }}
                />
              </div>
              <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary whitespace-nowrap">
                {getStorageUsagePercent().toFixed(0)}%
              </span>
            </div>
          )}
        </div>
        {selectedCreator && (
          <button
            onClick={() => {
              if (getStorageUsagePercent() >= 100) {
                setShowUpgradeModal(true);
              } else {
                setShowUploadModal(true);
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-linear linear-transition ${
              getStorageUsagePercent() < 100
                ? 'bg-white hover:bg-gray-100 text-black'
                : 'dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle dark:text-text-tertiary light:text-text-light-tertiary cursor-not-allowed'
            }`}
          >
            {getStorageUsagePercent() < 100 ? <Upload className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            Upload Content
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <Folder className="w-5 h-5 dark:text-linear-accent light:text-linear-light-accent" />
              <h3 className="font-medium">Creators</h3>
            </div>

            <div className="mb-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 dark:text-text-tertiary light:text-text-light-tertiary" />
                <input
                  type="text"
                  placeholder="Search creators..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear text-sm focus:outline-none focus:border-linear-accent"
                />
              </div>
            </div>

            {filteredCreators.length === 0 ? (
              <p className="text-sm dark:text-text-tertiary light:text-text-light-tertiary text-center py-4">
                No creators found
              </p>
            ) : (
              <div className="space-y-1">
                {filteredCreators.map((creator) => (
                  <button
                    key={creator.id}
                    onClick={() => setSelectedCreator(creator)}
                    className={`w-full text-left px-3 py-2 rounded-linear text-sm linear-transition ${
                      selectedCreator?.id === creator.id
                        ? 'bg-linear-bg-subtle text-text-primary'
                        : 'text-text-secondary hover:text-text-primary hover:bg-linear-bg-subtle'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{creator.name}</span>
                      <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary ml-2">
                        {creator.content_count}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-3">
          {!selectedCreator ? (
            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-12 text-center">
              <Folder className="w-12 h-12 dark:text-text-tertiary light:text-text-light-tertiary mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a Creator</h3>
              <p className="dark:text-text-secondary light:text-text-light-secondary">
                Choose a creator from the left to view and manage their content
              </p>
            </div>
          ) : content.length === 0 ? (
            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-12 text-center">
              <Upload className="w-12 h-12 dark:text-text-tertiary light:text-text-light-tertiary mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Content Yet</h3>
              <p className="dark:text-text-secondary light:text-text-light-secondary mb-4">
                Upload content for {selectedCreator.name}
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition"
              >
                <Upload className="w-4 h-4" />
                Upload First File
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {content.map((item) => (
                <div
                  key={item.id}
                  className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg overflow-hidden group"
                >
                  <div className="aspect-video dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle flex items-center justify-center relative cursor-pointer" onClick={() => setPreviewMedia(item)}>
                    {item.file_type.startsWith('image/') ? (
                      item.file_url.startsWith('blob:') ? (
                        <div className="flex flex-col items-center justify-center p-4 text-center">
                          <ImageIcon className="w-12 h-12 dark:text-text-tertiary light:text-text-light-tertiary mb-2" />
                          <p className="text-sm dark:text-text-secondary light:text-text-light-secondary">Preview not available</p>
                          <p className="text-xs dark:text-text-tertiary light:text-text-light-tertiary mt-1">Re-upload to see preview</p>
                        </div>
                      ) : (
                        <img
                          src={item.file_url}
                          alt={item.title || item.file_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML = `
                              <div class="flex flex-col items-center justify-center p-4 text-center">
                                <svg class="w-12 h-12 text-text-tertiary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p class="text-sm text-text-secondary">Image failed to load</p>
                                <p class="text-xs text-text-tertiary mt-1">Re-upload to see preview</p>
                              </div>
                            `;
                          }}
                        />
                      )
                    ) : item.file_type.startsWith('video/') ? (
                      item.file_url.startsWith('blob:') ? (
                        <div className="flex flex-col items-center justify-center p-4 text-center">
                          <Video className="w-12 h-12 dark:text-text-tertiary light:text-text-light-tertiary mb-2" />
                          <p className="text-sm dark:text-text-secondary light:text-text-light-secondary">Preview not available</p>
                          <p className="text-xs dark:text-text-tertiary light:text-text-light-tertiary mt-1">Re-upload to see preview</p>
                        </div>
                      ) : (
                        <video
                          src={item.file_url}
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <div className="dark:text-text-tertiary light:text-text-light-tertiary">
                        {getFileIcon(item.file_type)}
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 linear-transition">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewMedia(item);
                        }}
                        className="p-2 bg-blue-500/90 hover:bg-blue-500 text-white rounded-linear"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(item);
                        }}
                        className="p-2 bg-green-500/90 hover:bg-green-500 text-white rounded-linear"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                        className="p-2 bg-red-500/90 hover:bg-red-500 text-white rounded-linear"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-medium text-sm mb-1 truncate">
                      {item.title || item.file_name}
                    </h4>
                    {item.description && (
                      <p className="text-xs dark:text-text-secondary light:text-text-light-secondary mb-2 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs dark:text-text-tertiary light:text-text-light-tertiary">
                      <span>{formatFileSize(item.file_size)}</span>
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-0.5 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showUploadModal && selectedCreator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium">Upload Content for {selectedCreator.name}</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 hover:dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-linear linear-transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">File</label>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  accept="image/*,video/*"
                  className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                  required
                />
                <p className="text-xs dark:text-text-tertiary light:text-text-light-tertiary mt-1">
                  Supported: Images and Videos
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Title (Optional)</label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                  placeholder="Content title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent h-20"
                  placeholder="Add a description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tags (Optional)</label>
                <input
                  type="text"
                  value={uploadForm.tags}
                  onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                  className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                  placeholder="tag1, tag2, tag3"
                />
                <p className="text-xs dark:text-text-tertiary light:text-text-light-tertiary mt-1">
                  Separate tags with commas
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle hover:bg-linear-border-subtle rounded-linear linear-transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadForm.file}
                  className="flex-1 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewMedia && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-6 z-50" onClick={() => setPreviewMedia(null)}>
          <div className="relative max-w-6xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <button
                onClick={() => handleDownload(previewMedia)}
                className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-linear linear-transition"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPreviewMedia(null)}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-linear linear-transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear-lg overflow-hidden">
              {previewMedia.file_type.startsWith('image/') ? (
                <img
                  src={previewMedia.file_url}
                  alt={previewMedia.title || previewMedia.file_name}
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
              ) : previewMedia.file_type.startsWith('video/') ? (
                <video
                  src={previewMedia.file_url}
                  controls
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
              ) : (
                <div className="flex items-center justify-center p-20 dark:text-text-tertiary light:text-text-light-tertiary">
                  {getFileIcon(previewMedia.file_type)}
                  <span className="ml-4">Preview not available for this file type</span>
                </div>
              )}

              <div className="p-6 border-t dark:border-linear-border-subtle light:border-linear-light-border-subtle">
                <h3 className="text-xl font-medium mb-2">
                  {previewMedia.title || previewMedia.file_name}
                </h3>
                {previewMedia.description && (
                  <p className="dark:text-text-secondary light:text-text-light-secondary mb-4">{previewMedia.description}</p>
                )}
                <div className="flex items-center gap-6 text-sm dark:text-text-tertiary light:text-text-light-tertiary mb-4">
                  <span>{formatFileSize(previewMedia.file_size)}</span>
                  <span>{new Date(previewMedia.created_at).toLocaleString()}</span>
                  <span className="capitalize">{previewMedia.file_type.split('/')[0]}</span>
                </div>
                {previewMedia.tags && previewMedia.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {previewMedia.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-linear-info/10 text-linear-info text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={workspace.plan}
        workspaceId={workspace.id}
        reason="You've reached your storage limit. Upgrade to get more storage space for your content library."
        suggestedPlan={workspace.plan === 'free' ? 'standard' : 'elite'}
      />
    </div>
  );
}
