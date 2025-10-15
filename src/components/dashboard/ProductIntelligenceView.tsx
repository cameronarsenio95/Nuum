import { useState, useEffect } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Check, X, Clock, AlertCircle, TrendingUp, Smartphone, MessageSquare, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Workspace = Database['public']['Tables']['workspaces']['Row'];

interface Suggestion {
  id: string;
  title: string;
  description: string;
  ai_reasoning: string;
  status: string;
  priority: string;
  category: string | null;
  tags: string[];
  related_to: any;
  duplicate_of: string | null;
  created_at: string;
  updated_at: string;
}

interface ProductIntelligenceViewProps {
  workspace: Workspace;
}

export function ProductIntelligenceView({ workspace }: ProductIntelligenceViewProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'in_progress'>('all');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [filterUser, setFilterUser] = useState<string | null>(null);

  useEffect(() => {
    loadSuggestions();
    subscribeToSuggestions();
  }, [workspace.id]);

  const loadSuggestions = async () => {
    const { data, error } = await supabase
      .from('product_intelligence_suggestions')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading suggestions:', error);
    } else {
      setSuggestions(data || []);
    }
    setLoading(false);
  };

  const subscribeToSuggestions = () => {
    const channel = supabase
      .channel('product_intelligence_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_intelligence_suggestions',
          filter: `workspace_id=eq.${workspace.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setSuggestions((prev) => [payload.new as Suggestion, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setSuggestions((prev) =>
              prev.map((s) => (s.id === payload.new.id ? (payload.new as Suggestion) : s))
            );
          } else if (payload.eventType === 'DELETE') {
            setSuggestions((prev) => prev.filter((s) => s.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleAcceptSuggestion = async (suggestionId: string) => {
    const { error } = await supabase
      .from('product_intelligence_suggestions')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', suggestionId);

    if (error) {
      console.error('Error accepting suggestion:', error);
    }
  };

  const handleRejectSuggestion = async (suggestionId: string) => {
    const { error } = await supabase
      .from('product_intelligence_suggestions')
      .update({ status: 'rejected' })
      .eq('id', suggestionId);

    if (error) {
      console.error('Error rejecting suggestion:', error);
    }
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCards(newExpanded);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-linear-error bg-linear-error-subtle border-linear-error-border';
      case 'high':
        return 'text-linear-warning bg-linear-warning-subtle border-linear-warning-border';
      case 'medium':
        return 'text-linear-info bg-linear-info-subtle border-linear-info-border';
      default:
        return 'dark:text-text-tertiary light:text-text-light-tertiary bg-white/5 dark:border-linear-border-subtle light:border-linear-light-border-subtle';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      case 'accepted':
        return <Check className="w-4 h-4" />;
      case 'rejected':
        return <X className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getCategoryIcon = (category: string | null) => {
    switch (category) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'slack':
        return <MessageSquare className="w-4 h-4" />;
      case 'user':
        return <User className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const filteredSuggestions = suggestions.filter((s) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return s.status === 'pending';
    if (activeTab === 'in_progress') return s.status === 'in_progress';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="dark:text-text-secondary light:text-text-light-secondary">Loading suggestions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <div className="w-10 h-10 rounded-linear bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            Product Intelligence
          </h1>
          <p className="dark:text-text-secondary light:text-text-light-secondary">
            Streamline your product development workflows with AI assistance for routine, manual tasks.
          </p>
        </div>
      </div>

      <div className="relative rounded-linear-lg overflow-hidden border dark:border-linear-border-subtle light:border-linear-light-border-subtle bg-white/5 backdrop-blur-sm p-8">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-10 left-10 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        </div>

        <div className="relative">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-pulse" style={{ animationDuration: '3s' }}>
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 animate-bounce" style={{ animationDelay: '0.5s' }} />
              <div className="absolute -bottom-2 -left-2 w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 animate-bounce" style={{ animationDelay: '1s' }} />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-center mb-2">AI-Powered Suggestions</h3>
          <p className="text-center dark:text-text-secondary light:text-text-light-secondary max-w-2xl mx-auto">
            Our AI analyzes your workspace activity, campaigns, and creator feedback to automatically suggest relevant projects and improvements.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-sm font-medium linear-transition relative ${
            activeTab === 'all'
              ? 'dark:text-text-primary light:text-text-light-primary'
              : 'dark:text-text-tertiary light:text-text-light-tertiary hover:dark:text-text-secondary light:text-text-light-secondary'
          }`}
        >
          Suggestions
          {activeTab === 'all' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-accent" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 text-sm font-medium linear-transition relative ${
            activeTab === 'pending'
              ? 'dark:text-text-primary light:text-text-light-primary'
              : 'dark:text-text-tertiary light:text-text-light-tertiary hover:dark:text-text-secondary light:text-text-light-secondary'
          }`}
        >
          Pending
          {activeTab === 'pending' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-accent" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('in_progress')}
          className={`px-4 py-2 text-sm font-medium linear-transition relative ${
            activeTab === 'in_progress'
              ? 'dark:text-text-primary light:text-text-light-primary'
              : 'dark:text-text-tertiary light:text-text-light-tertiary hover:dark:text-text-secondary light:text-text-light-secondary'
          }`}
        >
          In Progress
          {activeTab === 'in_progress' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-accent" />
          )}
        </button>
      </div>

      <div className="space-y-4">
        {filteredSuggestions.length === 0 ? (
          <div className="text-center py-12 dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary rounded-linear-lg border dark:border-linear-border-subtle light:border-linear-light-border-subtle">
            <Sparkles className="w-12 h-12 dark:text-text-tertiary light:text-text-light-tertiary mx-auto mb-4" />
            <p className="dark:text-text-secondary light:text-text-light-secondary">No suggestions yet. Keep working and AI will analyze your patterns.</p>
          </div>
        ) : (
          filteredSuggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary rounded-linear-lg border dark:border-linear-border-subtle light:border-linear-light-border-subtle overflow-hidden hover:dark:border-linear-border light:border-linear-light-border linear-transition animate-slide-up"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-linear flex items-center justify-center ${suggestion.category === 'mobile' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : suggestion.category === 'slack' ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gradient-to-br from-green-500 to-emerald-500'}`}>
                      {getCategoryIcon(suggestion.category)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{suggestion.title}</h3>
                        {suggestion.duplicate_of && (
                          <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                            Duplicate
                          </span>
                        )}
                      </div>
                      <p className="dark:text-text-secondary light:text-text-light-secondary text-sm mb-3">
                        {suggestion.description}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-3 py-1.5 rounded-full border ${getPriorityColor(suggestion.priority)}`}>
                          {suggestion.priority.charAt(0).toUpperCase() + suggestion.priority.slice(1)}
                        </span>
                        <span className={`text-xs px-3 py-1.5 rounded-full border flex items-center gap-1.5 ${
                          suggestion.status === 'in_progress'
                            ? 'text-linear-info bg-linear-info-subtle border-linear-info-border'
                            : suggestion.status === 'accepted'
                            ? 'text-linear-success bg-linear-success-subtle border-linear-success-border'
                            : suggestion.status === 'rejected'
                            ? 'text-linear-error bg-linear-error-subtle border-linear-error-border'
                            : 'dark:text-text-tertiary light:text-text-light-tertiary bg-white/5 dark:border-linear-border-subtle light:border-linear-light-border-subtle'
                        }`}>
                          {getStatusIcon(suggestion.status)}
                          {suggestion.status.charAt(0).toUpperCase() + suggestion.status.slice(1).replace('_', ' ')}
                        </span>
                        {suggestion.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-3 py-1.5 rounded-full bg-white/5 dark:text-text-tertiary light:text-text-light-tertiary border dark:border-linear-border-subtle light:border-linear-light-border-subtle"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {suggestion.status === 'pending' && (
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleAcceptSuggestion(suggestion.id)}
                        className="px-4 py-2 bg-linear-accent hover:bg-linear-accent-hover text-linear-bg rounded-linear text-sm font-medium linear-transition flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectSuggestion(suggestion.id)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-linear text-sm font-medium linear-transition"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => toggleExpanded(suggestion.id)}
                  className="flex items-center gap-2 text-sm dark:text-text-tertiary light:text-text-light-tertiary hover:dark:text-text-primary light:text-text-light-primary linear-transition"
                >
                  {expandedCards.has(suggestion.id) ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Hide reasoning
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Why this project was suggested
                    </>
                  )}
                </button>

                {expandedCards.has(suggestion.id) && (
                  <div className="mt-4 pt-4 border-t dark:border-linear-border-subtle light:border-linear-light-border-subtle animate-slide-up">
                    <p className="dark:text-text-secondary light:text-text-light-secondary text-sm leading-relaxed">
                      {suggestion.ai_reasoning}
                    </p>
                    {suggestion.related_to && Array.isArray(suggestion.related_to) && suggestion.related_to.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">Related to:</p>
                        <div className="flex flex-wrap gap-2">
                          {suggestion.related_to.map((item: any, idx: number) => (
                            <span
                              key={idx}
                              className="text-xs px-3 py-1.5 rounded-full bg-linear-accent/10 text-linear-accent border border-linear-accent/20"
                            >
                              {item.title || item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
