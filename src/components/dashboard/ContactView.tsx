import { useState, useEffect } from 'react';
import { Send, Mail, MessageCircle, ArrowRight, ChevronRight, Clock, AlertCircle, CheckCircle, X, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type SupportTicket = Database['public']['Tables']['support_tickets']['Row'];
type SupportTicketMessage = Database['public']['Tables']['support_ticket_messages']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export function ContactView() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showContactForm, setShowContactForm] = useState<'sales' | 'support' | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportTicketMessage[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadTickets();
    }
  }, [user]);

  useEffect(() => {
    if (selectedTicket) {
      loadMessages(selectedTicket.id);

      const subscription = supabase
        .channel(`ticket-${selectedTicket.id}`)
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

  const loadProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      setProfile(data);
    }
  };

  const loadTickets = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

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

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    setSending(true);

    try {
      const { error } = await supabase.from('support_ticket_messages').insert({
        ticket_id: selectedTicket.id,
        author_id: user?.id || null,
        author_name: profile?.full_name || 'User',
        author_email: profile?.email || user?.email || '',
        author_type: 'customer',
        message: replyMessage,
        is_internal: false,
      });

      if (error) throw error;

      setReplyMessage('');

      const conversationHistory = messages.map(msg => ({
        author: msg.author_name,
        message: msg.message,
        timestamp: new Date(msg.created_at).toLocaleString(),
      }));
      conversationHistory.push({
        author: profile?.full_name || 'User',
        message: replyMessage,
        timestamp: new Date().toLocaleString(),
      });

      fetch(
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
            supportStaffName: 'NUUM Support Team',
          }),
        }
      ).then(async (response) => {
        if (response.ok) {
          const data = await response.json();

          await supabase.from('support_ticket_messages').insert({
            ticket_id: selectedTicket.id,
            author_id: null,
            author_name: 'NUUM Support Team',
            author_email: 'support@nuum.com',
            author_type: 'support',
            message: data.suggestion,
            is_internal: false,
          });
        }
      }).catch((error) => {
        console.error('Error getting AI response:', error);
      });

      loadTickets();
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
    return <div className="dark:text-text-secondary light:text-text-light-secondary">Loading...</div>;
  }

  if (selectedTicket) {
    return (
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => setSelectedTicket(null)}
          className="mb-6 text-sm dark:text-text-secondary light:text-text-light-secondary hover:text-linear-accent"
        >
          ← Back to contact
        </button>

        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-mono dark:text-text-tertiary light:text-text-light-tertiary">
                  {selectedTicket.ticket_number}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(selectedTicket.status)}`}>
                  {selectedTicket.status.replace('_', ' ')}
                </span>
                <span className={`text-xs font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                  {selectedTicket.priority.toUpperCase()}
                </span>
              </div>
              <h2 className="text-3xl font-medium mb-2 dark:text-text-primary light:text-text-light-primary">
                {selectedTicket.subject}
              </h2>
              <p className="dark:text-text-secondary light:text-text-light-secondary">
                Created {new Date(selectedTicket.created_at).toLocaleDateString()} • Last updated {new Date(selectedTicket.updated_at).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 dark:text-text-tertiary light:text-text-light-tertiary hover:text-red-500 hover:bg-red-500/10 rounded-linear transition-colors"
              title="Delete ticket"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-start gap-3 py-3 px-4 border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle">
            <div className="w-10 h-10 rounded-full dark:bg-gray-600 light:bg-gray-300 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-white">
                {selectedTicket.user_name.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-medium dark:text-text-primary light:text-text-light-primary text-sm">
                  {selectedTicket.user_name}
                </span>
                <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">
                  {new Date(selectedTicket.created_at).toLocaleString('en-GB', {
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
                {selectedTicket.message}
              </p>
            </div>
          </div>

          {messages.map((msg) => (
            <div
              key={msg.id}
              className="flex items-start gap-3 py-3 px-4 border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle"
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

          {selectedTicket.status !== 'closed' && (
            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-8">
              <h3 className="text-lg font-medium mb-4 dark:text-text-primary light:text-text-light-primary">
                Add a reply
              </h3>
              <form onSubmit={handleSendReply} className="space-y-4">
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your message here..."
                  rows={6}
                  className="w-full px-4 py-3 rounded-linear border dark:bg-linear-bg light:bg-linear-light-bg dark:border-linear-border light:border-linear-light-border dark:text-text-primary light:text-text-light-primary focus:outline-none focus:border-linear-accent resize-none"
                />
                <button
                  type="submit"
                  disabled={sending || !replyMessage.trim()}
                  className="flex items-center gap-2 px-6 py-3 dark:bg-linear-accent light:bg-linear-light-accent dark:text-linear-bg light:text-linear-light-bg rounded-linear font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  {sending ? 'Sending...' : 'Send Reply'}
                </button>
              </form>
            </div>
          )}
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

  if (showContactForm === 'sales') {
    return <SalesForm onBack={() => setShowContactForm(null)} />;
  }

  if (showContactForm === 'support') {
    return <SupportForm onBack={() => setShowContactForm(null)} onSuccess={loadTickets} />;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-medium mb-4 dark:text-text-primary light:text-text-light-primary">
          How can we help?
        </h1>
        <p className="text-xl dark:text-text-secondary light:text-text-light-secondary">
          Get in touch with our sales and support teams for demos, onboarding support, or product questions.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-16">
        <button
          onClick={() => setShowContactForm('sales')}
          className="group dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-10 text-left hover:border-linear-accent transition-all"
        >
          <Mail className="w-8 h-8 mb-6 dark:text-text-primary light:text-text-light-primary" />
          <h3 className="text-2xl font-medium mb-3 dark:text-text-primary light:text-text-light-primary">
            Sales
          </h3>
          <p className="text-lg dark:text-text-secondary light:text-text-light-secondary mb-6">
            Speak to our sales team about plans, pricing, enterprise contracts, or request a demo.
          </p>
          <div className="flex items-center gap-2 dark:text-text-primary light:text-text-light-primary group-hover:gap-3 transition-all">
            <span className="font-medium">Talk to sales</span>
            <ChevronRight className="w-5 h-5" />
          </div>
        </button>

        <button
          onClick={() => setShowContactForm('support')}
          className="group dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-10 text-left hover:border-linear-accent transition-all"
        >
          <MessageCircle className="w-8 h-8 mb-6 dark:text-text-primary light:text-text-light-primary" />
          <h3 className="text-2xl font-medium mb-3 dark:text-text-primary light:text-text-light-primary">
            Help & support
          </h3>
          <p className="text-lg dark:text-text-secondary light:text-text-light-secondary mb-6">
            Ask product questions, report problems, or leave feedback.
          </p>
          <div className="flex items-center gap-2 dark:text-text-primary light:text-text-light-primary group-hover:gap-3 transition-all">
            <span className="font-medium">Contact support</span>
            <ChevronRight className="w-5 h-5" />
          </div>
        </button>
      </div>

      {tickets.length > 0 && (
        <div>
          <h2 className="text-2xl font-medium mb-6 dark:text-text-primary light:text-text-light-primary">
            Your support tickets
          </h2>
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="w-full dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-6 text-left hover:border-linear-accent transition-colors"
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
                        {ticket.priority}
                      </span>
                    </div>
                    <h3 className="text-lg font-medium dark:text-text-primary light:text-text-light-primary mb-2">
                      {ticket.subject}
                    </h3>
                    <p className="text-sm dark:text-text-secondary light:text-text-light-secondary line-clamp-2">
                      {ticket.message}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 dark:text-text-tertiary light:text-text-light-tertiary flex-shrink-0 ml-4" />
                </div>
                <div className="flex items-center gap-4 text-sm dark:text-text-tertiary light:text-text-light-tertiary">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </div>
                  <span>Updated {new Date(ticket.updated_at).toLocaleDateString()}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SalesForm({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    companySize: '1-20',
    requirements: '',
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      setProfile(data);
      setFormData(prev => ({
        ...prev,
        fullName: data.full_name || '',
        email: data.email || user.email || '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.fullName || !formData.email) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const { data: workspaceData } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      const { error } = await supabase.from('support_tickets').insert({
        user_id: user.id,
        workspace_id: workspaceData?.id || null,
        subject: `Sales inquiry from ${formData.fullName} (${formData.companySize})`,
        message: formData.requirements,
        priority: 'high',
        category: 'general',
        status: 'open',
        user_email: formData.email,
        user_name: formData.fullName,
        metadata: {
          type: 'sales',
          company_size: formData.companySize,
        },
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Thank you! Our sales team will contact you shortly.' });
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (error) {
      console.error('Error creating sales inquiry:', error);
      setMessage({ type: 'error', text: 'Failed to send message. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <button
        onClick={onBack}
        className="mb-6 text-sm dark:text-text-secondary light:text-text-light-secondary hover:text-linear-accent"
      >
        ← Back
      </button>

      <div className="grid lg:grid-cols-2 gap-12">
        <div>
          <h1 className="text-4xl font-medium mb-6 dark:text-text-primary light:text-text-light-primary">
            Contact sales
          </h1>

          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 mt-0.5 dark:text-text-primary light:text-text-light-primary" />
              <span className="text-lg dark:text-text-primary light:text-text-light-primary">Request a demo</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 mt-0.5 dark:text-text-primary light:text-text-light-primary" />
              <span className="text-lg dark:text-text-primary light:text-text-light-primary">Learn which plan is right for your team</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 mt-0.5 dark:text-text-primary light:text-text-light-primary" />
              <span className="text-lg dark:text-text-primary light:text-text-light-primary">Get onboarding help</span>
            </div>
          </div>

          <div className="border-t dark:border-linear-border-subtle light:border-linear-light-border-subtle pt-6">
            <p className="dark:text-text-secondary light:text-text-light-secondary mb-2">
              Technical issues or product questions?
            </p>
            <button
              onClick={onBack}
              className="text-sm dark:text-text-primary light:text-text-light-primary hover:text-linear-accent flex items-center gap-1"
            >
              Contact support
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div>
          <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-8">
            <h2 className="text-xl font-medium mb-6 dark:text-text-primary light:text-text-light-primary">
              Tell us how we can help
            </h2>

            {message && (
              <div className={`mb-6 p-4 rounded-linear border flex items-center gap-3 ${
                message.type === 'success'
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm mb-2 dark:text-text-secondary light:text-text-light-secondary">
                  Full name
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-3 rounded-linear border dark:bg-linear-bg light:bg-linear-light-bg dark:border-linear-border light:border-linear-light-border dark:text-text-primary light:text-text-light-primary focus:outline-none focus:border-linear-accent"
                  placeholder="Kevin Flynn"
                />
              </div>

              <div>
                <label className="block text-sm mb-2 dark:text-text-secondary light:text-text-light-secondary">
                  Work email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-linear border dark:bg-linear-bg light:bg-linear-light-bg dark:border-linear-border light:border-linear-light-border dark:text-text-primary light:text-text-light-primary focus:outline-none focus:border-linear-accent"
                  placeholder="kevin@encom.com"
                />
              </div>

              <div>
                <label className="block text-sm mb-2 dark:text-text-secondary light:text-text-light-secondary">
                  Company size
                </label>
                <select
                  value={formData.companySize}
                  onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                  className="w-full px-4 py-3 rounded-linear border dark:bg-linear-bg light:bg-linear-light-bg dark:border-linear-border light:border-linear-light-border dark:text-text-primary light:text-text-light-primary focus:outline-none focus:border-linear-accent"
                >
                  <option value="1-20">1-20</option>
                  <option value="21-50">21-50</option>
                  <option value="51-200">51-200</option>
                  <option value="201-500">201-500</option>
                  <option value="501+">501+</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-2 dark:text-text-secondary light:text-text-light-secondary">
                  Tell us about your requirements
                </label>
                <textarea
                  required
                  rows={6}
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  className="w-full px-4 py-3 rounded-linear border dark:bg-linear-bg light:bg-linear-light-bg dark:border-linear-border light:border-linear-light-border dark:text-text-primary light:text-text-light-primary focus:outline-none focus:border-linear-accent resize-none"
                  placeholder="I'm interested in NUUM for my team..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 dark:bg-linear-accent light:bg-linear-light-accent dark:text-linear-bg light:text-linear-light-bg rounded-linear font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Sending...' : 'Send message'}
              </button>

              <p className="text-sm text-center dark:text-text-tertiary light:text-text-light-tertiary">
                You can also email us at <span className="dark:text-text-primary light:text-text-light-primary">sales@nuum.com</span>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function SupportForm({ onBack, onSuccess }: { onBack: () => void; onSuccess: () => void }) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      setProfile(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.subject || !formData.message) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const { data: workspaceData } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      const { data: ticketData, error } = await supabase.from('support_tickets').insert({
        user_id: user.id,
        workspace_id: workspaceData?.id || null,
        subject: formData.subject,
        message: formData.message,
        priority: 'medium',
        category: 'general',
        status: 'open',
        user_email: profile?.email || user.email || '',
        user_name: profile?.full_name || 'User',
      }).select().single();

      if (error) throw error;

      fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auto-reply-ticket`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'INSERT',
            table: 'support_tickets',
            record: {
              id: ticketData.id,
              subject: formData.subject,
              message: formData.message,
              user_name: profile?.full_name || 'User',
              user_email: profile?.email || user.email || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            schema: 'public',
            old_record: null,
          }),
        }
      ).then(async (response) => {
        if (response.ok) {
          console.log('✅ Auto-reply triggered successfully');
        } else {
          const errorText = await response.text();
          console.error('❌ Auto-reply error:', errorText);
        }
      }).catch((error) => {
        console.error('❌ Error calling auto-reply:', error);
      });

      setMessage({ type: 'success', text: 'Support ticket created successfully! Our AI assistant is preparing a response for you.' });
      setFormData({ subject: '', message: '' });
      onSuccess();
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (error) {
      console.error('Error creating ticket:', error);
      setMessage({ type: 'error', text: 'Failed to create ticket. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <button
        onClick={onBack}
        className="mb-6 text-sm dark:text-text-secondary light:text-text-light-secondary hover:text-linear-accent"
      >
        ← Back
      </button>

      <div className="grid lg:grid-cols-2 gap-12">
        <div>
          <h1 className="text-4xl font-medium mb-6 dark:text-text-primary light:text-text-light-primary">
            Contact support
          </h1>

          <p className="text-lg dark:text-text-secondary light:text-text-light-secondary mb-8">
            We are here to help. Ask product questions, report problems, or leave feedback.
          </p>

          <div className="flex items-start gap-3 mb-8 p-4 rounded-linear dark:bg-blue-500/10 light:bg-blue-500/10 border border-blue-500/20">
            <CheckCircle className="w-5 h-5 mt-0.5 text-blue-400" />
            <div>
              <p className="text-blue-400 font-medium mb-1">All systems operational</p>
              <p className="text-sm dark:text-text-secondary light:text-text-light-secondary">
                Our services are running smoothly
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="border-t dark:border-linear-border-subtle light:border-linear-light-border-subtle pt-6">
              <p className="dark:text-text-secondary light:text-text-light-secondary mb-2">
                Questions about our plans, pricing, or request a demo?
              </p>
              <button
                onClick={onBack}
                className="text-sm dark:text-text-primary light:text-text-light-primary hover:text-linear-accent flex items-center gap-1"
              >
                Talk to sales
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="border-t dark:border-linear-border-subtle light:border-linear-light-border-subtle pt-6">
              <p className="dark:text-text-secondary light:text-text-light-secondary mb-2">
                Get an overview of NUUM's features, integrations, and how to use them.
              </p>
              <a
                href="https://docs.nuum.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm dark:text-text-primary light:text-text-light-primary hover:text-linear-accent flex items-center gap-1"
              >
                Visit Docs
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div>
          <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-medium dark:text-text-primary light:text-text-light-primary mb-2">
                Get in touch
              </h2>
              <p className="text-sm dark:text-text-secondary light:text-text-light-secondary">
                We're here to help with any questions you may have
              </p>
            </div>

            {message && (
              <div className={`mb-6 p-4 rounded-linear border flex items-center gap-3 ${
                message.type === 'success'
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm mb-2 dark:text-text-secondary light:text-text-light-secondary">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 rounded-linear border dark:bg-linear-bg light:bg-linear-light-bg dark:border-linear-border light:border-linear-light-border dark:text-text-primary light:text-text-light-primary focus:outline-none focus:border-linear-accent"
                  placeholder="Brief description of your issue"
                />
              </div>

              <div>
                <label className="block text-sm mb-2 dark:text-text-secondary light:text-text-light-secondary">
                  Message
                </label>
                <textarea
                  required
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-linear border dark:bg-linear-bg light:bg-linear-light-bg dark:border-linear-border light:border-linear-light-border dark:text-text-primary light:text-text-light-primary focus:outline-none focus:border-linear-accent resize-none"
                  placeholder="Please describe your question or issue in detail..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !formData.subject || !formData.message}
                className="w-full px-6 py-3 dark:bg-linear-accent light:bg-linear-light-accent dark:text-linear-bg light:text-linear-light-bg rounded-linear font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Sending...' : 'Send message'}
              </button>

              <p className="text-sm text-center dark:text-text-tertiary light:text-text-light-tertiary">
                or email us at <span className="dark:text-text-primary light:text-text-light-primary">support@nuum.com</span>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
