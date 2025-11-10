import { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Link2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { LoadingSpinner } from '../LoadingSpinner';

interface ContentItem {
  id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  platform: 'Instagram' | 'TikTok' | 'Snapchat' | 'YouTube' | null;
  created_at: string;
  ad_set_id: string | null;
  thumbnail_url?: string | null;
}

interface LinkContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  adSetId: string;
  adSetName: string;
  campaignId?: string | null;
  creatorId?: string | null;
  platform?: string | null; // nog steeds voor weergave in de UI
  workspaceId: string;
  onLinked?: () => void;
}

export function LinkContentModal({
  isOpen,
  onClose,
  adSetId,
  adSetName,
  campaignId,
  creatorId,
  platform,
  workspaceId,
  onLinked,
}: LinkContentModalProps) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadContent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, workspaceId, creatorId, campaignId, adSetId]);

  const loadContent = async () => {
    console.log('[LinkContentModal] 🔄 Loading content with params:', {
      workspaceId,
      creatorId,
      campaignId,
      adSetId,
      platform,
    });

    if (!workspaceId) {
      console.warn('[LinkContentModal] Missing workspaceId');
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setItems([]);
    setSelectedIds([]);

    try {
      let finalItems: ContentItem[] = [];

      /**
       * A. ER IS EEN CREATOR → ALLEEN CONTENT VAN DIE CREATOR
       */
      if (creatorId) {
        console.log(
          '[LinkContentModal] Using CREATOR-SCOPED loading strategy...',
        );

        // 1️⃣ Primary: workspace + creator
        const { data: primaryData, error: primaryError } = await supabase
          .from('content_media')
          .select(
            `
            id,
            file_name,
            file_type,
            file_url,
            platform,
            created_at,
            ad_set_id,
            creator_id,
            workspace_id,
            campaign_id
          `,
          )
          .eq('workspace_id', workspaceId)
          .eq('creator_id', creatorId)
          .order('created_at', { ascending: false });

        if (primaryError) {
          console.error(
            '[LinkContentModal] ❌ Supabase error in primary (creator) query:',
            primaryError,
          );
        } else {
          console.log(
            '[LinkContentModal] ✅ Primary (creator) query result:',
            { count: primaryData?.length ?? 0 },
          );
          if (primaryData && primaryData.length > 0) {
            finalItems = primaryData as ContentItem[];
          }
        }

        // 2️⃣ Fallback: als er niks is, pak alleen items die al aan deze ad set hangen
        if (finalItems.length === 0) {
          console.log(
            '[LinkContentModal] No items for this creator, trying ad_set_id-only fallback...',
          );

          const { data: adSetData, error: adSetError } = await supabase
            .from('content_media')
            .select(
              `
              id,
              file_name,
              file_type,
              file_url,
              platform,
              created_at,
              ad_set_id,
              creator_id,
              workspace_id,
              campaign_id
            `,
            )
            .eq('workspace_id', workspaceId)
            .eq('ad_set_id', adSetId)
            .order('created_at', { ascending: false });

          if (adSetError) {
            console.error(
              '[LinkContentModal] ❌ Supabase error in ad_set_id fallback:',
              adSetError,
            );
          } else {
            console.log(
              '[LinkContentModal] ✅ ad_set_id fallback result:',
              { count: adSetData?.length ?? 0 },
            );
            if (adSetData && adSetData.length > 0) {
              finalItems = adSetData as ContentItem[];
            }
          }
        }
      } else {
        /**
         * B. GEEN CREATOR → GENERIEKE WORKSPACE-FALLBACK
         */
        console.log(
          '[LinkContentModal] No creatorId → using WORKSPACE-WIDE loading strategy...',
        );

        const { data: workspaceData, error: workspaceError } = await supabase
          .from('content_media')
          .select(
            `
            id,
            file_name,
            file_type,
            file_url,
            platform,
            created_at,
            ad_set_id,
            creator_id,
            workspace_id,
            campaign_id
          `,
          )
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false });

        if (workspaceError) {
          console.error(
            '[LinkContentModal] ❌ Supabase error in workspace-wide query:',
            workspaceError,
          );
        } else {
          console.log(
            '[LinkContentModal] ✅ Workspace-wide result:',
            { count: workspaceData?.length ?? 0 },
          );
          if (workspaceData && workspaceData.length > 0) {
            finalItems = workspaceData as ContentItem[];
          }
        }
      }

      if (finalItems.length === 0) {
        console.log(
          '[LinkContentModal] No content found for this creator/ad set after all queries.',
        );
        setItems([]);
        setSelectedIds([]);
        return;
      }

      setItems(finalItems);

      const alreadyLinked = finalItems
        .filter((item) => item.ad_set_id === adSetId)
        .map((item) => item.id);

      setSelectedIds(alreadyLinked);

      console.log('[LinkContentModal] Pre-selected linked items:', {
        count: alreadyLinked.length,
        ids: alreadyLinked,
      });
    } catch (err) {
      console.error('[LinkContentModal] Unexpected error:', err);
      showToast('Failed to load content', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const previouslyLinked = items
        .filter((item) => item.ad_set_id === adSetId)
        .map((item) => item.id);

      const toLink = selectedIds.filter(
        (id) => !previouslyLinked.includes(id),
      );
      const toUnlink = previouslyLinked.filter(
        (id) => !selectedIds.includes(id),
      );

      console.log('[LinkContentModal] Saving links:', {
        toLink,
        toUnlink,
      });

      const updates: Promise<any>[] = [];

      if (toLink.length > 0) {
        updates.push(
          supabase
            .from('content_media')
            .update({ ad_set_id: adSetId })
            .in('id', toLink),
        );
      }

      if (toUnlink.length > 0) {
        updates.push(
          supabase
            .from('content_media')
            .update({ ad_set_id: null })
            .in('id', toUnlink),
        );
      }

      if (updates.length > 0) {
        const results = await Promise.all(updates);
        const errorResult = results.find((r) => r.error);

        if (errorResult?.error) {
          console.error('[LinkContentModal] Error saving:', errorResult.error);
          showToast('Failed to update content links', 'error');
          return;
        }
      }

      showToast(`Content linked successfully to ${adSetName}`, 'success');
      onLinked?.();
      onClose();
    } catch (err) {
      console.error('[LinkContentModal] Unexpected error saving:', err);
      showToast('Failed to save content links', 'error');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const getPlatformBadgeColor = (platform: string | null) => {
    if (!platform) return 'bg-gray-500/20 text-gray-400';

    switch (platform) {
      case 'Instagram':
        return 'bg-pink-500/20 text-pink-400';
      case 'TikTok':
        return 'bg-cyan-500/20 text-cyan-400';
      case 'Snapchat':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'YouTube':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="relative w-full max-w-3xl bg-[#1a1f1a] rounded-xl shadow-2xl border border-[#2d342d]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d342d]">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Link Content to Ad Set
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {adSetName}
                {platform && <span className="ml-2">· {platform}</span>}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#2d342d] rounded-lg transition-colors"
              disabled={saving}
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4">
            {!loading && !creatorId && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400">
                  ⚠️ No creator selected for this ad set. Please assign a
                  creator to the ad set first.
                </p>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">
                  No content available for this creator/ad set
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Upload content in the Content Library first
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {items.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  const isImage = item.file_type?.startsWith('image/');
                  const isVideo = item.file_type?.startsWith('video/');

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleSelection(item.id)}
                      className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-500/10 border border-blue-500/30'
                          : 'bg-[#1e2921] hover:bg-[#252f25] border border-transparent'
                      }`}
                    >
                      <div className="flex-shrink-0 w-16 h-16 bg-[#2d342d] rounded-lg overflow-hidden flex items-center justify-center">
                        {isImage ? (
                          <img
                            src={item.file_url}
                            alt={item.file_name}
                            className="w-full h-full object-cover"
                          />
                        ) : isVideo ? (
                          <video
                            src={item.file_url}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-gray-600" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {item.file_name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {item.platform && (
                            <span
                              className={`px-2 py-0.5 rounded text-xs ${getPlatformBadgeColor(
                                item.platform,
                              )}`}
                            >
                              {item.platform}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatDate(item.created_at)}
                          </span>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelection(item.id)}
                          className="w-5 h-5 rounded border-gray-600 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 bg-[#1a1f1a]"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#2d342d]">
            <p className="text-sm text-gray-400">
              {selectedIds.length}{' '}
              {selectedIds.length === 1 ? 'item' : 'items'} selected
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-[#2d342d] rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <LoadingSpinner />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    <span>Save Links</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
