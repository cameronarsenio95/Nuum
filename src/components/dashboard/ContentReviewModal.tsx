import { useState } from 'react';
import { X, CheckCircle, XCircle, Edit, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ContentReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: {
    id: string;
    title: string | null;
    file_url: string;
    file_type: string;
    approval_status: string;
    workspace_id: string;
    creator_id: string;
  };
  onReviewComplete: () => void;
}

export function ContentReviewModal({ isOpen, onClose, content, onReviewComplete }: ContentReviewModalProps) {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleReview = async (newStatus: string) => {
    if (!user) return;

    setSubmitting(true);

    try {
      const previousStatus = content.approval_status;

      await supabase
        .from('content_media')
        .update({
          approval_status: newStatus,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_feedback: feedback || null
        })
        .eq('id', content.id);

      await supabase
        .from('content_reviews')
        .insert({
          content_media_id: content.id,
          workspace_id: content.workspace_id,
          reviewer_id: user.id,
          previous_status: previousStatus,
          new_status: newStatus,
          feedback: feedback || null
        });

      const notificationMessages = {
        approved: 'Your content has been approved!',
        rejected: 'Your content has been rejected',
        changes_requested: 'Changes requested for your content',
        in_review: 'Your content is now under review'
      };

      await supabase
        .from('notifications')
        .insert({
          workspace_id: content.workspace_id,
          user_id: content.creator_id,
          type: 'status_change',
          title: 'Content Review Update',
          message: notificationMessages[newStatus as keyof typeof notificationMessages] || 'Content status updated',
          entity_type: 'content',
          entity_id: content.id
        });

      onReviewComplete();
      onClose();
      setFeedback('');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isImage = content.file_type.startsWith('image/');
  const isVideo = content.file_type.startsWith('video/');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Review Content</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {content.title || 'Untitled'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            {isImage && (
              <img
                src={content.file_url}
                alt={content.title || 'Content'}
                className="w-full rounded-lg"
              />
            )}
            {isVideo && (
              <video
                src={content.file_url}
                controls
                className="w-full rounded-lg"
              />
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Feedback (optional)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Add feedback or notes about this content..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800 dark:text-yellow-300">
              <p className="font-medium mb-1">Review Actions</p>
              <p>Approve to mark as ready for use, Request changes for revisions, or Reject if not suitable.</p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => handleReview('rejected')}
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>

            <button
              onClick={() => handleReview('changes_requested')}
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              <Edit className="w-4 h-4" />
              Request Changes
            </button>

            <button
              onClick={() => handleReview('approved')}
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
