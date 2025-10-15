import { useState } from 'react';
import { CheckSquare, Download, Trash2, Tag, FolderOpen, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Database } from '../../lib/database.types';

type ContentMedia = Database['public']['Tables']['content_media']['Row'];

interface ContentBatchOperationsProps {
  selectedItems: ContentMedia[];
  onOperationComplete: () => void;
  onClearSelection: () => void;
}

export function ContentBatchOperations({
  selectedItems,
  onOperationComplete,
  onClearSelection
}: ContentBatchOperationsProps) {
  const { user } = useAuth();
  const [showActions, setShowActions] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [processing, setProcessing] = useState(false);

  if (selectedItems.length === 0) {
    return null;
  }

  const handleBatchDelete = async () => {
    if (!confirm(`Delete ${selectedItems.length} selected item(s)? This action cannot be undone.`)) {
      return;
    }

    setProcessing(true);

    for (const item of selectedItems) {
      if (item.file_path) {
        const path = item.file_path.split('/').slice(2).join('/');
        await supabase.storage.from('content-media').remove([path]);
      }

      await supabase
        .from('content_media')
        .delete()
        .eq('id', item.id);
    }

    setProcessing(false);
    onOperationComplete();
    onClearSelection();
  };

  const handleBatchDownload = async () => {
    setProcessing(true);

    for (const item of selectedItems) {
      if (item.file_path) {
        const { data } = await supabase.storage
          .from('content-media')
          .download(item.file_path.split('/').slice(2).join('/'));

        if (data) {
          const url = URL.createObjectURL(data);
          const a = document.createElement('a');
          a.href = url;
          a.download = item.title;
          a.click();
          URL.revokeObjectURL(url);
        }
      }
    }

    setProcessing(false);
    onClearSelection();
  };

  const handleBatchTag = async () => {
    if (!tagInput.trim()) {
      alert('Please enter at least one tag');
      return;
    }

    setProcessing(true);
    const newTags = tagInput.split(',').map(t => t.trim()).filter(t => t);

    for (const item of selectedItems) {
      const existingTags = item.tags || [];
      const combinedTags = [...new Set([...existingTags, ...newTags])];

      await supabase
        .from('content_media')
        .update({ tags: combinedTags, updated_at: new Date().toISOString() })
        .eq('id', item.id);
    }

    setProcessing(false);
    setShowTagModal(false);
    setTagInput('');
    onOperationComplete();
    onClearSelection();
  };

  const handleBatchApproval = async (status: 'approved' | 'rejected') => {
    if (!user) return;
    setProcessing(true);

    for (const item of selectedItems) {
      await supabase
        .from('content_media')
        .update({
          approval_status: status,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);
    }

    setProcessing(false);
    setShowApprovalModal(false);
    onOperationComplete();
    onClearSelection();
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <div className="dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border light:border-linear-light-border rounded-linear-lg shadow-lg p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 dark:text-linear-accent light:text-linear-light-accent" />
              <span className="font-medium">{selectedItems.length} selected</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTagModal(true)}
                disabled={processing}
                className="flex items-center gap-2 px-3 py-2 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle hover:bg-linear-border-subtle rounded-linear linear-transition disabled:opacity-50"
                title="Add tags"
              >
                <Tag className="w-4 h-4" />
                <span className="text-sm">Tag</span>
              </button>

              <button
                onClick={() => setShowApprovalModal(true)}
                disabled={processing}
                className="flex items-center gap-2 px-3 py-2 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle hover:bg-linear-border-subtle rounded-linear linear-transition disabled:opacity-50"
                title="Batch approval"
              >
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Approve</span>
              </button>

              <button
                onClick={handleBatchDownload}
                disabled={processing}
                className="flex items-center gap-2 px-3 py-2 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle hover:bg-linear-border-subtle rounded-linear linear-transition disabled:opacity-50"
                title="Download all"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">Download</span>
              </button>

              <button
                onClick={handleBatchDelete}
                disabled={processing}
                className="flex items-center gap-2 px-3 py-2 bg-linear-error-subtle hover:bg-red-500/20 text-linear-error rounded-linear linear-transition disabled:opacity-50"
                title="Delete all"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm">Delete</span>
              </button>
            </div>

            <button
              onClick={onClearSelection}
              className="px-3 py-2 text-sm dark:text-text-secondary light:text-text-light-secondary hover:dark:text-text-primary hover:light:text-text-light-primary"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {showTagModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50" onClick={() => setShowTagModal(false)}>
          <div
            className="dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-medium mb-4">Add Tags to {selectedItems.length} Items</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Tags (comma separated)</label>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="tag1, tag2, tag3"
                className="w-full px-4 py-2 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowTagModal(false)}
                className="flex-1 px-4 py-2 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle hover:bg-linear-border-subtle rounded-linear linear-transition"
              >
                Cancel
              </button>
              <button
                onClick={handleBatchTag}
                disabled={processing || !tagInput.trim()}
                className="flex-1 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition disabled:opacity-50"
              >
                {processing ? 'Adding...' : 'Add Tags'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50" onClick={() => setShowApprovalModal(false)}>
          <div
            className="dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-medium mb-4">Batch Approval</h3>
            <p className="dark:text-text-secondary light:text-text-light-secondary mb-6">
              Set approval status for {selectedItems.length} selected item(s)
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="flex-1 px-4 py-2 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle hover:bg-linear-border-subtle rounded-linear linear-transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBatchApproval('rejected')}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-linear-error hover:bg-red-600 text-white rounded-linear linear-transition disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Reject'}
              </button>
              <button
                onClick={() => handleBatchApproval('approved')}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-linear-success hover:bg-green-600 text-white rounded-linear linear-transition disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
