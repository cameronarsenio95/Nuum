import { useState, useEffect } from 'react';
import { FileText, Save, Trash2, Search, Tag, Archive, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Database } from '../../lib/database.types';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type Note = Database['public']['Tables']['notes']['Row'];

interface NotionsViewProps {
  workspace: Workspace;
}

export function NotionsView({ workspace }: NotionsViewProps) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    tags: '',
  });
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  useEffect(() => {
    loadNotes();
  }, [workspace.id, showArchived]);

  useEffect(() => {
    if (notes.length === 0 && !loading && !showArchived) {
      startNewNote();
    }
  }, [notes, loading, showArchived]);

  const loadNotes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('workspace_id', workspace.id)
      .eq('is_archived', showArchived)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading notes:', error);
    } else {
      setNotes(data || []);
    }
    setLoading(false);
  };

  const startNewNote = () => {
    setIsCreatingNew(true);
    setSelectedNote(null);
    setEditForm({
      title: '',
      content: '',
      tags: '',
    });
  };

  const createNewNote = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('notes')
      .insert({
        workspace_id: workspace.id,
        title: editForm.title || 'Untitled Note',
        content: editForm.content,
        tags: editForm.tags ? editForm.tags.split(',').map(t => t.trim()) : [],
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating note:', error);
      alert('Failed to create note');
      return null;
    } else if (data) {
      setNotes([data, ...notes]);
      setSelectedNote(data);
      setIsCreatingNew(false);
      return data;
    }
    return null;
  };

  const saveNote = async () => {
    setSaving(true);

    if (isCreatingNew) {
      const newNote = await createNewNote();
      if (newNote) {
        await loadNotes();
      }
    } else if (selectedNote) {
      const { error } = await supabase
        .from('notes')
        .update({
          title: editForm.title || 'Untitled Note',
          content: editForm.content,
          tags: editForm.tags ? editForm.tags.split(',').map(t => t.trim()) : [],
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedNote.id);

      if (error) {
        console.error('Error saving note:', error);
        alert('Failed to save note');
      } else {
        await loadNotes();
        const updatedNote = notes.find(n => n.id === selectedNote.id);
        if (updatedNote) {
          setSelectedNote({
            ...updatedNote,
            title: editForm.title,
            content: editForm.content,
            tags: editForm.tags ? editForm.tags.split(',').map(t => t.trim()) : [],
          });
        }
      }
    }

    setSaving(false);
  };

  const deleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId);

    if (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note');
    } else {
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
        setEditForm({ title: '', content: '', tags: '' });
      }
      loadNotes();
    }
  };

  const toggleArchive = async (note: Note) => {
    const { error } = await supabase
      .from('notes')
      .update({ is_archived: !note.is_archived })
      .eq('id', note.id);

    if (error) {
      console.error('Error archiving note:', error);
      alert('Failed to archive note');
    } else {
      if (selectedNote?.id === note.id) {
        setSelectedNote(null);
        setEditForm({ title: '', content: '', tags: '' });
      }
      loadNotes();
    }
  };

  const selectNote = (note: Note) => {
    setIsCreatingNew(false);
    setSelectedNote(note);
    setEditForm({
      title: note.title,
      content: note.content || '',
      tags: note.tags?.join(', ') || '',
    });
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h2 className="text-xl md:text-2xl font-medium mb-2">Notes</h2>
          <p className="text-sm md:text-base dark:text-text-secondary light:text-text-light-secondary">Quick notes and ideas</p>
        </div>
        <button
          onClick={startNewNote}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition whitespace-nowrap"
        >
          <FileText className="w-4 h-4" />
          New Note
        </button>
      </div>

      <div className="grid lg:grid-cols-4 gap-4 md:gap-6">
        <div className="lg:col-span-1">
          <div className="dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 dark:text-linear-accent light:text-linear-light-accent" />
              <h3 className="font-medium">Notes</h3>
            </div>

            <div className="mb-4">
              <div className="relative mb-3">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 dark:text-text-tertiary light:text-text-light-tertiary" />
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear text-sm focus:outline-none focus:border-linear-accent"
                />
              </div>
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-linear text-sm linear-transition ${
                  showArchived
                    ? 'bg-linear-bg-subtle text-text-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-linear-bg-subtle'
                }`}
              >
                <Archive className="w-4 h-4" />
                {showArchived ? 'Show Active' : 'Show Archived'}
              </button>
            </div>

            {loading ? (
              <p className="text-sm dark:text-text-tertiary light:text-text-light-tertiary text-center py-4">Loading...</p>
            ) : filteredNotes.length === 0 ? (
              <p className="text-sm dark:text-text-tertiary light:text-text-light-tertiary text-center py-4">
                {searchQuery ? 'No notes found' : 'No notes yet'}
              </p>
            ) : (
              <div className="space-y-1">
                {filteredNotes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => selectNote(note)}
                    className={`w-full text-left px-3 py-2 rounded-linear text-sm linear-transition ${
                      selectedNote?.id === note.id
                        ? 'bg-linear-bg-subtle text-text-primary'
                        : 'text-text-secondary hover:text-text-primary hover:bg-linear-bg-subtle'
                    }`}
                  >
                    <div className="truncate font-medium mb-1">{note.title}</div>
                    <div className="flex items-center gap-2 text-xs dark:text-text-tertiary light:text-text-light-tertiary">
                      <Clock className="w-3 h-3" />
                      {new Date(note.updated_at).toLocaleDateString()}
                    </div>
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {note.tags.slice(0, 2).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-1.5 py-0.5 bg-linear-info/10 text-linear-info rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-3">
          {!selectedNote && !isCreatingNew ? (
            <div className="dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear-lg p-12 text-center">
              <FileText className="w-12 h-12 dark:text-text-tertiary light:text-text-light-tertiary mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Note Selected</h3>
              <p className="dark:text-text-secondary light:text-text-light-secondary mb-4">
                Select a note from the left or start writing
              </p>
            </div>
          ) : (
            <div className="dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear-lg flex flex-col h-[calc(100vh-200px)]">
              <div className="p-6 border-b dark:border-linear-border-subtle light:border-linear-light-border">
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full text-2xl font-medium bg-transparent border-none focus:outline-none mb-3"
                  placeholder="Note title..."
                />
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary" />
                  <input
                    type="text"
                    value={editForm.tags}
                    onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                    className="flex-1 text-sm bg-transparent border-none focus:outline-none dark:text-text-secondary light:text-text-light-secondary"
                    placeholder="Add tags (comma separated)..."
                  />
                </div>
              </div>

              <div className="p-6 flex-1 overflow-auto">
                <textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  className="w-full h-full bg-transparent border-none focus:outline-none resize-none dark:text-text-primary light:text-text-light-primary"
                  placeholder="Start writing your note..."
                />
              </div>

              <div className="p-6 border-t dark:border-linear-border-subtle light:border-linear-light-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {selectedNote && (
                      <>
                        <div className="flex items-center gap-2 text-xs dark:text-text-tertiary light:text-text-light-tertiary">
                          <Clock className="w-3 h-3" />
                          Last updated: {new Date(selectedNote.updated_at).toLocaleString()}
                        </div>
                        <button
                          onClick={() => toggleArchive(selectedNote)}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle hover:bg-linear-border-subtle rounded-linear linear-transition"
                        >
                          <Archive className="w-4 h-4" />
                          {selectedNote.is_archived ? 'Unarchive' : 'Archive'}
                        </button>
                        <button
                          onClick={() => deleteNote(selectedNote.id)}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-linear-error-subtle hover:bg-red-500/20 text-linear-error rounded-linear linear-transition"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                  <button
                    onClick={saveNote}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
