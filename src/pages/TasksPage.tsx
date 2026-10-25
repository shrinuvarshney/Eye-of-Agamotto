/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Calendar,
  Clock,
  Trash2,
  Edit2,
  CheckCircle2,
  Circle,
  LayoutList,
  Kanban,
  Repeat,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  X,
  Check,
  Tag,
  Hourglass,
  FolderGit2,
  RotateCcw,
  Bell,
  Filter,
  CalendarDays,
  Loader2,
} from 'lucide-react';
import { Task, Priority, TaskCategory, TaskStatus, RecurringFrequency, Project } from '../types';
import { storageService } from '../services/storageService';

interface TasksPageProps {
  tasks: Task[];
  onTasksChange: () => void;
  onOpenQuickCapture: () => void;
  onShowToast?: (msg: string) => void;
}

type FilterView = 'all' | 'today' | 'upcoming' | 'overdue' | 'completed';
type LayoutMode = 'list' | 'kanban';
type SortOption =
  | 'dueDateAsc'
  | 'dueDateDesc'
  | 'priorityDesc'
  | 'priorityAsc'
  | 'titleAsc'
  | 'titleDesc'
  | 'createdAtDesc';

export const TasksPage: React.FC<TasksPageProps> = ({
  tasks,
  onTasksChange,
  onOpenQuickCapture,
  onShowToast,
}) => {
  // Navigation & View state
  const [filterView, setFilterView] = useState<FilterView>('all');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('dueDateAsc');

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form fields for Task Modal
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<Priority>('medium');
  const [formCategory, setFormCategory] = useState<TaskCategory>('study');
  const [formStatus, setFormStatus] = useState<TaskStatus>('todo');
  const [formDueDate, setFormDueDate] = useState('');
  const [formDueTime, setFormDueTime] = useState('18:00');
  const [formEstimatedMinutes, setFormEstimatedMinutes] = useState<number>(45);
  const [formRecurring, setFormRecurring] = useState<RecurringFrequency>('none');
  const [formTags, setFormTags] = useState('');
  const [formLinkedProjectId, setFormLinkedProjectId] = useState<string>('');
  const [formReminderEnabled, setFormReminderEnabled] = useState(false);
  const [formReminderMinutesBefore, setFormReminderMinutesBefore] = useState<number>(15);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Reschedule Modal state
  const [reschedulingTask, setReschedulingTask] = useState<Task | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  // Load available projects for linking
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);

  useEffect(() => {
    setAvailableProjects(storageService.getProjects());
  }, [tasks]);

  // Today string reference in local timezone
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const todayCount = tasks.filter((t) => t.dueDate === todayStr).length;
    const overdueCount = tasks.filter((t) => t.dueDate < todayStr && t.status !== 'completed').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, todayCount, overdueCount, completionRate };
  }, [tasks, todayStr]);

  // Tab Badge counts
  const tabCounts = useMemo(() => {
    return {
      all: tasks.length,
      today: tasks.filter((t) => t.dueDate === todayStr).length,
      upcoming: tasks.filter((t) => t.dueDate > todayStr && t.status !== 'completed').length,
      overdue: tasks.filter((t) => t.dueDate < todayStr && t.status !== 'completed').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
    };
  }, [tasks, todayStr]);

  // Filter & Search logic
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        // Search query (checks title, description, tags, category, and linked project name)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = t.title.toLowerCase().includes(q);
          const matchesDesc = t.description?.toLowerCase().includes(q) || false;
          const matchesTags = t.tags.some((tag) => tag.toLowerCase().includes(q));
          const matchesCat = t.category.toLowerCase().includes(q);
          const matchesProj =
            availableProjects.find((p) => p.id === t.linkedProjectId)?.name.toLowerCase().includes(q) || false;
          if (!matchesTitle && !matchesDesc && !matchesTags && !matchesCat && !matchesProj) return false;
        }

        // Category filter
        if (categoryFilter !== 'all' && t.category !== categoryFilter) {
          return false;
        }

        // Priority filter
        if (priorityFilter !== 'all' && t.priority !== priorityFilter) {
          return false;
        }

        // Status filter
        if (statusFilter !== 'all' && t.status !== statusFilter) {
          return false;
        }

        // View filter
        if (filterView === 'today') {
          return t.dueDate === todayStr;
        }
        if (filterView === 'upcoming') {
          return t.dueDate > todayStr && t.status !== 'completed';
        }
        if (filterView === 'overdue') {
          return t.dueDate < todayStr && t.status !== 'completed';
        }
        if (filterView === 'completed') {
          return t.status === 'completed';
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'dueDateAsc') {
          return a.dueDate.localeCompare(b.dueDate) || (a.dueTime || '').localeCompare(b.dueTime || '');
        }
        if (sortBy === 'dueDateDesc') {
          return b.dueDate.localeCompare(a.dueDate) || (b.dueTime || '').localeCompare(a.dueTime || '');
        }
        if (sortBy === 'priorityDesc') {
          const weight: Record<Priority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
          return weight[b.priority] - weight[a.priority];
        }
        if (sortBy === 'priorityAsc') {
          const weight: Record<Priority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
          return weight[a.priority] - weight[b.priority];
        }
        if (sortBy === 'titleAsc') {
          return a.title.localeCompare(b.title);
        }
        if (sortBy === 'titleDesc') {
          return b.title.localeCompare(a.title);
        }
        if (sortBy === 'createdAtDesc') {
          return (b.createdAt || '').localeCompare(a.createdAt || '');
        }
        return 0;
      });
  }, [
    tasks,
    searchQuery,
    categoryFilter,
    priorityFilter,
    statusFilter,
    filterView,
    sortBy,
    todayStr,
    availableProjects,
  ]);

  // Actions
  const handleToggle = (id: string) => {
    const updated = storageService.toggleTaskCompletion(id);
    onTasksChange();
    if (updated) {
      if (updated.status === 'completed') {
        onShowToast?.(`Completed "${updated.title}"!`);
      } else if (updated.recurring && updated.recurring !== 'none') {
        onShowToast?.(`Advanced recurring task to ${updated.dueDate}`);
      } else {
        onShowToast?.(`Marked "${updated.title}" as to-do`);
      }
    }
  };

  // Delete Confirmation Modal state
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const handleDeletePrompt = (task: Task) => {
    setTaskToDelete(task);
  };

  const handleConfirmDelete = () => {
    if (taskToDelete) {
      const title = taskToDelete.title;
      storageService.deleteTask(taskToDelete.id);
      setTaskToDelete(null);
      onTasksChange();
      onShowToast?.(`Deleted task "${title}"`);
    }
  };

  const handleStatusChange = (task: Task, newStatus: TaskStatus) => {
    storageService.updateTaskStatus(task.id, newStatus);
    onTasksChange();
    onShowToast?.(`Moved "${task.title}" to ${newStatus.replace('_', ' ')}`);
  };

  // Move task to next or previous stage in Kanban
  const handleMoveStage = (task: Task, direction: 'prev' | 'next') => {
    const sequence: TaskStatus[] = ['todo', 'in_progress', 'in_review', 'completed'];
    const currentIndex = sequence.indexOf(task.status);
    if (direction === 'next' && currentIndex < sequence.length - 1) {
      const nextStatus = sequence[currentIndex + 1];
      storageService.updateTaskStatus(task.id, nextStatus);
      onTasksChange();
      onShowToast?.(`Moved to ${nextStatus.replace('_', ' ')}`);
    } else if (direction === 'prev' && currentIndex > 0) {
      const prevStatus = sequence[currentIndex - 1];
      storageService.updateTaskStatus(task.id, prevStatus);
      onTasksChange();
      onShowToast?.(`Moved to ${prevStatus.replace('_', ' ')}`);
    }
  };

  // Open Create Modal
  const handleOpenCreate = (initialStatus: TaskStatus = 'todo') => {
    setEditingTask(null);
    setFormTitle('');
    setFormDescription('');
    setFormPriority('medium');
    setFormCategory('study');
    setFormStatus(initialStatus);
    setFormDueDate(todayStr);
    setFormDueTime('18:00');
    setFormEstimatedMinutes(45);
    setFormRecurring('none');
    setFormTags('');
    setFormLinkedProjectId('');
    setFormReminderEnabled(false);
    setFormReminderMinutesBefore(15);
    setFormError('');
    setIsTaskModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDescription(task.description || '');
    setFormPriority(task.priority);
    setFormCategory(task.category);
    setFormStatus(task.status);
    setFormDueDate(task.dueDate);
    setFormDueTime(task.dueTime || '18:00');
    setFormEstimatedMinutes(task.estimatedMinutes || 45);
    setFormRecurring(task.recurring || 'none');
    setFormTags(task.tags.join(', '));
    setFormLinkedProjectId(task.linkedProjectId || '');
    setFormReminderEnabled(task.reminderEnabled || false);
    setFormReminderMinutesBefore(task.reminderMinutesBefore || 15);
    setFormError('');
    setIsTaskModalOpen(true);
  };

  // Save Create or Edit
  const handleSaveTaskForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Task title is required');
      return;
    }
    if (!formDueDate) {
      setFormError('Due date is required');
      return;
    }

    setIsSubmitting(true);
    const tagsArray = formTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      if (editingTask) {
        const updated: Task = {
          ...editingTask,
          title: formTitle.trim(),
          description: formDescription.trim() || undefined,
          priority: formPriority,
          category: formCategory,
          status: formStatus,
          dueDate: formDueDate,
          dueTime: formDueTime || undefined,
          estimatedMinutes: Number(formEstimatedMinutes) || undefined,
          recurring: formRecurring,
          tags: tagsArray,
          linkedProjectId: formLinkedProjectId || undefined,
          reminderEnabled: formReminderEnabled,
          reminderMinutesBefore: formReminderEnabled ? formReminderMinutesBefore : undefined,
          completedAt:
            formStatus === 'completed'
              ? editingTask.completedAt || new Date().toISOString()
              : undefined,
        };
        storageService.updateTask(updated);
        onShowToast?.(`Updated task "${formTitle.trim()}"`);
      } else {
        storageService.addTask({
          title: formTitle.trim(),
          description: formDescription.trim() || undefined,
          priority: formPriority,
          category: formCategory,
          status: formStatus,
          dueDate: formDueDate,
          dueTime: formDueTime || undefined,
          estimatedMinutes: Number(formEstimatedMinutes) || undefined,
          recurring: formRecurring,
          tags: tagsArray,
          linkedProjectId: formLinkedProjectId || undefined,
          reminderEnabled: formReminderEnabled,
          reminderMinutesBefore: formReminderEnabled ? formReminderMinutesBefore : undefined,
        });
        onShowToast?.(`Created task "${formTitle.trim()}"`);
      }

      setIsTaskModalOpen(false);
      onTasksChange();
    } catch (err) {
      setFormError('Failed to save task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Reschedule Handler
  const handleQuickReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingTask || !rescheduleDate) return;
    storageService.rescheduleTask(reschedulingTask.id, rescheduleDate, rescheduleTime || undefined);
    const title = reschedulingTask.title;
    setReschedulingTask(null);
    onTasksChange();
    onShowToast?.(`Rescheduled "${title}" to ${rescheduleDate}`);
  };

  const setReschedulePreset = (daysOffset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
    setRescheduleDate(dateStr);
  };

  const priorityColor = (p: Priority) => {
    switch (p) {
      case 'urgent':
        return 'text-[var(--status-danger)] border-[var(--status-danger)]/30 bg-[var(--status-danger)]/10';
      case 'high':
        return 'text-[var(--status-warning)] border-[var(--status-warning)]/30 bg-[var(--status-warning)]/10';
      case 'medium':
        return 'text-[var(--brand-cyan)] border-[var(--brand-cyan)]/30 bg-[var(--brand-cyan)]/10';
      case 'low':
        return 'text-[var(--brand-secondary)] border-[var(--border-default)] bg-[var(--bg-surface-elevated)]';
    }
  };

  const categoryBadge = (cat: TaskCategory) => {
    switch (cat) {
      case 'study':
        return 'text-[var(--brand-secondary)] border-[var(--brand-secondary)]/30 bg-[var(--brand-secondary)]/10';
      case 'work':
        return 'text-[var(--brand-cyan)] border-[var(--brand-cyan)]/30 bg-[var(--brand-cyan)]/10';
      case 'career':
        return 'text-[var(--status-warning)] border-[var(--status-warning)]/30 bg-[var(--status-warning)]/10';
      case 'personal':
        return 'text-[var(--status-success)] border-[var(--status-success)]/30 bg-[var(--status-success)]/10';
    }
  };

  const columns: { id: TaskStatus; label: string; color: string; dot: string }[] = [
    { id: 'todo', label: 'To Do', color: 'border-[var(--border-default)]', dot: 'bg-[var(--text-muted)]' },
    { id: 'in_progress', label: 'In Progress', color: 'border-[var(--brand-cyan)]/50', dot: 'bg-[var(--brand-cyan)]' },
    { id: 'in_review', label: 'In Review', color: 'border-[var(--brand-primary)]/50', dot: 'bg-[var(--brand-primary)]' },
    { id: 'completed', label: 'Completed', color: 'border-[var(--status-success)]/50', dot: 'bg-[var(--status-success)]' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
            My Tasks & Execution Pipeline
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Full-cycle task lifecycle with priority management, scheduling, categories, and dual Kanban/List boards
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* List / Kanban Mode Toggle */}
          <div className="flex items-center bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setLayoutMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                layoutMode === 'list'
                  ? 'bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] shadow-sm font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title="Switch to List View"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => setLayoutMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                layoutMode === 'kanban'
                  ? 'bg-[var(--bg-surface-elevated)] text-[var(--brand-primary)] dark:text-[var(--brand-secondary)] font-semibold shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title="Switch to Kanban Board View"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
          </div>

          <button
            onClick={() => handleOpenCreate('todo')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] rounded-lg shadow-sm transition-all whitespace-nowrap active:scale-95 focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] glow-purple"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Quick Summary KPIs Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] flex flex-col justify-between shadow-card">
          <span className="text-[11px] text-[var(--text-muted)] font-medium">Total Tasks</span>
          <span className="text-xl font-bold text-[var(--text-primary)] font-mono tabular-nums mt-1">{metrics.total}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] flex flex-col justify-between shadow-card">
          <span className="text-[11px] text-[var(--text-muted)] font-medium">Today's Focus</span>
          <span className="text-xl font-bold text-[var(--brand-primary)] font-mono tabular-nums mt-1">{metrics.todayCount}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] flex flex-col justify-between shadow-card">
          <span className="text-[11px] text-[var(--text-muted)] font-medium">In Progress</span>
          <span className="text-xl font-bold text-[var(--brand-cyan)] font-mono tabular-nums mt-1">{metrics.inProgress}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] flex flex-col justify-between shadow-card">
          <span className="text-[11px] text-[var(--text-muted)] font-medium">Overdue</span>
          <span className={`text-xl font-bold font-mono tabular-nums mt-1 ${metrics.overdueCount > 0 ? 'text-[var(--status-danger)]' : 'text-[var(--text-disabled)]'}`}>
            {metrics.overdueCount}
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] flex flex-col justify-between col-span-2 sm:col-span-1 shadow-card">
          <span className="text-[11px] text-[var(--text-muted)] font-medium">Completed</span>
          <span className="text-xl font-bold text-[var(--status-success)] font-mono tabular-nums mt-1">
            {metrics.completed} <span className="text-xs text-[var(--text-muted)] font-normal">({metrics.completionRate}%)</span>
          </span>
        </div>
      </div>

      {/* Filter Tabs, Search & Sort Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-3 shadow-card">
        {/* Filter View Segmented Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
          {(['all', 'today', 'upcoming', 'overdue', 'completed'] as FilterView[]).map((v) => {
            const count = tabCounts[v];
            const isSelected = filterView === v;
            return (
              <button
                key={v}
                onClick={() => setFilterView(v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg capitalize whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-[var(--brand-primary)] text-white shadow-sm font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                <span>{v}</span>
                <span
                  className={`font-mono text-[10px] tabular-nums px-1.5 py-0.5 rounded-md ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-[var(--bg-app)] text-[var(--text-muted)]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search, Categories, Priorities, and Sort Controls */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Live Search */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search tasks or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--brand-primary)]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="in_review">In Review</option>
            <option value="completed">Completed</option>
          </select>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
          >
            <option value="all">All Categories</option>
            <option value="study">Study</option>
            <option value="work">Work</option>
            <option value="career">Career</option>
            <option value="personal">Personal</option>
          </select>

          {/* Priority Dropdown */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
          >
            <option value="dueDateAsc">Due: Earliest First</option>
            <option value="dueDateDesc">Due: Latest First</option>
            <option value="priorityDesc">Priority: Urgent → Low</option>
            <option value="priorityAsc">Priority: Low → Urgent</option>
            <option value="titleAsc">Title: A → Z</option>
            <option value="titleDesc">Title: Z → A</option>
            <option value="createdAtDesc">Recently Created</option>
          </select>
        </div>
      </div>

      {/* Main View: List or Kanban */}
      {layoutMode === 'list' ? (
        <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] divide-y divide-[var(--border-subtle)] overflow-hidden shadow-card transition-colors duration-200">
          {filteredTasks.length === 0 ? (
            <div className="py-16 px-4 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] flex items-center justify-center text-[var(--brand-primary)]">
                <CheckSquare className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  {searchQuery || categoryFilter !== 'all' || priorityFilter !== 'all' || statusFilter !== 'all'
                    ? 'No matching tasks found'
                    : filterView === 'today'
                    ? 'No tasks due today'
                    : filterView === 'overdue'
                    ? 'Zero overdue tasks — Great pace!'
                    : filterView === 'completed'
                    ? 'No completed tasks yet'
                    : 'Your task queue is clear'}
                </h3>
                <p className="text-xs text-[var(--text-muted)] max-w-sm">
                  {searchQuery || categoryFilter !== 'all' || priorityFilter !== 'all' || statusFilter !== 'all'
                    ? 'Try clearing active search terms, status, or category filters to expand your view.'
                    : 'Capture your next deep work focus, syllabus review, or interview preparation.'}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                {(searchQuery || categoryFilter !== 'all' || priorityFilter !== 'all' || statusFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setCategoryFilter('all');
                      setPriorityFilter('all');
                      setStatusFilter('all');
                      setFilterView('all');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    Reset Filters
                  </button>
                )}
                <button
                  onClick={() => handleOpenCreate('todo')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] rounded-lg shadow-sm transition-all glow-purple"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Task</span>
                </button>
              </div>
            </div>
          ) : (
            filteredTasks.map((t) => {
              const isDone = t.status === 'completed';
              const isOverdue = t.dueDate < todayStr && !isDone;
              const linkedProj = availableProjects.find((p) => p.id === t.linkedProjectId);

              return (
                <div
                  key={t.id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[var(--bg-surface-hover)] transition-colors group"
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Complete Checkbox */}
                    <button
                      onClick={() => handleToggle(t.id)}
                      className="mt-0.5 text-[var(--text-muted)] hover:text-[var(--brand-primary)] transition-colors shrink-0 focus:outline-none"
                      title={isDone ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-[var(--status-success)]" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="min-w-0 space-y-1.5 flex-1">
                      {/* Title & Status Pills */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-sm font-semibold transition-colors ${
                            isDone ? 'line-through text-[var(--text-disabled)]' : 'text-[var(--text-primary)]'
                          }`}
                        >
                          {t.title}
                        </span>

                        {isOverdue && (
                          <span className="flex items-center gap-1 text-[10px] text-[var(--status-danger)] font-mono bg-[var(--status-danger)]/10 px-1.5 py-0.5 rounded border border-[var(--status-danger)]/30">
                            <AlertTriangle className="w-3 h-3" />
                            Overdue
                          </span>
                        )}

                        {t.recurring !== 'none' && (
                          <span className="flex items-center gap-1 text-[10px] text-[var(--brand-cyan)] font-mono bg-[var(--brand-cyan)]/10 px-1.5 py-0.5 rounded border border-[var(--brand-cyan)]/30">
                            <Repeat className="w-3 h-3" />
                            {t.recurring}
                          </span>
                        )}

                        {t.reminderEnabled && (
                          <span
                            className="flex items-center gap-1 text-[10px] text-[var(--brand-cyan)] font-mono bg-[var(--brand-cyan)]/10 px-1.5 py-0.5 rounded border border-[var(--brand-cyan)]/30"
                            title={
                              t.reminderMinutesBefore === 0
                                ? 'Reminder set at due time'
                                : `Reminder set: ${t.reminderMinutesBefore || 15}m prior`
                            }
                          >
                            <Bell className="w-3 h-3 text-[var(--brand-cyan)]" />
                            <span>
                              {t.reminderMinutesBefore === 0
                                ? 'At due'
                                : `${t.reminderMinutesBefore || 15}m`}
                            </span>
                          </span>
                        )}

                        <span
                          className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${priorityColor(
                            t.priority
                          )}`}
                        >
                          {t.priority}
                        </span>

                        <span
                          className={`text-[10px] capitalize font-mono px-2 py-0.5 rounded border ${categoryBadge(
                            t.category
                          )}`}
                        >
                          {t.category}
                        </span>
                      </div>

                      {/* Description */}
                      {t.description && (
                        <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-3xl">
                          {t.description}
                        </p>
                      )}

                      {/* Metadata Row: Due Date, Time, Estimate, Tags, Linked Project */}
                      <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] font-mono tabular-nums flex-wrap pt-0.5">
                        <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                          <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          {t.dueDate}
                        </span>

                        {t.dueTime && (
                          <>
                            <span aria-hidden="true" className="text-[var(--text-disabled)]">·</span>
                            <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                              <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                              {t.dueTime}
                            </span>
                          </>
                        )}

                        {t.estimatedMinutes && (
                          <>
                            <span aria-hidden="true" className="text-[var(--text-disabled)]">·</span>
                            <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                              <Hourglass className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                              {t.estimatedMinutes}m
                            </span>
                          </>
                        )}

                        {linkedProj && (
                          <>
                            <span aria-hidden="true" className="text-[var(--text-disabled)]">·</span>
                            <span className="flex items-center gap-1 text-[var(--brand-cyan)]">
                              <FolderGit2 className="w-3 h-3" />
                              {linkedProj.name}
                            </span>
                          </>
                        )}

                        {t.tags.length > 0 && (
                          <>
                            <span aria-hidden="true" className="text-[var(--text-disabled)]">·</span>
                            <div className="flex items-center gap-1">
                              <Tag className="w-3 h-3 text-[var(--text-muted)]" />
                              <span>{t.tags.join(', ')}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Status Dropdown */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {/* Status Select */}
                    <select
                      value={t.status}
                      onChange={(e) => handleStatusChange(t, e.target.value as TaskStatus)}
                      className="text-xs bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg px-2 py-1 text-[var(--text-secondary)] focus:outline-none focus:border-[var(--brand-primary)]"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="in_review">In Review</option>
                      <option value="completed">Completed</option>
                    </select>

                    {/* Reschedule Button */}
                    <button
                      onClick={() => {
                        setReschedulingTask(t);
                        setRescheduleDate(t.dueDate);
                        setRescheduleTime(t.dueTime || '18:00');
                      }}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                      title="Quick Reschedule"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleOpenEdit(t)}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                      title="Edit Task Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeletePrompt(t)}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--status-danger)] hover:bg-[var(--status-danger)]/10 transition-colors"
                      title="Delete Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {columns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-3.5 flex flex-col min-h-[560px] shadow-card transition-colors duration-200"
              >
                {/* Column Header */}
                <div className={`flex items-center justify-between pb-3 border-b ${col.color} mb-3`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <span className="text-xs font-bold text-[var(--text-primary)] tracking-wide">
                      {col.label}
                    </span>
                    <span className="text-xs font-mono text-[var(--text-muted)] tabular-nums bg-[var(--bg-app)] px-2 py-0.5 rounded border border-[var(--border-default)]">
                      {colTasks.length}
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenCreate(col.id)}
                    className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--brand-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                    title={`Add task to ${col.label}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                  {colTasks.length === 0 ? (
                    <div className="py-14 px-3 border border-dashed border-[var(--border-default)] rounded-xl flex flex-col items-center justify-center text-center space-y-2">
                      <span className="text-xs text-[var(--text-muted)] font-medium">No tasks in {col.label}</span>
                      <button
                        onClick={() => handleOpenCreate(col.id)}
                        className="text-[11px] text-[var(--brand-cyan)] hover:underline font-mono flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add item</span>
                      </button>
                    </div>
                  ) : (
                    colTasks.map((t) => {
                      const isOverdue = t.dueDate < todayStr && t.status !== 'completed';
                      return (
                        <div
                          key={t.id}
                          className="p-3.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] hover:border-[var(--brand-primary)]/50 transition-all space-y-2.5 group shadow-sm"
                        >
                          {/* Card Top: Metadata & Quick Controls */}
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] flex-wrap">
                              <span className={`w-1.5 h-1.5 rounded-full ${t.priority === 'urgent' ? 'bg-[var(--status-danger)]' : t.priority === 'high' ? 'bg-[var(--status-warning)]' : t.priority === 'medium' ? 'bg-[var(--brand-cyan)]' : 'bg-[var(--border-default)]'}`} />
                              <span className={`font-mono capitalize font-medium ${t.priority === 'urgent' ? 'text-[var(--status-danger)]' : t.priority === 'high' ? 'text-[var(--status-warning)]' : t.priority === 'medium' ? 'text-[var(--brand-cyan)]' : 'text-[var(--text-muted)]'}`}>
                                {t.priority}
                              </span>
                              <span aria-hidden="true" className="text-[var(--text-disabled)]">·</span>
                              <span className="capitalize">{t.category.replace('_', ' ')}</span>
                              {t.reminderEnabled && (
                                <>
                                  <span aria-hidden="true" className="text-[var(--text-disabled)]">·</span>
                                  <span
                                    className="flex items-center gap-0.5 text-[var(--brand-cyan)]"
                                    title={`Reminder active: ${t.reminderMinutesBefore === 0 ? 'at due time' : `${t.reminderMinutesBefore}m prior`}`}
                                  >
                                    <Bell className="w-2.5 h-2.5" />
                                  </span>
                                </>
                              )}
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleOpenEdit(t)}
                                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                                title="Edit Task"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeletePrompt(t)}
                                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--status-danger)] hover:bg-[var(--status-danger)]/10 transition-colors"
                                title="Delete Task"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Title with Checkbox */}
                          <div className="flex items-start gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggle(t.id);
                              }}
                              className="mt-0.5 text-[var(--text-muted)] hover:text-[var(--brand-primary)] transition-colors shrink-0 focus:outline-none"
                              title={t.status === 'completed' ? 'Mark incomplete' : 'Mark complete'}
                            >
                              {t.status === 'completed' ? (
                                <CheckCircle2 className="w-4 h-4 text-[var(--status-success)]" />
                              ) : (
                                <Circle className="w-4 h-4" />
                              )}
                            </button>
                            <div
                              onClick={() => handleOpenEdit(t)}
                              className={`text-xs font-semibold leading-snug cursor-pointer hover:text-[var(--brand-secondary)] transition-colors flex-1 ${
                                t.status === 'completed' ? 'line-through text-[var(--text-disabled)]' : 'text-[var(--text-primary)]'
                              }`}
                            >
                              {t.title}
                            </div>
                          </div>

                          {/* Description */}
                          {t.description && (
                            <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                              {t.description}
                            </p>
                          )}

                          {/* Metadata row */}
                          <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] font-mono">
                            <span className={`flex items-center gap-1 ${isOverdue ? 'text-[var(--status-danger)] font-bold' : ''}`}>
                              <Calendar className="w-3 h-3 text-[var(--text-muted)]" />
                              {t.dueDate}
                              {t.dueTime && <span className="text-[var(--text-secondary)]">· {t.dueTime}</span>}
                            </span>
                            {t.estimatedMinutes && <span>{t.estimatedMinutes}m</span>}
                          </div>

                          {/* Workflow Stage Transitions */}
                          <div className="flex items-center justify-between pt-1.5 border-t border-[var(--border-subtle)] gap-1">
                            <button
                              disabled={col.id === 'todo'}
                              onClick={() => handleMoveStage(t, 'prev')}
                              className="px-2 py-1 rounded bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-default)] disabled:opacity-30 disabled:cursor-not-allowed text-[10px] text-[var(--text-secondary)] flex items-center gap-1 transition-colors"
                              title="Move to previous stage"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>

                            <select
                              value={t.status}
                              onChange={(e) => handleStatusChange(t, e.target.value as TaskStatus)}
                              className="flex-1 text-[10px] bg-[var(--bg-input)] border border-[var(--border-default)] rounded px-1.5 py-1 text-[var(--text-secondary)] focus:outline-none focus:border-[var(--brand-primary)]"
                            >
                              <option value="todo">To Do</option>
                              <option value="in_progress">In Progress</option>
                              <option value="in_review">In Review</option>
                              <option value="completed">Completed</option>
                            </select>

                            <button
                              disabled={col.id === 'completed'}
                              onClick={() => handleMoveStage(t, 'next')}
                              className="px-2 py-1 rounded bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-default)] disabled:opacity-30 disabled:cursor-not-allowed text-[10px] text-[var(--text-secondary)] flex items-center gap-1 transition-colors"
                              title="Move to next stage"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Creation & Editing Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] rounded-2xl shadow-elevated overflow-hidden max-h-[92vh] flex flex-col transition-colors duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[var(--brand-primary)]" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  {editingTask ? 'Edit Task Details' : 'Create New Task'}
                </h3>
              </div>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveTaskForm} className="p-6 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-2.5 rounded-lg bg-[var(--status-danger)]/15 border border-[var(--status-danger)]/40 text-xs text-[var(--status-danger)]">
                  {formError}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Task Title <span className="text-[var(--brand-primary)]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master KV cache memory calculation"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--brand-primary)]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Description / Context
                </label>
                <textarea
                  rows={2}
                  placeholder="Specific objectives, acceptance criteria, or reference links..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--brand-primary)] resize-none"
                />
              </div>

              {/* Priority, Category, Status */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as Priority)}
                    className="w-full px-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as TaskCategory)}
                    className="w-full px-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                  >
                    <option value="study">Study</option>
                    <option value="work">Work</option>
                    <option value="career">Career</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as TaskStatus)}
                    className="w-full px-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="in_review">In Review</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Due Date & Due Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Due Date <span className="text-[var(--brand-primary)]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Due Time</label>
                  <input
                    type="time"
                    value={formDueTime}
                    onChange={(e) => setFormDueTime(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>
              </div>

              {/* Estimate & Recurrence */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Estimate (Minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={480}
                    step={5}
                    value={formEstimatedMinutes}
                    onChange={(e) => setFormEstimatedMinutes(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Recurrence</label>
                  <select
                    value={formRecurring}
                    onChange={(e) => setFormRecurring(e.target.value as RecurringFrequency)}
                    className="w-full px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                  >
                    <option value="none">Does not repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              {/* Linked Project (Optional) */}
              {availableProjects.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Linked Architecture Project (Optional)
                  </label>
                  <select
                    value={formLinkedProjectId}
                    onChange={(e) => setFormLinkedProjectId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                  >
                    <option value="">No linked project</option>
                    {availableProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.category})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Tags */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="GenAI, Math, GATE, PyTorch"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--brand-primary)]"
                />
              </div>

              {/* Optional Reminder */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[var(--brand-cyan)]" />
                    <div>
                      <div className="text-xs font-semibold text-[var(--text-primary)]">Set Reminder Notification</div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        In-app floating alert & browser notifications when due
                      </div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formReminderEnabled}
                      onChange={(e) => setFormReminderEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[var(--bg-app)] border border-[var(--border-default)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--brand-primary)]"></div>
                  </label>
                </div>

                {formReminderEnabled && (
                  <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                    <span className="text-[var(--text-secondary)] font-medium">Trigger Alert</span>
                    <select
                      value={formReminderMinutesBefore}
                      onChange={(e) => setFormReminderMinutesBefore(Number(e.target.value))}
                      className="px-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                    >
                      <option value={0}>At due time</option>
                      <option value={15}>15 minutes before</option>
                      <option value={30}>30 minutes before</option>
                      <option value={60}>1 hour before</option>
                      <option value={1440}>1 day before</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] disabled:opacity-60 rounded-lg shadow-sm transition-all glow-purple"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isSubmitting
                      ? 'Saving...'
                      : editingTask
                      ? 'Save Changes'
                      : 'Create Task'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Reschedule Popup Modal */}
      {reschedulingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] rounded-2xl shadow-elevated p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Reschedule Task</h3>
              <button
                onClick={() => setReschedulingTask(null)}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)] font-medium truncate">
              {reschedulingTask.title}
            </p>

            <form onSubmit={handleQuickReschedule} className="space-y-3">
              {/* Presets */}
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1.5">
                  Quick Presets
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setReschedulePreset(0)}
                    className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--brand-primary)] transition-colors text-left"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setReschedulePreset(1)}
                    className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--brand-primary)] transition-colors text-left"
                  >
                    Tomorrow (+1d)
                  </button>
                  <button
                    type="button"
                    onClick={() => setReschedulePreset(2)}
                    className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--brand-primary)] transition-colors text-left"
                  >
                    In 2 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setReschedulePreset(7)}
                    className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--brand-primary)] transition-colors text-left"
                  >
                    Next Week (+7d)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">New Due Date</label>
                <input
                  type="date"
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">New Due Time</label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setReschedulingTask(null)}
                  className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] rounded-lg shadow-sm glow-purple"
                >
                  Update Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-[var(--bg-surface-elevated)] border border-[var(--status-danger)]/40 rounded-2xl shadow-elevated p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[var(--status-danger)]">
                <Trash2 className="w-4 h-4" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Delete Task</h3>
              </div>
              <button
                onClick={() => setTaskToDelete(null)}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)]">
              Are you sure you want to delete <span className="text-[var(--text-primary)] font-semibold">"{taskToDelete.title}"</span>? This will permanently remove this item from your workspace.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-surface-hover)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[var(--status-danger)] hover:bg-[var(--status-danger)]/80 rounded-lg shadow-sm"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
