import { useState, useEffect } from 'react';
import { useSupportAuth } from '../contexts/SupportAuthContext';
import { SupportLogin } from './SupportLogin';
import { supabase } from '../lib/supabase';
import { MessageSquare, Clock, CheckCircle, XCircle, Filter, Search, ArrowLeft, Send, User, AlertCircle, Loader2 } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

type Ticket = {
  id: string;
  ticket_number: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  user_name: string;
  user_email: string;
  category: string;
  created_at: string;
  updated_at: string;
  workspace_id: string | null;
};

type TicketMessage = {
  id: string;
  message: string;
  author_name: string;
  author_email: string;
  author_type: 'customer' | 'support' | 'system';
  is_internal: boolean;
  created_at: string;
};

export function SupportDashboard() {
  const { user, supportStaff, loading: authLoading, signOut } = useSupportAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user && supportStaff) {
      loadTickets();
    }
  }, [user, supportStaff, statusFilter]);

  useEffect(() => {
    if (selectedTicket) {
      loadMessages(selectedTicket.id);
    }
  }, [selectedTicket]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('support_ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket || !supportStaff) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('support_ticket_messages')
        .insert({
          ticket_id: selectedTicket.id,
          author_id: user?.id,
          author_name: supportStaff.name,
          author_email: supportStaff.email,
          author_type: 'support',
          message: replyText,
          is_internal: isInternalNote,
        });

      if (error) throw error;

      if (!isInternalNote && selectedTicket.status === 'open') {
        await supabase
          .from('support_tickets')
          .update({ status: 'in_progress' })
          .eq('id', selectedTicket.id);
      }

      setReplyText('');
      setIsInternalNote(false);
      await loadMessages(selectedTicket.id);
      await loadTickets();
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setSending(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status })
        .eq('id', ticketId);

      if (error) throw error;
      await loadTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: status as any });
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-linear-bg light:bg-linear-light-bg">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-linear-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 dark:text-text-secondary light:text-text-light-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !supportStaff) {
    return <SupportLogin />;
  }

  const filteredTickets = tickets.filter(ticket => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        ticket.ticket_number.toLowerCase().includes(query) ||
        ticket.subject.toLowerCase().includes(query) ||
        ticket.user_name.toLowerCase().includes(query) ||
        ticket.user_email.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'in_progress': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'resolved': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'closed': return 'text-gray-600 bg-gray-50 dark:bg-gray-800/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-800/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'high': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'text-gray-600 bg-gray-50 dark:bg-gray-800/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-800/20';
    }
  };

  return (
    <div className="min-h-screen dark:bg-linear-bg light:bg-linear-light-bg">
      <header className="border-b dark:border-linear-border-subtle light:border-linear-light-border dark:bg-linear-bg-elevated light:bg-linear-light-bg-elevated">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold dark:text-text-primary light:text-text-light-primary">
              Support Dashboard
            </h1>
            <span className="text-sm dark:text-text-tertiary light:text-text-light-tertiary">
              {supportStaff.name}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={signOut}
              className="px-4 py-2 text-sm rounded-md border dark:border-linear-border-subtle dark:text-text-secondary dark:hover:bg-linear-bg-hover light:border-linear-light-border light:text-text-light-secondary light:hover:bg-linear-light-bg-hover linear-transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        <div className={`${selectedTicket ? 'hidden lg:block lg:w-96' : 'w-full'} border-r dark:border-linear-border-subtle light:border-linear-light-border overflow-y-auto`}>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-4 gap-2">
              <div className="p-3 rounded-lg dark:bg-linear-bg-elevated light:bg-linear-light-bg-elevated border dark:border-linear-border-subtle light:border-linear-light-border">
                <div className="text-2xl font-semibold dark:text-text-primary light:text-text-light-primary">{stats.total}</div>
                <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Total</div>
              </div>
              <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <div className="text-2xl font-semibold text-yellow-700 dark:text-yellow-400">{stats.open}</div>
                <div className="text-xs text-yellow-600 dark:text-yellow-500">Open</div>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="text-2xl font-semibold text-blue-700 dark:text-blue-400">{stats.inProgress}</div>
                <div className="text-xs text-blue-600 dark:text-blue-500">Active</div>
              </div>
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="text-2xl font-semibold text-green-700 dark:text-green-400">{stats.resolved}</div>
                <div className="text-xs text-green-600 dark:text-green-500">Resolved</div>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border dark:border-linear-border-subtle dark:bg-linear-bg-elevated dark:text-text-primary light:border-linear-light-border light:bg-linear-light-bg light:text-text-light-primary"
              />
            </div>

            <div className="flex gap-2">
              {['all', 'open', 'in_progress', 'resolved', 'closed'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 text-xs rounded-md border linear-transition ${
                    statusFilter === status
                      ? 'dark:bg-linear-accent dark:text-linear-bg dark:border-linear-accent light:bg-linear-light-accent light:text-linear-light-bg light:border-linear-light-accent'
                      : 'dark:border-linear-border-subtle dark:text-text-secondary dark:hover:bg-linear-bg-hover light:border-linear-light-border light:text-text-light-secondary light:hover:bg-linear-light-bg-hover'
                  }`}
                >
                  {status === 'all' ? 'All' : status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 px-4 pb-4">
            {loading ? (
              <div className="text-center py-8 dark:text-text-tertiary light:text-text-light-tertiary">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                Loading tickets...
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-8 dark:text-text-tertiary light:text-text-light-tertiary">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No tickets found
              </div>
            ) : (
              filteredTickets.map(ticket => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`w-full p-4 rounded-lg border text-left linear-transition ${
                    selectedTicket?.id === ticket.id
                      ? 'dark:bg-linear-bg-active dark:border-linear-accent light:bg-linear-light-bg-active light:border-linear-light-accent'
                      : 'dark:bg-linear-bg-elevated dark:border-linear-border-subtle dark:hover:bg-linear-bg-hover light:bg-linear-light-bg-elevated light:border-linear-light-border light:hover:bg-linear-light-bg-hover'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-mono dark:text-text-tertiary light:text-text-light-tertiary">
                      {ticket.ticket_number}
                    </span>
                    <div className="flex gap-1">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-medium dark:text-text-primary light:text-text-light-primary mb-1 line-clamp-1">
                    {ticket.subject}
                  </h3>
                  <p className="text-sm dark:text-text-secondary light:text-text-light-secondary line-clamp-2 mb-2">
                    {ticket.message}
                  </p>
                  <div className="flex items-center gap-2 text-xs dark:text-text-tertiary light:text-text-light-tertiary">
                    <User className="w-3 h-3" />
                    <span>{ticket.user_name}</span>
                    <span>•</span>
                    <Clock className="w-3 h-3" />
                    <span>{new Date(ticket.created_at).toLocaleString()}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className={`${selectedTicket ? 'flex-1' : 'hidden lg:flex lg:flex-1'} flex flex-col`}>
          {selectedTicket ? (
            <>
              <div className="border-b dark:border-linear-border-subtle light:border-linear-light-border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => setSelectedTicket(null)}
                      className="lg:hidden p-2 -ml-2 dark:text-text-secondary dark:hover:bg-linear-bg-hover light:text-text-light-secondary light:hover:bg-linear-light-bg-hover rounded-md"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono dark:text-text-tertiary light:text-text-light-tertiary">
                          {selectedTicket.ticket_number}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                          {selectedTicket.priority}
                        </span>
                      </div>
                      <h2 className="text-lg font-semibold dark:text-text-primary light:text-text-light-primary mb-1">
                        {selectedTicket.subject}
                      </h2>
                      <div className="flex items-center gap-2 text-sm dark:text-text-secondary light:text-text-light-secondary">
                        <User className="w-4 h-4" />
                        <span>{selectedTicket.user_name}</span>
                        <span>({selectedTicket.user_email})</span>
                      </div>
                    </div>
                  </div>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => updateTicketStatus(selectedTicket.id, e.target.value)}
                    className={`px-3 py-1.5 text-sm rounded-md border ${getStatusColor(selectedTicket.status)}`}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="p-4 rounded-lg dark:bg-linear-bg-elevated light:bg-linear-light-bg-elevated border dark:border-linear-border-subtle light:border-linear-light-border">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full dark:bg-linear-bg-hover light:bg-linear-light-bg-hover flex items-center justify-center">
                      <User className="w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium dark:text-text-primary light:text-text-light-primary">
                          {selectedTicket.user_name}
                        </span>
                        <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">
                          {new Date(selectedTicket.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm dark:text-text-secondary light:text-text-light-secondary whitespace-pre-wrap">
                        {selectedTicket.message}
                      </p>
                    </div>
                  </div>
                </div>

                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-lg border ${
                      msg.is_internal
                        ? 'dark:bg-yellow-900/10 dark:border-yellow-800 light:bg-yellow-50 light:border-yellow-200'
                        : msg.author_type === 'support'
                        ? 'dark:bg-blue-900/10 dark:border-blue-800 light:bg-blue-50 light:border-blue-200'
                        : 'dark:bg-linear-bg-elevated dark:border-linear-border-subtle light:bg-linear-light-bg-elevated light:border-linear-light-border'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full dark:bg-linear-bg-hover light:bg-linear-light-bg-hover flex items-center justify-center">
                        <User className="w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium dark:text-text-primary light:text-text-light-primary">
                            {msg.author_name}
                          </span>
                          {msg.is_internal && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400">
                              Internal Note
                            </span>
                          )}
                          <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">
                            {new Date(msg.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm dark:text-text-secondary light:text-text-light-secondary whitespace-pre-wrap">
                          {msg.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t dark:border-linear-border-subtle light:border-linear-light-border p-4">
                <div className="space-y-3">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border dark:border-linear-border-subtle dark:bg-linear-bg-elevated dark:text-text-primary light:border-linear-light-border light:bg-linear-light-bg light:text-text-light-primary resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isInternalNote}
                        onChange={(e) => setIsInternalNote(e.target.checked)}
                        className="rounded"
                      />
                      <span className="dark:text-text-secondary light:text-text-light-secondary">
                        Internal note (not visible to customer)
                      </span>
                    </label>
                    <button
                      onClick={handleSendReply}
                      disabled={!replyText.trim() || sending}
                      className="px-4 py-2 rounded-md dark:bg-linear-accent dark:text-linear-bg dark:hover:bg-linear-accent-hover light:bg-linear-light-accent light:text-linear-light-bg light:hover:bg-linear-light-accent-hover linear-transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Reply
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center dark:text-text-tertiary light:text-text-light-tertiary">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg">Select a ticket to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
