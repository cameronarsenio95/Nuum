import { useState, useEffect } from 'react';
import { MessageSquare, Clock, User, AlertCircle, CheckCircle, X, Send, Sparkles, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type SupportTicket = Database['public']['Tables']['support_tickets']['Row'];
type SupportTicketMessage = Database['public']['Tables']['support_ticket_messages']['Row'];

export function TicketsView() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportTicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadTickets();
  }, [filterStatus, filterPriority]);

  useEffect(() => {
    if (selectedTicket) {
      loadMessages(selectedTicket.id);

      const subscription = supabase
        .channel(`ticket_${selectedTicket.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'support_ticket_messages',
            filter: `ticket_id=eq.${selectedTicket.id}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as SupportTicketMessage]);
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [selectedTicket]);

  const loadTickets = async () => {
    let query = supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus);
    }

    if (filterPriority !== 'all') {
      query = query.eq('priority', filterPriority);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading tickets:', error);
    } else {
      setTickets(data || []);
    }
    setLoading(false);
  };

  const loadMessages = async (ticketId: string) => {
    const { data, error } = await supabase
      .from('support_ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
    } else {
      setMessages(data || []);
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    const { error } = await supabase
      .from('support_tickets')
      .update({ status: newStatus })
      .eq('id', ticketId);

    if (error) {
      console.error('Error updating status:', error);
    } else {
      loadTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    }
  };

  const handleDeleteTicket = async () => {
    if (!selectedTicket || deleting) return;

    setDeleting(true);

    const { error } = await supabase
      .from('support_tickets')
      .delete()
      .eq('id', selectedTicket.id);

    if (error) {
      console.error('Error deleting ticket:', error);
      alert('Failed to delete ticket. Please try again.');
    } else {
      setSelectedTicket(null);
      setShowDeleteConfirm(false);
      loadTickets();
    }

    setDeleting(false);
  };

  const handleGenerateAISuggestion = async () => {
    if (!selectedTicket) return;

    setGeneratingAI(true);
    setAiError(null);

    try {
      const { data: staffData } = await supabase
        .from('support_staff')
        .select('*')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();

      const conversationHistory = messages.map(msg => ({
        author: msg.author_name,
        message: msg.message,
        timestamp: new Date(msg.created_at).toLocaleString(),
      }));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-suggest-reply`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ticketSubject: selectedTicket.subject,
            ticketMessage: selectedTicket.message,
            conversationHistory,
            supportStaffName: staffData?.full_name || 'Support Team',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate AI suggestion');
      }

      const data = await response.json();

      if (data.error) {
        setAiError(data.error);
      }

      if (data.warning) {
        setAiError(data.warning);
      }

      console.log('AI Response model:', data.model);

      setReplyMessage(data.suggestion);
    } catch (error) {
      console.error('Error generating AI suggestion:', error);
      setAiError('Failed to generate AI suggestion. Please try again.');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    setSending(true);

    try {
      const { data: staffData } = await supabase
        .from('support_staff')
        .select('*')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();

      const { error } = await supabase.from('support_ticket_messages').insert({
        ticket_id: selectedTicket.id,
        author_id: staffData?.id || null,
        author_name: staffData?.full_name || 'Support Team',
        author_email: staffData?.email || 'support@nuum.com',
        author_type: 'support',
        message: replyMessage,
        is_internal: false,
      });

      if (error) throw error;

      if (selectedTicket.status === 'open') {
        await handleUpdateStatus(selectedTicket.id, 'in_progress');
      }

      setReplyMessage('');
      loadMessages(selectedTicket.id);
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'in_progress':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'resolved':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'closed':
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-400';
      case 'high':
        return 'text-orange-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  if (loading) {
    return <div className="dark:text-text-secondary light:text-text-light-secondary">Loading tickets...</div>;
  }

  if (selectedTicket) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={() => setSelectedTicket(null)}
              className="text-sm dark:text-text-secondary light:text-text-light-secondary hover:text-linear-accent mb-2"
            >
              ← Back to tickets
            </button>
            <h2 className="text-2xl font-medium mb-1">
              {selectedTicket.ticket_number}
            </h2>
            <p className="dark:text-text-secondary light:text-text-light-secondary">
              {selectedTicket.subject}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedTicket.status}
              onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value)}
              className={`px-3 py-1.5 rounded-full text-sm border ${getStatusColor(selectedTicket.status)}`}
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 dark:text-text-tertiary light:text-text-light-tertiary hover:text-red-500 hover:bg-red-500/10 rounded-linear transition-colors"
              title="Delete ticket"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear p-6">
              <h3 className="text-sm font-medium mb-2 dark:text-text-tertiary light:text-text-light-tertiary">
                Original Message
              </h3>
              <p className="dark:text-text-primary light:text-text-light-primary whitespace-pre-wrap">
                {selectedTicket.message}
              </p>
            </div>

            {messages.length > 0 && (
              <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear">
                <h3 className="text-lg font-medium p-6 pb-4 dark:text-text-primary light:text-text-light-primary">
                  Conversation
                </h3>
                <div className="space-y-1">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className="flex items-start gap-3 py-3 px-6 border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.author_type === 'support'
                          ? 'dark:bg-linear-accent light:bg-linear-light-accent text-white'
                          : 'dark:bg-gray-600 light:bg-gray-300 text-white'
                      }`}>
                        <span className="text-sm font-medium">
                          {msg.author_name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="font-medium dark:text-text-primary light:text-text-light-primary text-sm">
                            {msg.author_name}
                          </span>
                          {msg.author_type === 'support' && (
                            <span className="text-xs px-1.5 py-0.5 rounded dark:bg-linear-accent/20 light:bg-linear-light-accent/20 dark:text-linear-accent light:text-linear-light-accent">
                              Support Team
                            </span>
                          )}
                          <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">
                            {new Date(msg.created_at).toLocaleString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="dark:text-text-secondary light:text-text-light-secondary text-sm mt-0.5 whitespace-pre-wrap">
                          {msg.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium dark:text-text-primary light:text-text-light-primary">
                  Send Reply
                </h3>
                <button
                  type="button"
                  onClick={handleGenerateAISuggestion}
                  disabled={generatingAI}
                  className="flex items-center gap-2 px-4 py-2 dark:bg-linear-accent/10 light:bg-linear-light-accent/10 dark:text-linear-accent light:text-linear-light-accent rounded-linear text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed border dark:border-linear-accent/20 light:border-linear-light-accent/20"
                >
                  <Sparkles className="w-4 h-4" />
                  {generatingAI ? 'Generating...' : 'AI Suggest'}
                </button>
              </div>

              {aiError && (
                <div className="mb-4 p-3 rounded-linear bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
                  {aiError}
                </div>
              )}

              <form onSubmit={handleSendReply} className="space-y-4">
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply here or click 'AI Suggest' for assistance..."
                  rows={6}
                  className="w-full px-4 py-3 rounded-linear border dark:bg-linear-bg light:bg-linear-light-bg dark:border-linear-border light:border-linear-light-border dark:text-text-primary light:text-text-light-primary focus:outline-none focus:border-linear-accent resize-none"
                />
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={sending || !replyMessage.trim()}
                    className="flex items-center gap-2 px-6 py-2.5 dark:bg-linear-accent light:bg-linear-light-accent dark:text-linear-bg light:text-linear-light-bg rounded-linear font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    {sending ? 'Sending...' : 'Send Reply'}
                  </button>
                  {replyMessage && (
                    <button
                      type="button"
                      onClick={() => setReplyMessage('')}
                      className="text-sm dark:text-text-tertiary light:text-text-light-tertiary hover:text-linear-accent"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear p-6">
              <h3 className="text-sm font-medium mb-4 dark:text-text-tertiary light:text-text-light-tertiary">
                Ticket Details
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="dark:text-text-tertiary light:text-text-light-tertiary">Customer</span>
                  <p className="font-medium dark:text-text-primary light:text-text-light-primary">{selectedTicket.user_name}</p>
                  <p className="text-xs dark:text-text-secondary light:text-text-light-secondary">{selectedTicket.user_email}</p>
                </div>
                <div>
                  <span className="dark:text-text-tertiary light:text-text-light-tertiary">Priority</span>
                  <p className={`font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                    {selectedTicket.priority.toUpperCase()}
                  </p>
                </div>
                <div>
                  <span className="dark:text-text-tertiary light:text-text-light-tertiary">Category</span>
                  <p className="font-medium dark:text-text-primary light:text-text-light-primary capitalize">
                    {selectedTicket.category.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <span className="dark:text-text-tertiary light:text-text-light-tertiary">Created</span>
                  <p className="font-medium dark:text-text-primary light:text-text-light-primary">
                    {new Date(selectedTicket.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="dark:text-text-tertiary light:text-text-light-tertiary">Last Updated</span>
                  <p className="font-medium dark:text-text-primary light:text-text-light-primary">
                    {new Date(selectedTicket.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear p-6 max-w-md w-full">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-medium dark:text-text-primary light:text-text-light-primary mb-1">
                    Delete Ticket
                  </h3>
                  <p className="text-sm dark:text-text-secondary light:text-text-light-secondary">
                    Are you sure you want to delete ticket <span className="font-mono">{selectedTicket.ticket_number}</span>?
                    This will permanently delete the ticket and all its messages. This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="px-4 py-2 dark:text-text-secondary light:text-text-light-secondary hover:text-text-primary rounded-linear transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTicket}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-500 text-white rounded-linear font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete Ticket'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-medium mb-2">Support Tickets</h2>
        <p className="dark:text-text-secondary light:text-text-light-secondary">
          Manage and respond to customer support requests
        </p>
      </div>

      <div className="flex gap-4 mb-6">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 rounded-linear border dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary dark:border-linear-border light:border-linear-light-border dark:text-text-primary light:text-text-light-primary"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-4 py-2 rounded-linear border dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary dark:border-linear-border light:border-linear-light-border dark:text-text-primary light:text-text-light-primary"
        >
          <option value="all">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {tickets.length === 0 ? (
        <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear p-12 text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 dark:text-text-tertiary light:text-text-light-tertiary" />
          <p className="dark:text-text-secondary light:text-text-light-secondary">
            No support tickets found
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear p-6 cursor-pointer hover:border-linear-accent transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-mono dark:text-text-tertiary light:text-text-light-tertiary">
                      {ticket.ticket_number}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <span className={`text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority.toUpperCase()}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full dark:bg-linear-bg light:bg-linear-light-bg dark:text-text-tertiary light:text-text-light-tertiary capitalize">
                      {ticket.category.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="font-medium text-lg dark:text-text-primary light:text-text-light-primary mb-2">
                    {ticket.subject}
                  </h3>
                  <p className="text-sm dark:text-text-secondary light:text-text-light-secondary line-clamp-2 mb-3">
                    {ticket.message}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 dark:text-text-tertiary light:text-text-light-tertiary">
                      <User className="w-4 h-4" />
                      {ticket.user_name}
                    </div>
                    <div className="flex items-center gap-1.5 dark:text-text-tertiary light:text-text-light-tertiary">
                      <Clock className="w-4 h-4" />
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
