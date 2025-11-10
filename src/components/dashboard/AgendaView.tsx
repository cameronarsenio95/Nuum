import { useState, useEffect } from 'react';
import { CalendarDays, FileText, ClipboardList, Play } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';
import { useAuth } from '../../contexts/AuthContext';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type AdSet = Database['public']['Tables']['ad_sets']['Row'];
type Note = Database['public']['Tables']['notes']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];

interface AgendaViewProps {
  workspace: Workspace;
}

export function AgendaView({ workspace }: AgendaViewProps) {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspace?.id) return;
    loadAgenda();
  }, [workspace.id]);

  const loadAgenda = async () => {
    setLoading(true);

    const [adSetsRes, notesRes, tasksRes] = await Promise.all([
      supabase.from('ad_sets').select('*').eq('workspace_id', workspace.id),
      supabase.from('notes').select('*').eq('workspace_id', workspace.id),
      supabase.from('tasks').select('*').eq('workspace_id', workspace.id)
    ]);

    const adSets = (adSetsRes.data || []).map((a: AdSet) => ({
      id: a.id,
      type: 'adset',
      title: a.name,
      date: a.created_at,
      color: 'bg-nuum-accent-blue/20 border-nuum-accent-blue/30',
      icon: <Play className="w-3.5 h-3.5 text-nuum-accent-blue" />,
      duration: detectDuration(a.created_at)
    }));

    const notes = (notesRes.data || []).map((n: Note) => ({
      id: n.id,
      type: 'note',
      title: n.title,
      date: n.created_at,
      color: 'bg-nuum-accent-green/20 border-nuum-accent-green/30',
      icon: <FileText className="w-3.5 h-3.5 text-nuum-accent-green" />,
    }));

    const tasks = (tasksRes.data || []).map((t: Task) => ({
      id: t.id,
      type: 'task',
      title: t.title,
      date: t.due_date || t.created_at,
      color: 'bg-nuum-accent-orange/20 border-nuum-accent-orange/30',
      icon: <ClipboardList className="w-3.5 h-3.5 text-nuum-accent-orange" />,
    }));

    const combined = [...adSets, ...notes, ...tasks].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    setEvents(combined);
    setLoading(false);
  };

  const detectDuration = (created_at: string) => {
    // simple placeholder: infer 7/14/30 days based on metadata or mock
    const created = new Date(created_at);
    const rand = [7, 14, 30][Math.floor(Math.random() * 3)];
    const end = new Date(created);
    end.setDate(created.getDate() + rand);
    return { start: created, end, label: `${rand} days` };
  };

  if (loading) return <div className="text-center py-10 text-nuum-text-secondary">Loading agenda...</div>;

  return (
    <div className="p-6 text-nuum-text-primary">
      <h1 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <CalendarDays className="w-5 h-5 text-nuum-accent-blue" />
        Agenda Overview
      </h1>

      {events.length === 0 ? (
        <p className="text-nuum-text-secondary">No events found.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {events.map((e) => (
            <div
              key={e.id}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 ${e.color}`}
            >
              <div className="flex items-center gap-3">
                {e.icon}
                <div>
                  <p className="font-medium">{e.title}</p>
                  <p className="text-xs text-nuum-text-secondary">
                    {new Date(e.date).toLocaleDateString()} {e.duration?.label && `· ${e.duration.label}`}
                  </p>
                </div>
              </div>
              <span className="text-xs uppercase tracking-wide text-nuum-text-secondary">{e.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
