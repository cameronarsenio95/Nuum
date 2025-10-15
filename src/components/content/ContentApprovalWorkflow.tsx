import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, MessageSquare, User, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Database } from '../../lib/database.types';

type ContentMedia = Database['public']['Tables']['content_media']['Row'];

interface ContentApprovalWorkflowProps {
  content: ContentMedia;
  onStatusChange: () => void;
}

interface ApprovalHistory {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewer_id: string;
  reviewer_name: string;
  comment: string;
  created_at: string;
}

export function ContentApprovalWorkflow({ content, onStatusChange }: ContentApprovalWorkflowProps) {
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<ApprovalHistory[]>([]);

  useEffect(() => {
    loadApprovalHistory();
  }, [content.id]);

  const loadApprovalHistory = async () => {
    const historyData: ApprovalHistory[] = [];

    if (content.approval_status !== 'pending') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', content.updated_by || content.uploaded_by)
        .maybeSingle();

      historyData.push({
        id: content.id,
        status: content.approval_status as any,
        reviewer_id: content.updated_by || content.uploaded_by,
        reviewer_name: profile?.full_name || 'Unknown',
        comment: content.approval_notes || '',
        created_at: content.updated_at
      });
    }

    setHistory(historyData);
  };

  const handleApprove = async () => {
    if (!user) return;
    setSubmitting(true);

    const { error } = await supabase
      .from('content_media')
      .update({
        approval_status: 'approved',
        approval_notes: comment || null,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', content.id);

    if (error) {
      console.error('Error approving content:', error);
      alert('Failed to approve content');
    } else {
      setComment('');
      onStatusChange();
      loadApprovalHistory();
    }

    setSubmitting(false);
  };

  const handleReject = async () => {
    if (!user) return;
    if (!comment.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setSubmitting(true);

    const { error } = await supabase
      .from('content_media')
      .update({
        approval_status: 'rejected',
        approval_notes: comment,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', content.id);

    if (error) {
      console.error('Error rejecting content:', error);
      alert('Failed to reject content');
    } else {
      setComment('');
      onStatusChange();
      loadApprovalHistory();
    }

    setSubmitting(false);
  };

  const handleResetToPending = async () => {
    if (!user) return;
    setSubmitting(true);

    const { error } = await supabase
      .from('content_media')
      .update({
        approval_status: 'pending',
        approval_notes: null,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', content.id);

    if (error) {
      console.error('Error resetting status:', error);
      alert('Failed to reset status');
    } else {
      setComment('');
      onStatusChange();
      loadApprovalHistory();
    }

    setSubmitting(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-linear-success" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-linear-error" />;
      default:
        return <Clock className="w-5 h-5 text-linear-warning" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-linear-success bg-linear-success/10 border-linear-success-border/20';
      case 'rejected':
        return 'text-linear-error bg-linear-error/10 border-linear-error-border/20';
      default:
        return 'text-linear-warning bg-linear-warning/10 border-linear-warning-border/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {getStatusIcon(content.approval_status)}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Approval Status:</span>
            <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(content.approval_status)}`}>
              {content.approval_status}
            </span>
          </div>
          {content.approval_notes && (
            <p className="text-sm dark:text-text-secondary light:text-text-light-secondary mt-1">
              {content.approval_notes}
            </p>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <div className="dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear-lg p-4">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Approval History
          </h4>
          <div className="space-y-3">
            {history.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 text-sm">
                <div className="flex-shrink-0 mt-0.5">{getStatusIcon(entry.status)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{entry.reviewer_name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(entry.status)}`}>
                      {entry.status}
                    </span>
                  </div>
                  {entry.comment && (
                    <p className="dark:text-text-secondary light:text-text-light-secondary mb-1">
                      {entry.comment}
                    </p>
                  )}
                  <p className="text-xs dark:text-text-tertiary light:text-text-light-tertiary flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(entry.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {content.approval_status === 'pending' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Review Comment
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add notes or feedback..."
              rows={3}
              className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleApprove}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-linear-success hover:bg-green-600 text-white rounded-linear linear-transition disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              Approve
            </button>
            <button
              onClick={handleReject}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-linear-error hover:bg-red-600 text-white rounded-linear linear-transition disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
          </div>
        </div>
      )}

      {content.approval_status !== 'pending' && (
        <button
          onClick={handleResetToPending}
          disabled={submitting}
          className="w-full px-4 py-2 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border light:border-linear-light-border rounded-linear hover:dark:border-linear-border-subtle hover:light:border-linear-light-border linear-transition disabled:opacity-50"
        >
          Reset to Pending
        </button>
      )}
    </div>
  );
}
