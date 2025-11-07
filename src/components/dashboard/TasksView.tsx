import { useState, useEffect } from 'react';
import { Plus, Calendar, User, X, AlertCircle, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useWritePermission } from '../../hooks/useWritePermission';
import type { Database } from '../../lib/database.types';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];

interface UserProfile {
  id: string;
  email: string;
  name: string;
}

interface TasksViewProps {
  workspace: Workspace;
}

export function TasksView({ workspace }: TasksViewProps) {
  const { user } = useAuth();
  const { checkWritePermission } = useWritePermission();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    due_date: '',
    assigned_to: '',
  });

  useEffect(() => {
    loadTasks();
    loadTeamMembers();
  }, [workspace.id]);

  const loadTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading tasks:', error);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  const loadTeamMembers = async () => {
    if (!user) return;

    const { data: currentUserData } = await supabase.auth.getUser();
    if (currentUserData.user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', currentUserData.user.id)
        .maybeSingle();

      const displayName = profileData?.full_name || currentUserData.user.email || 'Me';

      setTeamMembers([{
        id: currentUserData.user.id,
        email: currentUserData.user.email || '',
        name: displayName
      }]);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!checkWritePermission('create tasks')) {
      setShowCreateModal(false);
      return;
    }

    const { error } = await supabase.from('tasks').insert({
      workspace_id: workspace.id,
      title: newTask.title,
      description: newTask.description || null,
      priority: newTask.priority,
      due_date: newTask.due_date || null,
      assigned_to: newTask.assigned_to || null,
      created_by: user.id,
      status: 'todo',
    });

    if (error) {
      console.error('Error creating task:', error);
    } else {
      setShowCreateModal(false);
      resetForm();
      loadTasks();
    }
  };

  const handleUpdateTask = async (updatedFields: Partial<Task>) => {
    if (!selectedTask) return;

    if (!checkWritePermission('update tasks')) {
      return;
    }

    const { error } = await supabase
      .from('tasks')
      .update({
        ...updatedFields,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedTask.id);

    if (error) {
      console.error('Error updating task:', error);
    } else {
      setSelectedTask({ ...selectedTask, ...updatedFields } as Task);
      loadTasks();
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', selectedTask.id);

    if (error) {
      console.error('Error deleting task:', error);
    } else {
      setShowDetailDrawer(false);
      setSelectedTask(null);
      loadTasks();
    }
  };

  const openTaskDetail = (task: Task) => {
    setSelectedTask(task);
    setShowDetailDrawer(true);
  };

  const resetForm = () => {
    setNewTask({ title: '', description: '', priority: 'medium', due_date: '', assigned_to: '' });
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task:', error);
    } else {
      loadTasks();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'high':
        return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');
  const completedCount = doneTasks.length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (loading) {
    return <div className="text-text-secondary">Loading tasks...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-medium mb-2">Tasks</h2>
          <p className="text-sm md:text-base text-text-secondary">Organize your work in a visual board</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      <div className="mb-6 p-4 bg-linear-bg-secondary border border-linear-border-subtle rounded-linear-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-linear-accent" />
            <span className="text-sm font-medium">Progress</span>
          </div>
          <span className="text-sm text-text-secondary">
            {completedCount} / {totalCount} completed
          </span>
        </div>
        <div className="w-full h-2 bg-linear-bg rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-accent transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-20 bg-linear-bg-secondary border border-linear-border-subtle rounded-linear-lg">
          <AlertCircle className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
          <p className="text-text-secondary mb-6">Create your first task to start organizing work</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition"
          >
            Create Task
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TaskColumn
            title="To Do"
            count={todoTasks.length}
            tasks={todoTasks}
            teamMembers={teamMembers}
            onTaskClick={openTaskDetail}
            getPriorityColor={getPriorityColor}
          />
          <TaskColumn
            title="In Progress"
            count={inProgressTasks.length}
            tasks={inProgressTasks}
            teamMembers={teamMembers}
            onTaskClick={openTaskDetail}
            getPriorityColor={getPriorityColor}
          />
          <TaskColumn
            title="Done"
            count={doneTasks.length}
            tasks={doneTasks}
            teamMembers={teamMembers}
            onTaskClick={openTaskDetail}
            getPriorityColor={getPriorityColor}
          />
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-linear-bg-secondary border border-linear-border rounded-linear-lg p-6 w-full max-w-lg">
            <h3 className="text-xl font-medium mb-6">Create New Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-4 py-2 bg-linear-bg border border-linear-border rounded-linear focus:outline-none focus:border-linear-accent"
                  placeholder="Enter task title..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-4 py-2 bg-linear-bg border border-linear-border rounded-linear focus:outline-none focus:border-linear-accent h-24 resize-none"
                  placeholder="Add a more detailed description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                    className="w-full px-4 py-2 bg-linear-bg border border-linear-border rounded-linear focus:outline-none focus:border-linear-accent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Due Date</label>
                  <input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    className="w-full px-4 py-2 bg-linear-bg border border-linear-border rounded-linear focus:outline-none focus:border-linear-accent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Assignee</label>
                <select
                  value={newTask.assigned_to}
                  onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                  className="w-full px-4 py-2 bg-linear-bg border border-linear-border rounded-linear focus:outline-none focus:border-linear-accent"
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); resetForm(); }}
                  className="flex-1 px-4 py-2 bg-linear-bg-subtle hover:bg-linear-border-subtle rounded-linear linear-transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailDrawer && selectedTask && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex justify-end"
          onClick={() => setShowDetailDrawer(false)}
        >
          <div
            className="w-full max-w-md bg-linear-bg-secondary border-l border-linear-border h-full overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-medium">Task Details</h3>
                <button
                  onClick={() => setShowDetailDrawer(false)}
                  className="p-2 hover:bg-linear-bg-subtle rounded-linear linear-transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={selectedTask.title}
                    onChange={(e) => handleUpdateTask({ title: e.target.value })}
                    className="w-full px-4 py-2 bg-linear-bg border border-linear-border rounded-linear focus:outline-none focus:border-linear-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={selectedTask.description || ''}
                    onChange={(e) => handleUpdateTask({ description: e.target.value })}
                    className="w-full px-4 py-2 bg-linear-bg border border-linear-border rounded-linear focus:outline-none focus:border-linear-accent h-32 resize-none"
                    placeholder="Add a description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={selectedTask.status}
                    onChange={(e) => handleUpdateTask({ status: e.target.value })}
                    className="w-full px-4 py-2 bg-linear-bg border border-linear-border rounded-linear focus:outline-none focus:border-linear-accent"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <select
                    value={selectedTask.priority}
                    onChange={(e) => handleUpdateTask({ priority: e.target.value })}
                    className="w-full px-4 py-2 bg-linear-bg border border-linear-border rounded-linear focus:outline-none focus:border-linear-accent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Assignee</label>
                  <select
                    value={selectedTask.assigned_to || ''}
                    onChange={(e) => handleUpdateTask({ assigned_to: e.target.value || null })}
                    className="w-full px-4 py-2 bg-linear-bg border border-linear-border rounded-linear focus:outline-none focus:border-linear-accent"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Due Date</label>
                  <input
                    type="date"
                    value={selectedTask.due_date || ''}
                    onChange={(e) => handleUpdateTask({ due_date: e.target.value || null })}
                    className="w-full px-4 py-2 bg-linear-bg border border-linear-border rounded-linear focus:outline-none focus:border-linear-accent"
                  />
                </div>

                <div className="pt-4 border-t border-linear-border">
                  <button
                    onClick={handleDeleteTask}
                    className="w-full px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-linear linear-transition"
                  >
                    Delete Task
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

interface TaskColumnProps {
  title: string;
  count: number;
  tasks: Task[];
  teamMembers: UserProfile[];
  onTaskClick: (task: Task) => void;
  getPriorityColor: (priority: string) => string;
}

function TaskColumn({ title, count, tasks, teamMembers, onTaskClick, getPriorityColor }: TaskColumnProps) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
        <span className="text-xs px-2 py-1 bg-linear-bg-subtle text-text-tertiary rounded-full">
          {count}
        </span>
      </div>
      <div className="space-y-3 min-h-[400px]">
        {tasks.map((task) => {
          const assignedMember = teamMembers.find(m => m.id === task.assigned_to);
          return (
            <div
              key={task.id}
              onClick={() => onTaskClick(task)}
              className="bg-linear-bg-secondary border border-linear-border-subtle hover:border-linear-border rounded-linear-lg p-4 cursor-pointer linear-transition group"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="text-sm font-medium flex-1 line-clamp-2 group-hover:text-linear-accent linear-transition">
                  {task.title}
                </h4>
                <span className={`text-xs px-2 py-1 rounded-full border flex-shrink-0 ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </div>

              {task.description && (
                <p className="text-xs text-text-secondary mb-3 line-clamp-2">
                  {task.description}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-text-tertiary">
                <div className="flex items-center gap-1.5">
                  {assignedMember ? (
                    <>
                      <User className="w-3.5 h-3.5" />
                      <span>{assignedMember.name}</span>
                    </>
                  ) : (
                    <span className="text-text-tertiary/50">Unassigned</span>
                  )}
                </div>
                {task.due_date && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {tasks.length === 0 && (
          <div className="text-center py-12 text-text-tertiary text-sm">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}
