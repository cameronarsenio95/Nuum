import { useState, useEffect } from 'react';
import { Plus, Calendar, Edit2, Trash2, X, User, Check, Circle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useWritePermission } from '../../hooks/useWritePermission';
import type { Database } from '../../lib/database.types';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];
type WorkspaceMember = Database['public']['Tables']['workspace_members']['Row'];

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
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

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    if (!checkWritePermission('update tasks')) {
      setShowEditModal(false);
      return;
    }

    const { error } = await supabase
      .from('tasks')
      .update({
        title: newTask.title,
        description: newTask.description || null,
        priority: newTask.priority,
        due_date: newTask.due_date || null,
        assigned_to: newTask.assigned_to || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedTask.id);

    if (error) {
      console.error('Error updating task:', error);
    } else {
      setShowEditModal(false);
      setSelectedTask(null);
      resetForm();
      loadTasks();
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskToDelete.id);

    if (error) {
      console.error('Error deleting task:', error);
    } else {
      setShowDeleteConfirm(false);
      setTaskToDelete(null);
      loadTasks();
    }
  };

  const openEditModal = (task: Task) => {
    setSelectedTask(task);
    setNewTask({
      title: task.title,
      description: task.description || '',
      priority: task.priority as any,
      due_date: task.due_date || '',
      assigned_to: task.assigned_to || '',
    });
    setShowEditModal(true);
  };

  const openDeleteConfirm = (task: Task) => {
    setTaskToDelete(task);
    setShowDeleteConfirm(true);
  };

  const resetForm = () => {
    setNewTask({ title: '', description: '', priority: 'medium', due_date: '', assigned_to: '' });
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task:', error);
    } else {
      loadTasks();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'text-linear-success bg-linear-success/10 border-linear-success-border/20';
      case 'in_progress':
        return 'text-linear-info bg-linear-info/10 border-linear-info-border/20';
      default:
        return 'text-text-tertiary bg-text-tertiary/10 border-linear-border/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-linear-error bg-linear-error/10 border-linear-error-border/20';
      case 'high':
        return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'medium':
        return 'text-linear-warning bg-linear-warning/10 border-linear-warning-border/20';
      default:
        return 'text-text-tertiary bg-text-tertiary/10 border-linear-border/20';
    }
  };

  const [filterStatus, setFilterStatus] = useState<string>('all');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <Check className="w-4 h-4" />;
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  const filteredTasks = filterStatus === 'all'
    ? tasks
    : tasks.filter(t => t.status === filterStatus);

  const statusCounts = {
    all: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  };

  if (loading) {
    return <div className="text-text-secondary">Loading tasks...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h2 className="text-xl md:text-2xl font-medium mb-2">Tasks</h2>
          <p className="text-sm md:text-base text-text-secondary">Track your team's work and progress</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { value: 'all', label: 'All' },
          { value: 'todo', label: 'To Do' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'done', label: 'Done' },
        ].map((filter) => (
          <button
            key={filter.value}
            onClick={() => setFilterStatus(filter.value)}
            className={`px-4 py-2 rounded-linear text-sm whitespace-nowrap linear-transition ${
              filterStatus === filter.value
                ? 'bg-white text-black'
                : 'bg-linear-bg-secondary text-text-secondary hover:bg-linear-bg-subtle border border-linear-border-subtle'
            }`}
          >
            {filter.label}
            <span className="ml-2 text-xs opacity-60">
              {statusCounts[filter.value as keyof typeof statusCounts]}
            </span>
          </button>
        ))}
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-20 bg-linear-bg-secondary border border-linear-border-subtle rounded-linear-lg">
          <CheckSquare className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
          <p className="text-text-secondary mb-6">Create your first task to start tracking work</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition"
          >
            Create Task
          </button>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12 bg-linear-bg-secondary border border-linear-border-subtle rounded-linear-lg">
          <p className="text-text-secondary">No tasks in this category</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const assignedMember = teamMembers.find(m => m.id === task.assigned_to);
            return (
              <div
                key={task.id}
                className="bg-linear-bg-secondary border border-linear-border-subtle rounded-linear-lg p-4 hover:border-linear-border linear-transition group"
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => updateTaskStatus(task.id, task.status === 'done' ? 'todo' : 'done')}
                    className={`mt-1 rounded-full p-0.5 linear-transition ${
                      task.status === 'done'
                        ? 'bg-linear-success text-black'
                        : 'border-2 border-linear-border hover:border-linear-accent'
                    }`}
                  >
                    {task.status === 'done' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <div className="w-4 h-4" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className={`text-base font-medium ${task.status === 'done' ? 'line-through opacity-60' : ''}`}>
                        {task.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <button
                          onClick={() => openEditModal(task)}
                          className="p-2 hover:bg-linear-bg-subtle rounded-linear opacity-0 group-hover:opacity-100 linear-transition"
                          title="Edit task"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(task)}
                          className="p-2 hover:bg-linear-error-subtle text-linear-error rounded-linear opacity-0 group-hover:opacity-100 linear-transition"
                          title="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {task.description && (
                      <p className="text-sm text-text-secondary mb-3">{task.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-text-tertiary">
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded border ${getStatusColor(task.status)}`}>
                        {getStatusIcon(task.status)}
                        <span className="capitalize text-xs">{task.status.replace('_', ' ')}</span>
                      </div>

                      {assignedMember && (
                        <div className="flex items-center gap-1.5">
                          <User className="w-4 h-4" />
                          <span className="text-xs">{assignedMember.name}</span>
                        </div>
                      )}

                      {task.due_date && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          <span className="text-xs">{new Date(task.due_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-linear-bg-secondary border border-linear-border rounded-linear-lg p-6 w-full max-w-lg">
            <h3 className="text-xl font-medium mb-6">Create New Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Task Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-4 py-2 bg-linear-bg border border-linear-border rounded-linear focus:outline-none focus:border-linear-accent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-4 py-2 bg-linear-bg border border-linear-border rounded-linear focus:outline-none focus:border-linear-accent h-24"
                />
              </div>
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
                <label className="block text-sm font-medium mb-2">Assign To</label>
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
              <div>
                <label className="block text-sm font-medium mb-2">Due Date</label>
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  className="w-full px-4 py-2 bg-linear-bg border border-linear-border rounded-linear focus:outline-none focus:border-linear-accent"
                />
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
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50" onClick={() => setShowEditModal(false)}>
          <div className="bg-linear-bg-secondary border border-linear-border rounded-linear-lg p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium">Edit Task</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-linear-bg-subtle rounded-linear">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Task Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-4 py-2 bg-linear-bg border border-linear-border rounded-linear focus:outline-none focus:border-linear-accent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-4 py-2 bg-linear-bg border border-linear-border rounded-linear focus:outline-none focus:border-linear-accent h-24"
                />
              </div>
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
                <label className="block text-sm font-medium mb-2">Assign To</label>
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
              <div>
                <label className="block text-sm font-medium mb-2">Due Date</label>
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  className="w-full px-4 py-2 bg-linear-bg border border-linear-border rounded-linear focus:outline-none focus:border-linear-accent"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); resetForm(); }}
                  className="flex-1 px-4 py-2 bg-linear-bg-subtle hover:bg-linear-border-subtle rounded-linear linear-transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && taskToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-linear-bg-secondary border border-linear-border rounded-linear-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-medium mb-4">Delete Task</h3>
            <p className="text-text-secondary mb-6">
              Are you sure you want to delete <span className="font-medium text-text-primary">"{taskToDelete.title}"</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-linear-bg-subtle hover:bg-linear-border-subtle rounded-linear linear-transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-linear linear-transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckSquare(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}
