import { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, Target, Users, FileText, Folder, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useDebounce } from '../../utils/performance';

interface SearchResult {
  id: string;
  type: 'campaign' | 'creator' | 'content' | 'task' | 'note';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  data: any;
}

interface GlobalSearchProps {
  workspaceId: string;
  onResultClick?: (result: SearchResult) => void;
}

export function GlobalSearch({ workspaceId, onResultClick }: GlobalSearchProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      performSearch(debouncedQuery);
    } else {
      setResults([]);
    }
  }, [debouncedQuery, filters, workspaceId]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    const allResults: SearchResult[] = [];
    const lowerQuery = searchQuery.toLowerCase();

    try {
      if (filters.length === 0 || filters.includes('campaigns')) {
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('id, name, status, created_at')
          .eq('workspace_id', workspaceId)
          .ilike('name', `%${searchQuery}%`)
          .limit(5);

        if (campaigns) {
          allResults.push(...campaigns.map(c => ({
            id: c.id,
            type: 'campaign' as const,
            title: c.name,
            subtitle: `Campaign • ${c.status}`,
            icon: <Target className="w-5 h-5 text-blue-400" />,
            data: c
          })));
        }
      }

      if (filters.length === 0 || filters.includes('creators')) {
        const { data: creators } = await supabase
          .from('creators')
          .select('id, name, email, status')
          .eq('workspace_id', workspaceId)
          .or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
          .limit(5);

        if (creators) {
          allResults.push(...creators.map(c => ({
            id: c.id,
            type: 'creator' as const,
            title: c.name,
            subtitle: `Creator • ${c.email || 'No email'}`,
            icon: <Users className="w-5 h-5 text-green-400" />,
            data: c
          })));
        }
      }

      if (filters.length === 0 || filters.includes('content')) {
        const { data: content } = await supabase
          .from('content_media')
          .select('id, title, media_type, creator:creators(name)')
          .eq('workspace_id', workspaceId)
          .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .limit(5);

        if (content) {
          allResults.push(...content.map((c: any) => ({
            id: c.id,
            type: 'content' as const,
            title: c.title,
            subtitle: `${c.media_type} • ${c.creator?.name || 'Unknown creator'}`,
            icon: <Folder className="w-5 h-5 text-purple-400" />,
            data: c
          })));
        }
      }

      if (filters.length === 0 || filters.includes('tasks')) {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id, title, status, due_date')
          .eq('workspace_id', workspaceId)
          .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .limit(5);

        if (tasks) {
          allResults.push(...tasks.map(t => ({
            id: t.id,
            type: 'task' as const,
            title: t.title,
            subtitle: `Task • ${t.status}`,
            icon: <Clock className="w-5 h-5 text-orange-400" />,
            data: t
          })));
        }
      }

      if (filters.length === 0 || filters.includes('notes')) {
        const { data: notes } = await supabase
          .from('notes')
          .select('id, title, content, tags')
          .eq('workspace_id', workspaceId)
          .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
          .limit(5);

        if (notes) {
          allResults.push(...notes.map(n => ({
            id: n.id,
            type: 'note' as const,
            title: n.title,
            subtitle: 'Note',
            icon: <FileText className="w-5 h-5 text-yellow-400" />,
            data: n
          })));
        }
      }

      setResults(allResults);
    } catch (error) {
      console.error('Search error:', error);
    }

    setLoading(false);
  };

  const toggleFilter = (filter: string) => {
    setFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const handleResultClick = (result: SearchResult) => {
    onResultClick?.(result);
    setIsOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 dark:text-text-tertiary light:text-text-light-tertiary" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search campaigns, creators, content, tasks..."
          className="w-full pl-10 pr-20 py-2.5 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded-linear linear-transition ${
              filters.length > 0
                ? 'bg-linear-accent text-black'
                : 'dark:text-text-tertiary light:text-text-light-tertiary hover:dark:bg-linear-bg-subtle hover:light:bg-linear-light-bg-subtle'
            }`}
            title="Filter results"
          >
            <Filter className="w-4 h-4" />
          </button>
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
              }}
              className="p-1.5 dark:text-text-tertiary light:text-text-light-tertiary hover:dark:bg-linear-bg-subtle hover:light:bg-linear-light-bg-subtle rounded-linear linear-transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border light:border-linear-light-border rounded-linear-lg shadow-lg z-50">
          <div className="flex flex-wrap gap-2">
            {['campaigns', 'creators', 'content', 'tasks', 'notes'].map(filter => (
              <button
                key={filter}
                onClick={() => toggleFilter(filter)}
                className={`px-3 py-1.5 text-sm rounded-linear border linear-transition ${
                  filters.includes(filter)
                    ? 'dark:bg-linear-accent/10 light:bg-linear-light-accent/10 border-linear-accent'
                    : 'dark:bg-linear-bg light:bg-linear-light-bg dark:border-linear-border-subtle light:border-linear-light-border hover:dark:border-linear-border hover:light:border-linear-light-border'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
            {filters.length > 0 && (
              <button
                onClick={() => setFilters([])}
                className="px-3 py-1.5 text-sm text-linear-error hover:bg-linear-error/10 rounded-linear linear-transition"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      )}

      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border light:border-linear-light-border rounded-linear-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center dark:text-text-secondary light:text-text-light-secondary">
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center">
              <Search className="w-12 h-12 mx-auto mb-3 dark:text-text-tertiary light:text-text-light-tertiary opacity-50" />
              <p className="dark:text-text-secondary light:text-text-light-secondary">
                No results found for "{query}"
              </p>
            </div>
          ) : (
            <div className="py-2">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:dark:bg-linear-bg-subtle hover:light:bg-linear-light-bg-subtle linear-transition text-left"
                >
                  <div className="flex-shrink-0">{result.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{result.title}</div>
                    {result.subtitle && (
                      <div className="text-sm dark:text-text-secondary light:text-text-light-secondary truncate">
                        {result.subtitle}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
