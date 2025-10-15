import { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Clock, MessageSquare, Upload, Calendar, Eye, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import type { Database } from '../../lib/database.types';

type Deliverable = Database['public']['Tables']['deliverables']['Row'];
type Campaign = Database['public']['Tables']['campaigns']['Row'];
type Creator = Database['public']['Tables']['creators']['Row'];

interface DeliverableWithRelations extends Deliverable {
  campaign?: Campaign;
  creator?: Creator;
}

interface Comment {
  id: string;
  comment: string;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string;
  };
}

interface Revision {
  id: string;
  version: number;
  status: string;
  created_at: string;
  changes: any;
  profiles?: {
    full_name: string;
  };
}

interface DeliverableDetailModalProps {
  deliverable: DeliverableWithRelations;
  onClose: () => void;
  onUpdate: () => void;
}

export function DeliverableDetailModal({ deliverable, onClose, onUpdate }: DeliverableDetailModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [newComment, setNewComment] = useState('');
  const [feedback, setFeedback] = useState(deliverable.feedback || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'history'>('details');

  useEffect(() => {
    loadComments();
    loadRevisions();
  }, [deliverable.id]);

  const loadComments = async () => {
    const { data } = await supabase
      .from('deliverable_comments')
      .select(`
        *,
        profiles:user_id(full_name)
      `)
      .eq('deliverable_id', deliverable.id)
      .order('created_at', { ascending: true });

    if (data) setComments(data as Comment[]);
  };

  const loadRevisions = async () => {
    const { data } = await supabase
      .from('deliverable_revisions')
      .select(`
        *,
        profiles:changed_by(full_name)
      `)
      .eq('deliverable_id', deliverable.id)
      .order('created_at', { ascending: false });

    if (data) setRevisions(data as Revision[]);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;

    setIsSubmitting(true);
    const { error } = await supabase
      .from('deliverable_comments')
      .insert({
        deliverable_id: deliverable.id,
        user_id: user.id,
        comment: newComment.trim()
      });

    if (error) {
      showToast('Failed to add comment', 'error');
    } else {
      setNewComment('');
      loadComments();
      showToast('Comment added', 'success');
    }
    setIsSubmitting(false);
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setIsSubmitting(true);
    const { error } = await supabase
      .from('deliverables')
      .update({
        status: newStatus,
        feedback: feedback || null
      })
      .eq('id', deliverable.id);

    if (error) {
      showToast('Failed to update status', 'error');
    } else {
      showToast(`Status updated to ${newStatus.replace('_', ' ')}`, 'success');
      onUpdate();
      onClose();
    }
    setIsSubmitting(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'dark:text-text-tertiary dark:bg-linear-bg-hover';
      case 'in_review':
        return 'dark:text-linear-warning dark:bg-linear-warning-subtle';
      case 'approved':
        return 'dark:text-linear-info dark:bg-linear-info-subtle';
      case 'posted':
        return 'dark:text-linear-accent dark:bg-linear-accent-subtle';
      case 'completed':
        return 'dark:text-linear-success dark:bg-linear-success-subtle';
      default:
        return 'dark:text-text-tertiary dark:bg-linear-bg-hover';
    }
  };

  const isOverdue = deliverable.due_date && new Date(deliverable.due_date) < new Date();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b dark:border-linear-border light:border-linear-light-border">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-medium mb-1">{deliverable.title}</h2>
            <div className="flex items-center gap-3 text-sm dark:text-text-secondary light:text-text-light-secondary">
              <span>{deliverable.creator?.name}</span>
              <span>•</span>
              <span>{deliverable.campaign?.name}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:dark:bg-linear-bg-hover hover:light:bg-linear-light-bg-hover rounded-linear linear-transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="border-b dark:border-linear-border light:border-linear-light-border">
          <div className="flex gap-1 px-6">
            {[
              { value: 'details', label: 'Details' },
              { value: 'comments', label: 'Comments', count: comments.length },
              { value: 'history', label: 'History', count: revisions.length }
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value as any)}
                className={`px-4 py-3 text-sm font-medium border-b-2 linear-transition ${
                  activeTab === tab.value
                    ? 'border-linear-accent dark:text-text-primary light:text-text-light-primary'
                    : 'border-transparent dark:text-text-secondary light:text-text-light-secondary hover:dark:text-text-primary hover:light:text-text-light-primary'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full dark:bg-linear-bg-hover light:bg-linear-light-bg-hover">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm capitalize ${getStatusColor(deliverable.status)}`}>
                    {deliverable.status.replace('_', ' ')}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <span className="inline-flex px-3 py-1 rounded-full text-sm capitalize dark:bg-linear-bg-hover light:bg-linear-light-bg-hover">
                    {deliverable.type}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Platform</label>
                  <span className="inline-flex px-3 py-1 rounded-full text-sm capitalize dark:bg-linear-bg-hover light:bg-linear-light-bg-hover">
                    {deliverable.platform}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Due Date
                  </label>
                  {deliverable.due_date ? (
                    <div className={`text-sm ${isOverdue ? 'dark:text-linear-error light:text-linear-light-error' : ''}`}>
                      {isOverdue && <AlertCircle className="w-4 h-4 inline mr-1" />}
                      {new Date(deliverable.due_date).toLocaleDateString()}
                      {isOverdue && ' (Overdue)'}
                    </div>
                  ) : (
                    <span className="text-sm dark:text-text-tertiary light:text-text-light-tertiary">No due date</span>
                  )}
                </div>
              </div>

              {deliverable.description && (
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <p className="text-sm dark:text-text-secondary light:text-text-light-secondary">
                    {deliverable.description}
                  </p>
                </div>
              )}

              {deliverable.url && (
                <div>
                  <label className="block text-sm font-medium mb-2">Content URL</label>
                  <a
                    href={deliverable.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-linear-accent hover:underline"
                  >
                    {deliverable.url}
                  </a>
                </div>
              )}

              {deliverable.file_url && (
                <div>
                  <label className="block text-sm font-medium mb-2">Uploaded File</label>
                  <a
                    href={deliverable.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border light:border-linear-light-border rounded-linear text-sm hover:dark:bg-linear-bg-hover hover:light:bg-linear-light-bg-hover linear-transition"
                  >
                    <Upload className="w-4 h-4" />
                    View File
                  </a>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Feedback / Notes</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Add feedback or notes about this deliverable..."
                  rows={4}
                  className="w-full px-4 py-2 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent resize-none"
                />
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              <div className="space-y-3">
                {comments.length === 0 ? (
                  <div className="text-center py-8 text-sm dark:text-text-tertiary light:text-text-light-tertiary">
                    No comments yet
                  </div>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="p-4 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border light:border-linear-light-border rounded-linear">
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-medium text-sm">
                          {(comment.profiles as any)?.full_name || 'Unknown User'}
                        </span>
                        <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm dark:text-text-secondary light:text-text-light-secondary">
                        {comment.comment}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-4 border-t dark:border-linear-border light:border-linear-light-border">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                  className="w-full px-4 py-2 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent resize-none mb-2"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition disabled:opacity-50"
                >
                  <MessageSquare className="w-4 h-4" />
                  Add Comment
                </button>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              {revisions.length === 0 ? (
                <div className="text-center py-8 text-sm dark:text-text-tertiary light:text-text-light-tertiary">
                  No revision history yet
                </div>
              ) : (
                revisions.map(revision => (
                  <div key={revision.id} className="p-4 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border light:border-linear-light-border rounded-linear">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="font-medium text-sm">Version {revision.version}</span>
                        <span className="mx-2 dark:text-text-tertiary light:text-text-light-tertiary">•</span>
                        <span className="text-sm capitalize">{revision.status.replace('_', ' ')}</span>
                      </div>
                      <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">
                        {new Date(revision.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs dark:text-text-secondary light:text-text-light-secondary">
                      Changed by {(revision.profiles as any)?.full_name || 'Unknown User'}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 p-6 border-t dark:border-linear-border light:border-linear-light-border">
          <div className="flex gap-2">
            {deliverable.status !== 'completed' && (
              <>
                {deliverable.status === 'pending' && (
                  <button
                    onClick={() => handleStatusUpdate('in_review')}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-4 py-2 dark:bg-linear-warning dark:hover:bg-linear-warning/80 light:bg-linear-light-warning light:hover:bg-linear-light-warning/80 text-black rounded-linear linear-transition disabled:opacity-50"
                  >
                    <Eye className="w-4 h-4" />
                    Move to Review
                  </button>
                )}

                {deliverable.status === 'in_review' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate('approved')}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-4 py-2 dark:bg-linear-success dark:hover:bg-linear-success/80 light:bg-linear-light-success light:hover:bg-linear-light-success/80 text-black rounded-linear linear-transition disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleStatusUpdate('pending')}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-4 py-2 dark:bg-linear-error dark:hover:bg-linear-error/80 light:bg-linear-light-error light:hover:bg-linear-light-error/80 text-white rounded-linear linear-transition disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Request Changes
                    </button>
                  </>
                )}

                {deliverable.status === 'approved' && (
                  <button
                    onClick={() => handleStatusUpdate('posted')}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-4 py-2 dark:bg-linear-accent dark:hover:bg-linear-accent/80 light:bg-linear-light-accent light:hover:bg-linear-light-accent/80 text-black rounded-linear linear-transition disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark as Posted
                  </button>
                )}

                {deliverable.status === 'posted' && (
                  <button
                    onClick={() => handleStatusUpdate('completed')}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark as Completed
                  </button>
                )}
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border light:border-linear-light-border rounded-linear hover:dark:bg-linear-bg-hover hover:light:bg-linear-light-bg-hover linear-transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface CreateDeliverableModalProps {
  workspaceId: string;
  campaigns: Campaign[];
  creators: Creator[];
  onClose: () => void;
  onCreate: () => void;
}

export function CreateDeliverableModal({ workspaceId, campaigns, creators, onClose, onCreate }: CreateDeliverableModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    campaign_id: '',
    creator_id: '',
    type: 'post' as 'post' | 'story' | 'video' | 'reel' | 'other',
    platform: 'instagram' as 'instagram' | 'tiktok' | 'youtube' | 'other',
    due_date: '',
    url: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.title || !formData.campaign_id || !formData.creator_id) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase
      .from('deliverables')
      .insert({
        title: formData.title,
        description: formData.description || null,
        campaign_id: formData.campaign_id,
        creator_id: formData.creator_id,
        type: formData.type,
        platform: formData.platform,
        due_date: formData.due_date || null,
        url: formData.url || null,
        status: 'pending',
        assigned_to: user.id
      });

    if (error) {
      showToast('Failed to create deliverable', 'error');
      console.error(error);
    } else {
      showToast('Deliverable created successfully', 'success');
      onCreate();
      onClose();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b dark:border-linear-border light:border-linear-light-border">
          <h2 className="text-xl font-medium">Create Deliverable</h2>
          <button
            onClick={onClose}
            className="p-2 hover:dark:bg-linear-bg-hover hover:light:bg-linear-light-bg-hover rounded-linear linear-transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Title <span className="text-linear-error">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Instagram Reel - Product Launch"
              className="w-full px-4 py-2 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add details about the deliverable requirements..."
              rows={3}
              className="w-full px-4 py-2 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Campaign <span className="text-linear-error">*</span>
              </label>
              <select
                value={formData.campaign_id}
                onChange={(e) => setFormData({ ...formData, campaign_id: e.target.value })}
                className="w-full px-4 py-2 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                required
              >
                <option value="">Select campaign</option>
                {campaigns.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Creator <span className="text-linear-error">*</span>
              </label>
              <select
                value={formData.creator_id}
                onChange={(e) => setFormData({ ...formData, creator_id: e.target.value })}
                className="w-full px-4 py-2 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                required
              >
                <option value="">Select creator</option>
                {creators.map(creator => (
                  <option key={creator.id} value={creator.id}>{creator.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-4 py-2 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
              >
                <option value="post">Post</option>
                <option value="story">Story</option>
                <option value="video">Video</option>
                <option value="reel">Reel</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Platform</label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value as any })}
                className="w-full px-4 py-2 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
              >
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Due Date</label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-4 py-2 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Content URL (optional)</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://..."
              className="w-full px-4 py-2 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
            />
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 p-6 border-t dark:border-linear-border light:border-linear-light-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border light:border-linear-light-border rounded-linear hover:dark:bg-linear-bg-hover hover:light:bg-linear-light-bg-hover linear-transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Deliverable'}
          </button>
        </div>
      </div>
    </div>
  );
}
