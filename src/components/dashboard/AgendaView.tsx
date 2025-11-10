import { useState, useEffect } from 'react';
import { CalendarDays, FileText, ClipboardList, Play } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';
import { useAuth } from '../../contexts/AuthContext';
import { NUUM_COLORS } from '../../utils/designSystem';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type AdSet = Database['public']['Tables']['ad_sets']['Row'];
type Note = Database['public']['Tables']['notes']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];

interface AgendaViewProps {
  workspace: Workspace;
  onOpenAdSet?: (adSetId: string, campaignId: string | null) => void;
  onOpenTasks?: () => void;
  onOpenNotes?: () => void;
}

interface CalendarEvent {
  id: string;
  type: 'adset' | 'note' | 'task';
  title: string;
  date: string;
  color: string;
  icon: JSX.Element;
  campaignId?: string | null;
}

export function AgendaView({
  workspace,
  onOpenAdSet,
  onOpenTasks,
  onOpenNotes,
}: AgendaViewProps) {
  const { user } = useAuth(); // nog niet gebruikt, maar laten staan
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    if (workspace?.id) loadAgenda();
  }, [workspace.id]);

  const loadAgenda = async () => {
    setLoading(true);
    const [adSetsRes, notesRes, tasksRes] = await Promise.all([
      supabase.from('ad_sets').select('*').eq('workspace_id', workspace.id),
      supabase.from('notes').select('*').eq('workspace_id', workspace.id),
      supabase.from('tasks').select('*').eq('workspace_id', workspace.id),
    ]);

    const adSets = (adSetsRes.data || []).map((a: AdSet) => ({
      id: a.id,
      type: 'adset' as const,
      title: a.name || 'Unnamed Ad Set',
      date: a.created_at,
      color: 'bg-nuum-accent-blue/20 border-nuum-accent-blue/30',
      icon: <Play className="w-3 h-3 text-nuum-accent-blue" />,
      campaignId: a.campaign_id ?? null,
    }));

    const notes = (notesRes.data || []).map((n: Note) => ({
      id: n.id,
      type: 'note' as const,
      title: n.title || 'Untitled Note',
      date: n.created_at,
      color: 'bg-nuum-accent-green/20 border-nuum-accent-green/30',
      icon: <FileText className="w-3 h-3 text-nuum-accent-green" />,
    }));

    const tasks = (tasksRes.data || []).map((t: Task) => ({
      id: t.id,
      type: 'task' as const,
      title: t.title || 'Untitled Task',
      date: t.due_date || t.created_at,
      color: 'bg-nuum-accent-orange/20 border-nuum-accent-orange/30',
      icon: <ClipboardList className="w-3 h-3 text-nuum-accent-orange" />,
    }));

    setEvents([...adSets, ...notes, ...tasks]);
    setLoading(false);
  };

  // Helper to build calendar grid
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);
  const startDay = startOfMonth.getDay() || 7; // Monday = 1, Sunday = 7
  const daysInMonth = endOfMonth.getDate();

  const days: Date[] = [];
  for (let i = 1 - (startDay - 1); i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const getEventsForDay = (date: Date) =>
    events.filter((e) => new Date(e.date).toDateString() === date.toDateString());

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const handleEventClick = (event: CalendarEvent) => {
    if (event.type === 'adset' && onOpenAdSet) {
      onOpenAdSet(event.id, event.campaignId ?? null);
      return;
    }
    if (event.type === 'task' && onOpenTasks) {
      onOpenTasks();
      return;
    }
    if (event.type === 'note' && onOpenNotes) {
      onOpenNotes();
      return;
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-nuum-text-secondary">Loading agenda...</div>;
  }

  return (
    <div className="p-6 text-nuum-text-primary">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-nuum-accent-blue" />
          {monthName} {year}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="px-3 py-1 text-sm rounded-lg border"
            style={{ borderColor: NUUM_COLORS.border }}
          >
            ←
          </button>
          <button
            onClick={handleNextMonth}
            className="px-3 py-1 text-sm rounded-lg border"
            style={{ borderColor: NUUM_COLORS.border }}
          >
            →
          </button>
        </div>
      </div>

      {/* Kalender grid */}
      <div className="grid grid-cols-7 gap-[1px]" style={{ backgroundColor: NUUM_COLORS.border }}>
        {['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'].map((d) => (
          <div
            key={d}
            className="text-center py-2 text-xs uppercase font-medium"
            style={{ color: NUUM_COLORS.textSecondary }}
          >
            {d}
          </div>
        ))}

        {days.map((day, idx) => {
          const isCurrentMonth = day.getMonth() === month;
          const isToday = day.toDateString() === new Date().toDateString();
          const dayEvents = getEventsForDay(day);

          return (
            <div
              key={idx}
              className="min-h-[110px] p-2 flex flex-col border"
              style={{
                borderColor: NUUM_COLORS.border,
                backgroundColor: isCurrentMonth
                  ? NUUM_COLORS.surface
                  : 'rgba(255,255,255,0.02)',
              }}
            >
              <div
                className={`text-xs font-medium mb-1 ${
                  isToday ? 'text-nuum-accent-blue' : 'text-nuum-text-secondary'
                }`}
              >
                {day.getDate()}
              </div>

              <div className="flex flex-col gap-1 overflow-hidden">
                {dayEvents.slice(0, 3).map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => handleEventClick(e)}
                    className={`flex items-center gap-1 text-[11px] truncate rounded-md px-1 py-0.5 border ${e.color} cursor-pointer hover:opacity-90 transition-opacity`}
                  >
                    {e.icon}
                    <span className="truncate">{e.title}</span>
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-[10px] text-nuum-text-secondary mt-0.5">
                    +{dayEvents.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
