import { useState, useEffect, useRef } from 'react';
import { Search, X, Trash2, Tag as TagIcon, Calendar, User, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useWritePermission } from '../../hooks/useWritePermission';
import type { Database } from '../../lib/database.types';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type Note = Database['public']['Tables']['notes']['Row'];

interface NotionsViewProps {
  workspace: Workspace;
}

export function NotionsView({ workspace }: NotionsViewProps) {
  const { user } = useAuth();
  const { checkWritePermission } = useWritePermission();

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');
  const [savingNewNote, setSavingNewNote] = useState(false);

  const titleInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadNotes();
  }, [workspace.id]);

  useEffect(() => {
    // autofocus op titel als je Notes opent
    if (titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, []);

  const loadNotes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading notes:', error);
    } else {
      setNotes(data || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setNewNote({ title: '', content: '', tags: [] });
    setTagInput('');
    if (titleInputRef.current) {
      titleInputRef.current.focus();
    }
  };

  const validateNewNote = () => {
    return (newNote.title.trim() !== '' || newNote.content.trim() !== '');
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!validateNewNote()) return;

    if (!checkWritePermission('create notes')) {
      return;
    }

    setSavingNewNote(true);

    try {
      const { error } = await supabase.from('notes').insert({
        workspace_id: workspace.id,
        title: newNote.title.trim() || 'Untitled Note',
        content: newNote.content,
        tags: newNote.tags,
        created_by: user.id,
      });

      if (error) {
        console.error('Error creating note:', error);
      } else {
        resetForm();
        loadNotes();
      }
    } finally {
      setSavingNewNote(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!selectedNote) return;

    if (!checkWritePermission('delete notes')) {
      return;
    }

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', selectedNote.id);

    if (error) {
      console.error('Error deleting note:', error);
    } else {
      setShowDetailDrawer(false);
      setSelectedNote(null);
      loadNotes();
    }
  };

  const openNoteDetail = (note: Note) => {
    setSelectedNote(note);
    setShowDetailDrawer(true);
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !newNote.tags.includes(trimmedTag)) {
      setNewNote({ ...newNote, tags: [...newNote.tags, trimmedTag] });
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setNewNote({
      ...newNote,
      tags: newNote.tags.filter((t) => t !== tagToRemove),
    });
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const allTags = Array.from(
    new Set(notes.flatMap((note) => note.tags || []))
  ).sort();

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag =
      selectedTag === 'all' ||
      (note.tags && note.tags.includes(selectedTag));

    return matchesSearch && matchesTag;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTagColor = (tag: string) => {
    const colors: Record<string, string> = {
      campaign: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      meeting: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
      idea: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
    };
    return (
      colors[tag.toLowerCase()] ||
      'text-gray-300 bg-gray-500/10 border-gray-500/30'
    );
  };

  if (loading) {
    return (
      <div className="text-nuum-text-secondary">
        Loading notes...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-nuum-text-primary mb-1">
            Notes
          </h2>
          <p className="text-sm md:text-base text-nuum-text-secondary">
            Capture insights and ideas for your workspace
          </p>
        </div>

        <button
          type="button"
          onClick={resetForm}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-nuum-border bg-nuum-surface hover:bg-nuum-border text-nuum-text-secondary hover:text-nuum-text-primary text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          New empty note
        </button>
      </div>

      {/* Inline editor */}
      <form
        onSubmit={handleCreateNote}
        className="bg-nuum-surface border border-nuum-border rounded-xl p-4 md:p-5 space-y-4 shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
      >
        <div>
          <label className="block text-xs font-medium mb-1.5 text-nuum-text-secondary">
            Title
          </label>
          <input
            ref={titleInputRef}
            type="text"
            value={newNote.title}
            onChange={(e) =>
              setNewNote({ ...newNote, title: e.target.value })
            }
            className="w-full px-3 py-2 bg-nuum-background border border-nuum-border rounded-lg text-sm text-nuum-text-primary placeholder:text-nuum-text-secondary/60 focus:outline-none focus:border-nuum-accent-blue"
            placeholder="Give your note a title..."
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5 text-nuum-text-secondary">
            Content
          </label>
          <textarea
            value={newNote.content}
            onChange={(e) =>
              setNewNote({ ...newNote, content: e.target.value })
            }
            className="w-full px-3 py-2 bg-nuum-background border border-nuum-border rounded-lg text-sm text-nuum-text-primary placeholder:text-nuum-text-secondary/60 focus:outline-none focus:border-nuum-accent-blue resize-none min-h-[160px]"
            placeholder="Start typing immediately..."
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5 text-nuum-text-secondary">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {newNote.tags.map((tag) => (
              <span
                key={tag}
                className={`text-xs px-2 py-1 rounded-full border flex items-center gap-1 ${getTagColor(
                  tag
                )}`}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
            onBlur={() => tagInput && addTag(tagInput)}
            className="w-full px-3 py-2 bg-nuum-background border border-nuum-border rounded-lg text-sm text-nuum-text-primary placeholder:text-nuum-text-secondary/60 focus:outline-none focus:border-nuum-accent-blue"
            placeholder="Type and press Enter to add tags..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={resetForm}
            disabled={savingNewNote}
            className="px-4 py-2 rounded-lg text-sm text-nuum-text-secondary hover:text-nuum-text-primary bg-nuum-background border border-nuum-border hover:border-nuum-accent-blue transition-colors"
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={savingNewNote || !validateNewNote()}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-nuum-accent-blue hover:bg-[#2f4fae] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {savingNewNote ? 'Saving…' : 'Save note'}
          </button>
        </div>
      </form>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-nuum-text-secondary" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-nuum-surface border border-nuum-border rounded-lg text-sm text-nuum-text-primary placeholder:text-nuum-text-secondary/70 focus:outline-none focus:border-nuum-accent-blue"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedTag('all')}
            className={`px-3 py-1.5 rounded-full text-xs md:text-sm whitespace-nowrap border transition-colors ${
              selectedTag === 'all'
                ? 'bg-white text-black border-white'
                : 'bg-nuum-surface text-nuum-text-secondary border-nuum-border hover:border-nuum-accent-blue/70'
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-full text-xs md:text-sm whitespace-nowrap border transition-colors ${
                selectedTag === tag
                  ? 'bg-white text-black border-white'
                  : 'bg-nuum-surface text-nuum-text-secondary border-nuum-border hover:border-nuum-accent-blue/70'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Notes list */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-16 bg-nuum-surface border border-nuum-border rounded-xl">
          <TagIcon className="w-10 h-10 text-nuum-text-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-nuum-text-primary mb-2">
            No notes yet
          </h3>
          <p className="text-nuum-text-secondary max-w-md mx-auto">
            {searchQuery || selectedTag !== 'all'
              ? 'No notes match your filters'
              : 'Start typing above to create your first note.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredNotes.map((note) => (
            <button
              key={note.id}
              type="button"
              onClick={() => openNoteDetail(note)}
              className="text-left bg-nuum-surface border border-nuum-border hover:border-nuum-accent-blue/80 rounded-xl p-4 cursor-pointer transition-colors group"
            >
              <h3 className="text-base font-medium text-nuum-text-primary line-clamp-1 mb-2 group-hover:text-nuum-accent-blue">
                {note.title}
              </h3>
              <p className="text-sm text-nuum-text-secondary line-clamp-3 mb-3">
                {note.content || 'No content'}
              </p>

              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {note.tags.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className={`text-xs px-2 py-1 rounded-full border ${getTagColor(
                        tag
                      )}`}
                    >
                      {tag}
                    </span>
                  ))}
                  {note.tags.length > 3 && (
                    <span className="text-xs text-nuum-text-tertiary">
                      +{note.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center text-xs text-nuum-text-tertiary">
                <span>{note.author || 'Unknown'}</span>
                <span>{formatDate(note.created_at)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail drawer */}
      {showDetailDrawer && selectedNote && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex justify-end"
          onClick={() => setShowDetailDrawer(false)}
        >
          <div
            className="w-full max-w-lg bg-nuum-surface border-l border-nuum-border h-full overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-nuum-text-primary">
                  Note Details
                </h3>
                <button
                  onClick={() => setShowDetailDrawer(false)}
                  className="p-2 rounded-lg hover:bg-nuum-background text-nuum-text-secondary hover:text-nuum-text-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-nuum-text-primary mb-3">
                    {selectedNote.title}
                  </h2>
                  <p className="text-sm text-nuum-text-secondary whitespace-pre-line leading-relaxed">
                    {selectedNote.content || 'No content'}
                  </p>
                </div>

                {selectedNote.tags && selectedNote.tags.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-nuum-text-secondary">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedNote.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className={`text-xs px-2 py-1 rounded-full border ${getTagColor(
                            tag
                          )}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2 text-xs text-nuum-text-tertiary pt-4 border-t border-nuum-border">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5" />
                    <span>
                      Created by {selectedNote.author || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      Created on {formatDate(selectedNote.created_at)}
                    </span>
                  </div>
                  {selectedNote.updated_at && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        Updated on {formatDate(selectedNote.updated_at)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleDeleteNote}
                    className="w-full px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Note
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
