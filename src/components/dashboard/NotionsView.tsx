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
    tags: [] as string[], // gebruikt als "Attendees"
  });
  const [tagInput, setTagInput] = useState('');
  const [savingNewNote, setSavingNewNote] = useState(false);

  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const todayIso = new Date().toISOString();

  useEffect(() => {
    loadNotes();
  }, [workspace.id]);

  useEffect(() => {
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
    return newNote.title.trim() !== '' || newNote.content.trim() !== '';
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
        tags: newNote.tags, // opgeslagen als attendees
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
    const trimmedTag = tag.trim();
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
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getTagClasses = () =>
    'text-xs px-2 py-1 rounded-full border border-nuum-border bg-nuum-background text-nuum-text-secondary';

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
            Capture meetings, thoughts and action points for your workspace
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
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
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
              placeholder="Meeting notes, campaign ideas, to-do…"
            />
          </div>

          {/* Datum */}
          <div className="hidden md:flex flex-col items-end text-xs text-nuum-text-secondary mt-6 md:mt-5">
            <span className="uppercase tracking-wide text-[10px] text-nuum-text-secondary/70">
              Datum
            </span>
            <span className="mt-0.5 font-medium">
              {formatDate(todayIso)}
            </span>
          </div>
        </div>

        <div className="md:hidden text-xs text-nuum-text-secondary">
          <span className="uppercase tracking-wide text-[10px] text-nuum-text-secondary/70">
            Datum
          </span>
          <span className="ml-2 font-medium">{formatDate(todayIso)}</span>
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
            placeholder="Type your notes here…"
          />
        </div>

        {/* Attendees (was tags) */}
        <div>
          <label className="block text-xs font-medium mb-1.5 text-nuum-text-secondary">
            Attendees
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {newNote.tags.map((attendee) => (
              <span
                key={attendee}
                className={`${getTagClasses()} flex items-center gap-1`}
              >
                {attendee}
                <button
                  type="button"
                  onClick={() => removeTag(attendee)}
                  className="hover:text-nuum-text-primary"
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
            placeholder="Type a name and press Enter to add attendees…"
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
            placeholder="Search notes…"
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
            All attendees
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
              ? 'No notes match your filters.'
              : 'Start typing above to create your first note and add attendees.'}
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
              <div className="flex items-center justify-between mb-2 text-xs text-nuum-text-tertiary">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(note.created_at)}</span>
                </span>
                <span>{note.author || 'Unknown'}</span>
              </div>

              <h3 className="text-base font-medium text-nuum-text-primary line-clamp-1 mb-2 group-hover:text-nuum-accent-blue">
                {note.title}
              </h3>

              <p className="text-sm text-nuum-text-secondary line-clamp-3 mb-3">
                {note.content || 'No content'}
              </p>

              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {note.tags.slice(0, 4).map((attendee, idx) => (
                    <span key={idx} className={getTagClasses()}>
                      {attendee}
                    </span>
                  ))}
                  {note.tags.length > 4 && (
                    <span className="text-xs text-nuum-text-tertiary">
                      +{note.tags.length - 4} more
                    </span>
                  )}
                </div>
              )}
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
                <div className="flex items-center justify-between text-xs text-nuum-text-tertiary">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5" />
                    <span>Created by {selectedNote.author || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Datum {formatDate(selectedNote.created_at)}</span>
                  </div>
                </div>

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
                      Attendees
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedNote.tags.map((attendee, idx) => (
                        <span key={idx} className={getTagClasses()}>
                          {attendee}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedNote.updated_at && (
                  <div className="flex items-center gap-2 text-xs text-nuum-text-tertiary pt-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Updated on {formatDate(selectedNote.updated_at)}</span>
                  </div>
                )}

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
