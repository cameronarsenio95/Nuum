import { useState, useEffect } from 'react';
import { Plus, Search, X, Trash2, Tag as TagIcon, Calendar, User } from 'lucide-react';
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
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    loadNotes();
  }, [workspace.id]);

  const loadNotes = async () => {
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

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!checkWritePermission('create notes')) {
      setShowNewNoteModal(false);
      return;
    }

    const { error } = await supabase.from('notes').insert({
      workspace_id: workspace.id,
      title: newNote.title || 'Untitled Note',
      content: newNote.content,
      tags: newNote.tags,
      created_by: user.id,
    });

    if (error) {
      console.error('Error creating note:', error);
    } else {
      setShowNewNoteModal(false);
      resetForm();
      loadNotes();
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

  const resetForm = () => {
    setNewNote({ title: '', content: '', tags: [] });
    setTagInput('');
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !newNote.tags.includes(trimmedTag)) {
      setNewNote({ ...newNote, tags: [...newNote.tags, trimmedTag] });
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setNewNote({ ...newNote, tags: newNote.tags.filter(t => t !== tagToRemove) });
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const allTags = Array.from(
    new Set(notes.flatMap(note => note.tags || []))
  ).sort();

  const filteredNotes = notes.filter(note => {
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
      campaign: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
      meeting: 'text-green-400 bg-green-400/10 border-green-400/20',
      idea: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    };
    return colors[tag.toLowerCase()] || 'text-gray-400 bg-gray-400/10 border-gray-400/20';
  };

  if (loading) {
    return <div className="text-text-secondary">Loading notes...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-medium mb-2">Notes</h2>
          <p className="text-sm md:text-base text-text-secondary">
            Capture insights and ideas for your workspace
          </p>
        </div>
        <button
          onClick={() => setShowNewNoteModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          New Note
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-linear-bg-secondary border border-linear-border-subtle rounded-linear focus:outline-none focus:border-linear-accent text-sm"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedTag('all')}
            className={`px-3 py-1.5 rounded-linear text-sm whitespace-nowrap linear-transition ${
              selectedTag === 'all'
                ? 'bg-white text-black'
                : 'bg-linear-bg-secondary text-text-secondary hover:bg-linear-bg-subtle border border-linear-border-subtle'
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-linear text-sm whitespace-nowrap linear-transition ${
                selectedTag === tag
                  ? 'bg-white text-black'
                  : 'bg-linear-bg-secondary text-text-secondary hover:bg-linear-bg-subtle border border-linear-border-subtle'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {filteredNotes.length === 0 ? (
        <div className="text-center py-20 bg-linear-bg-secondary border border-linear-border-subtle rounded-linear-lg">
          <TagIcon className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No notes yet</h3>
          <p className="text-text-secondary mb-6">
            {searchQuery || selectedTag !== 'all'
              ? 'No notes match your filters'
              : 'Create your first note to start capturing ideas'}
          </p>
          {!searchQuery && selectedTag === 'all' && (
            <button
              onClick={() => setShowNewNoteModal(true)}
              className="px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition"
            >
              Create Note
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => openNoteDetail(note)}
              className="bg-linear-bg-secondary border border-linear-border-subtle hover:border-linear-border rounded-linear-lg p-4 cursor-pointer linear-transition group"
            >
              <h3 className="text-base font-medium text-white line-clamp-1 mb-2 group-hover:text-linear-accent linear-transition">
                {note.title}
              </h3>
              <p className="text-sm text-text-secondary line-clamp-3 mb-3">
                {note.content || 'No content'}
              </p>

              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {note.tags.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className={`text-xs px-2 py-1 rounded-full border ${getTagColor(tag)}`}
                    >
                      {tag}
                    </span>
                  ))}
                  {note.tags.length > 3 && (
                    <span className="text-xs text-text-tertiary">
                      +{note.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center text-xs text-text-tertiary">
                <span>{note.author || 'Unknown'}</span>
                <span>{formatDate(note.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNewNoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-linear-bg-secondary border border-linear-border rounded-linear-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium">New Note</h3>
              <button
                onClick={() => { setShowNewNoteModal(false); resetForm(); }}
                className="p-1 hover:bg-linear-bg-subtle rounded-linear"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  className="w-full px-4 py-2 bg-linear-bg border border-linear-border rounded-linear focus:outline-none focus:border-linear-accent"
                  placeholder="Enter note title..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  className="w-full px-4 py-2 bg-linear-bg border border-linear-border rounded-linear focus:outline-none focus:border-linear-accent h-48 resize-none"
                  placeholder="Write your note here..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {newNote.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`text-xs px-2 py-1 rounded-full border flex items-center gap-1 ${getTagColor(tag)}`}
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
                  className="w-full px-4 py-2 bg-linear-bg border border-linear-border rounded-linear focus:outline-none focus:border-linear-accent text-sm"
                  placeholder="Type and press Enter to add tags..."
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowNewNoteModal(false); resetForm(); }}
                  className="flex-1 px-4 py-2 bg-linear-bg-subtle hover:bg-linear-border-subtle rounded-linear linear-transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailDrawer && selectedNote && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex justify-end"
          onClick={() => setShowDetailDrawer(false)}
        >
          <div
            className="w-full max-w-lg bg-linear-bg-secondary border-l border-linear-border h-full overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-medium">Note Details</h3>
                <button
                  onClick={() => setShowDetailDrawer(false)}
                  className="p-2 hover:bg-linear-bg-subtle rounded-linear linear-transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-4">
                    {selectedNote.title}
                  </h2>
                  <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">
                    {selectedNote.content || 'No content'}
                  </p>
                </div>

                {selectedNote.tags && selectedNote.tags.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedNote.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className={`text-xs px-2 py-1 rounded-full border ${getTagColor(tag)}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2 text-xs text-text-tertiary pt-4 border-t border-linear-border">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5" />
                    <span>Created by {selectedNote.author || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Created on {formatDate(selectedNote.created_at)}</span>
                  </div>
                  {selectedNote.updated_at && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Updated on {formatDate(selectedNote.updated_at)}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleDeleteNote}
                    className="w-full px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-linear linear-transition flex items-center justify-center gap-2"
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
