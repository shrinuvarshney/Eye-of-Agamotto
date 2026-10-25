/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  FolderGit2,
  Plus,
  Search,
  ExternalLink,
  Github,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Tag,
  Trash2,
  Edit2,
  Sparkles,
  CheckSquare,
  Link2,
  Unlink,
  AlertTriangle,
  X,
  Check,
  ChevronRight,
  ChevronDown,
  Filter,
  BarChart3,
  CalendarDays,
  ListTodo,
} from 'lucide-react';
import { Project, ProjectStatus, ProjectMilestone, Task, Priority, NavigationItem } from '../types';
import { storageService } from '../services/storageService';

interface ProjectsPageProps {
  projects: Project[];
  tasks: Task[];
  onProjectsChange: () => void;
  onTasksChange: () => void;
  onNavigate?: (nav: NavigationItem) => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  projects,
  tasks,
  onProjectsChange,
  onTasksChange,
  onNavigate,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(projects[0]?.id || null);

  // Add / Edit Project Modal state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<'GenAI' | 'Full-Stack' | 'Systems' | 'Personal'>('GenAI');
  const [formDeadline, setFormDeadline] = useState('');
  const [formStatus, setFormStatus] = useState<ProjectStatus>('active');
  const [formTags, setFormTags] = useState('');
  const [formRepoUrl, setFormRepoUrl] = useState('');
  const [formLiveUrl, setFormLiveUrl] = useState('');

  // Milestone inline creation state
  const [newMilestoneTitle, setNewMilestoneTitle] = useState<Record<string, string>>({});
  const [newMilestoneDate, setNewMilestoneDate] = useState<Record<string, string>>({});
  const [isAddingMilestone, setIsAddingMilestone] = useState<Record<string, boolean>>({});

  // Milestone edit modal state
  const [editingMilestone, setEditingMilestone] = useState<{
    projectId: string;
    milestone: ProjectMilestone;
  } | null>(null);

  // Quick Task Creation state per project
  const [isQuickTaskOpen, setIsQuickTaskOpen] = useState<Record<string, boolean>>({});
  const [quickTaskTitle, setQuickTaskTitle] = useState<Record<string, string>>({});
  const [quickTaskPriority, setQuickTaskPriority] = useState<Record<string, Priority>>({});

  // Link existing task dropdown state
  const [isLinkingTask, setIsLinkingTask] = useState<Record<string, boolean>>({});
  const [selectedTaskToLink, setSelectedTaskToLink] = useState<Record<string, string>>({});

  // Delete project confirmation modal
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Calculate actual progress from completed items (milestones + linked tasks)
  const calculateProjectMetrics = (project: Project) => {
    const linkedTasks = tasks.filter((t) => t.linkedProjectId === project.id);
    const totalMilestones = project.milestones.length;
    const completedMilestones = project.milestones.filter((m) => m.completed).length;

    const totalTasks = linkedTasks.length;
    const completedTasks = linkedTasks.filter((t) => t.status === 'completed').length;

    const totalItems = totalMilestones + totalTasks;
    const completedItems = completedMilestones + completedTasks;

    let computedProgress = 0;
    if (totalItems > 0) {
      computedProgress = Math.round((completedItems / totalItems) * 100);
    } else {
      computedProgress = project.status === 'completed' ? 100 : 0;
    }

    // Determine deadline status
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;

    let deadlineStatus: 'completed' | 'overdue' | 'due-today' | 'upcoming' | 'none' = 'none';
    let daysRemaining: number | null = null;

    if (project.status === 'completed' || computedProgress === 100) {
      deadlineStatus = 'completed';
    } else if (project.deadline) {
      if (project.deadline < today) {
        deadlineStatus = 'overdue';
      } else if (project.deadline === today) {
        deadlineStatus = 'due-today';
      } else {
        deadlineStatus = 'upcoming';
        const dTarget = new Date(project.deadline).getTime();
        const dCurrent = new Date(today).getTime();
        daysRemaining = Math.max(0, Math.ceil((dTarget - dCurrent) / (1000 * 60 * 60 * 24)));
      }
    }

    return {
      linkedTasks,
      totalMilestones,
      completedMilestones,
      totalTasks,
      completedTasks,
      totalItems,
      completedItems,
      computedProgress,
      deadlineStatus,
      daysRemaining,
    };
  };

  // Overall statistics
  const overallStats = useMemo(() => {
    let totalItemsAll = 0;
    let completedItemsAll = 0;
    let activeCount = 0;
    let completedCount = 0;

    projects.forEach((p) => {
      if (p.status === 'completed') completedCount++;
      if (p.status === 'active') activeCount++;

      const metrics = calculateProjectMetrics(p);
      totalItemsAll += metrics.totalItems;
      completedItemsAll += metrics.completedItems;
    });

    const overallRate = totalItemsAll > 0 ? Math.round((completedItemsAll / totalItemsAll) * 100) : 0;

    return {
      totalProjects: projects.length,
      activeCount,
      completedCount,
      totalItemsAll,
      completedItemsAll,
      overallRate,
    };
  }, [projects, tasks]);

  // Filtered project list
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesDesc = p.description.toLowerCase().includes(q);
        const matchesTags = p.tags.some((t) => t.toLowerCase().includes(q));
        const matchesMilestone = p.milestones.some((m) => m.title.toLowerCase().includes(q));
        const linked = tasks.filter((t) => t.linkedProjectId === p.id);
        const matchesLinkedTask = linked.some((t) => t.title.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesTags && !matchesMilestone && !matchesLinkedTask) {
          return false;
        }
      }
      return true;
    });
  }, [projects, tasks, statusFilter, categoryFilter, searchQuery]);

  // Handlers for Project CRUD
  const handleOpenCreateProject = () => {
    const today = new Date();
    today.setMonth(today.getMonth() + 1);
    const defaultDate = today.toISOString().split('T')[0];

    setEditingProjectId(null);
    setFormName('');
    setFormDescription('');
    setFormCategory('GenAI');
    setFormDeadline(defaultDate);
    setFormStatus('active');
    setFormTags('TypeScript, Python, Architecture');
    setFormRepoUrl('');
    setFormLiveUrl('');
    setIsProjectModalOpen(true);
  };

  const handleOpenEditProject = (p: Project) => {
    setEditingProjectId(p.id);
    setFormName(p.name);
    setFormDescription(p.description);
    setFormCategory(p.category);
    setFormDeadline(p.deadline);
    setFormStatus(p.status);
    setFormTags(p.tags.join(', '));
    setFormRepoUrl(p.repoUrl || '');
    setFormLiveUrl(p.liveUrl || '');
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingProjectId) {
      const existing = projects.find((p) => p.id === editingProjectId);
      if (existing) {
        storageService.updateProject({
          ...existing,
          name: formName.trim(),
          description: formDescription.trim(),
          category: formCategory,
          deadline: formDeadline,
          status: formStatus,
          tags: formTags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          repoUrl: formRepoUrl.trim() || undefined,
          liveUrl: formLiveUrl.trim() || undefined,
          isDemoData: false,
        });
      }
    } else {
      const defaultDate = formDeadline || new Date().toISOString().split('T')[0];
      storageService.addProject({
        name: formName.trim(),
        description: formDescription.trim(),
        category: formCategory,
        deadline: defaultDate,
        status: formStatus,
        progress: 0,
        tags: formTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        milestones: [
          {
            id: `m-${Date.now()}-1`,
            title: 'System architecture & specification',
            dueDate: defaultDate,
            completed: false,
          },
          {
            id: `m-${Date.now()}-2`,
            title: 'Core prototype development',
            dueDate: defaultDate,
            completed: false,
          },
        ],
        isDemoData: false,
        repoUrl: formRepoUrl.trim() || undefined,
        liveUrl: formLiveUrl.trim() || undefined,
      });
    }

    setIsProjectModalOpen(false);
    onProjectsChange();
  };

  const handleConfirmDeleteProject = () => {
    if (!projectToDelete) return;
    storageService.deleteProject(projectToDelete.id);
    // Also unlink tasks linked to this project
    tasks
      .filter((t) => t.linkedProjectId === projectToDelete.id)
      .forEach((t) => storageService.linkTaskToProject(t.id, undefined));
    setProjectToDelete(null);
    onProjectsChange();
    onTasksChange();
  };

  // Handlers for Milestones
  const handleToggleMilestone = (projectId: string, milestoneId: string) => {
    storageService.toggleProjectMilestone(projectId, milestoneId);
    onProjectsChange();
  };

  const handleAddMilestone = (projectId: string) => {
    const title = newMilestoneTitle[projectId]?.trim();
    if (!title) return;
    const proj = projects.find((p) => p.id === projectId);
    const date = newMilestoneDate[projectId] || proj?.deadline || new Date().toISOString().split('T')[0];

    storageService.addProjectMilestone(projectId, {
      title,
      dueDate: date,
      completed: false,
    });

    setNewMilestoneTitle((prev) => ({ ...prev, [projectId]: '' }));
    setIsAddingMilestone((prev) => ({ ...prev, [projectId]: false }));
    onProjectsChange();
  };

  const handleSaveMilestoneEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMilestone || !editingMilestone.milestone.title.trim()) return;

    storageService.updateProjectMilestone(editingMilestone.projectId, editingMilestone.milestone);
    setEditingMilestone(null);
    onProjectsChange();
  };

  const handleDeleteMilestone = (projectId: string, milestoneId: string) => {
    storageService.deleteProjectMilestone(projectId, milestoneId);
    onProjectsChange();
  };

  // Handlers for Linked Tasks
  const handleToggleLinkedTask = (taskId: string) => {
    storageService.toggleTaskCompletion(taskId);
    onTasksChange();
    onProjectsChange();
  };

  const handleUnlinkTask = (taskId: string) => {
    storageService.linkTaskToProject(taskId, undefined);
    onTasksChange();
    onProjectsChange();
  };

  const handleLinkExistingTask = (projectId: string) => {
    const taskId = selectedTaskToLink[projectId];
    if (!taskId) return;
    storageService.linkTaskToProject(taskId, projectId);
    setSelectedTaskToLink((prev) => ({ ...prev, [projectId]: '' }));
    setIsLinkingTask((prev) => ({ ...prev, [projectId]: false }));
    onTasksChange();
    onProjectsChange();
  };

  const handleCreateLinkedTask = (projectId: string) => {
    const title = quickTaskTitle[projectId]?.trim();
    if (!title) return;
    const proj = projects.find((p) => p.id === projectId);
    const priority = quickTaskPriority[projectId] || 'medium';

    storageService.addTask({
      title,
      priority,
      category: 'work',
      status: 'todo',
      dueDate: proj?.deadline || new Date().toISOString().split('T')[0],
      recurring: 'none',
      tags: proj ? [proj.category, ...proj.tags.slice(0, 2)] : ['project'],
      linkedProjectId: projectId,
    });

    setQuickTaskTitle((prev) => ({ ...prev, [projectId]: '' }));
    setIsQuickTaskOpen((prev) => ({ ...prev, [projectId]: false }));
    onTasksChange();
    onProjectsChange();
  };

  // Unlinked tasks eligible to link
  const getUnlinkedTasks = (currentProjectId: string) => {
    return tasks.filter((t) => !t.linkedProjectId || t.linkedProjectId !== currentProjectId);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#F1F5F9] tracking-tight">
            Project Architecture & Portfolios
          </h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Full lifecycle tracking: dynamic milestone progress, linked execution tasks, deadlines, and live metrics
          </p>
        </div>

        <button
          onClick={handleOpenCreateProject}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#080C12] bg-[#10B981] hover:bg-[#059669] rounded-xl shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#101722] border border-[#263548] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-[#94A3B8]">Total Projects</p>
            <p className="text-xl font-bold text-[#F1F5F9] mt-1">{overallStats.totalProjects}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-[#082B2A] border border-[#0D9488]/40 text-[#2DD4BF]">
            <FolderGit2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#101722] border border-[#263548] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-[#94A3B8]">Active Pipelines</p>
            <p className="text-xl font-bold text-[#10B981] mt-1">{overallStats.activeCount}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-[#082B2A] border border-[#0D9488]/40 text-[#10B981]">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#101722] border border-[#263548] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-[#94A3B8]">Completed Projects</p>
            <p className="text-xl font-bold text-[#2DD4BF] mt-1">{overallStats.completedCount}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-[#082B2A] border border-[#0D9488]/40 text-[#2DD4BF]">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#101722] border border-[#263548] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-[#94A3B8]">Items Completed</p>
            <p className="text-xl font-bold text-[#F1F5F9] mt-1">
              {overallStats.completedItemsAll}
              <span className="text-xs text-[#64748B] font-normal"> / {overallStats.totalItemsAll}</span>
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-[#172231] border border-[#263548] text-[#A78BFA]">
            <BarChart3 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl bg-[#101722] border border-[#263548]">
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {(['all', 'active', 'planning', 'in_review', 'completed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#082B2A] text-[#2DD4BF] border border-[#0D9488] font-semibold'
                  : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1C2A3B]'
              }`}
            >
              {st === 'all' ? 'All Statuses' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Category & Search */}
        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[#0A1018] border border-[#263548] rounded-xl text-xs text-[#CBD5E1] focus:outline-none focus:border-[#5EEAD4]"
          >
            <option value="all">All Domains</option>
            <option value="GenAI">GenAI</option>
            <option value="Full-Stack">Full-Stack</option>
            <option value="Systems">Systems</option>
            <option value="Personal">Personal</option>
          </select>

          <div className="relative w-44 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search projects, tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#0A1018] border border-[#263548] rounded-xl text-xs text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[#5EEAD4]"
            />
          </div>
        </div>
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#101722] border border-[#263548] space-y-3">
          <FolderGit2 className="w-10 h-10 text-[#64748B] mx-auto" />
          <h3 className="text-sm font-semibold text-[#F1F5F9]">No projects found</h3>
          <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
              ? 'No projects match your active search or filters. Try clearing filters.'
              : 'Start your first engineering project to track milestones and tasks.'}
          </p>
          <button
            onClick={handleOpenCreateProject}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-[#080C12] bg-[#10B981] hover:bg-[#059669] rounded-xl cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Project</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((p) => {
            const metrics = calculateProjectMetrics(p);
            const isExpanded = expandedProjectId === p.id;

            return (
              <div
                key={p.id}
                className="rounded-2xl bg-[#101722] border border-[#263548] hover:border-[#263548]/90 transition-all overflow-hidden shadow-sm"
              >
                {/* Project Header Bar */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold bg-[#082B2A] text-[#2DD4BF] border border-[#0D9488]/50">
                          {p.category}
                        </span>

                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-md uppercase font-semibold border ${
                            p.status === 'completed'
                              ? 'bg-[#082B2A] text-[#10B981] border-[#0D9488]'
                              : p.status === 'active'
                              ? 'bg-[#082B2A] text-[#2DD4BF] border-[#0D9488]'
                              : p.status === 'in_review'
                              ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                              : 'bg-[#172231] text-[#94A3B8] border-[#263548]'
                          }`}
                        >
                          {p.status.replace('_', ' ')}
                        </span>

                        {/* Deadline Badge */}
                        {p.deadline && (
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md border ${
                              metrics.deadlineStatus === 'overdue'
                                ? 'bg-rose-950/60 text-[#FB7185] border-rose-500/40 font-bold'
                                : metrics.deadlineStatus === 'due-today'
                                ? 'bg-amber-950/60 text-[#FBBF24] border-amber-500/40 font-bold'
                                : metrics.deadlineStatus === 'completed'
                                ? 'bg-[#082B2A] text-[#10B981] border-[#0D9488]'
                                : 'bg-[#172231] text-[#CBD5E1] border-[#263548]'
                            }`}
                          >
                            <CalendarDays className="w-3 h-3" />
                            <span>Due {p.deadline}</span>
                            {metrics.deadlineStatus === 'overdue' && <span>(Overdue)</span>}
                            {metrics.deadlineStatus === 'due-today' && <span>(Today)</span>}
                            {metrics.deadlineStatus === 'upcoming' && metrics.daysRemaining !== null && (
                              <span className="text-[10px] text-[#94A3B8]">({metrics.daysRemaining}d left)</span>
                            )}
                          </span>
                        )}
                      </div>

                      <h2 className="text-base sm:text-lg font-bold text-[#F1F5F9] tracking-tight flex items-center gap-2">
                        <span>{p.name}</span>
                      </h2>

                      <p className="text-xs text-[#CBD5E1] leading-relaxed max-w-3xl">
                        {p.description}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {p.repoUrl && (
                        <a
                          href={p.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-xl text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1C2A3B] transition-colors"
                          title="View Repository"
                        >
                          <Github className="w-4 h-4" />
                        </a>
                      )}

                      {p.liveUrl && (
                        <a
                          href={p.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-xl text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1C2A3B] transition-colors"
                          title="View Live App"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}

                      <button
                        onClick={() => handleOpenEditProject(p)}
                        className="p-1.5 rounded-xl text-[#94A3B8] hover:text-[#10B981] hover:bg-[#1C2A3B] transition-colors cursor-pointer"
                        title="Edit Project"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setProjectToDelete(p)}
                        className="p-1.5 rounded-xl text-[#94A3B8] hover:text-[#FB7185] hover:bg-[#1C2A3B] transition-colors cursor-pointer"
                        title="Delete Project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() =>
                          setExpandedProjectId((prev) => (prev === p.id ? null : p.id))
                        }
                        className="p-1.5 rounded-xl text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1C2A3B] transition-colors cursor-pointer"
                        title={isExpanded ? 'Collapse milestones & tasks' : 'Expand milestones & tasks'}
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-[#10B981]" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Calculated Progress Bar based on actual items */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#CBD5E1]">Execution Progress</span>
                        <span className="text-[11px] font-mono text-[#94A3B8]">
                          ({metrics.completedItems}/{metrics.totalItems} completed items)
                        </span>
                      </div>
                      <span className="font-mono font-bold text-[#10B981]">
                        {metrics.computedProgress}%
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-[#0A1018] overflow-hidden border border-[#263548]/40">
                      <div
                        className="h-full bg-gradient-to-r from-[#0D9488] to-[#10B981] rounded-full transition-all duration-500 shadow-sm"
                        style={{ width: `${metrics.computedProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  {p.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {p.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0A1018] border border-[#263548] text-[10px] text-[#94A3B8] font-mono"
                        >
                          <Tag className="w-2.5 h-2.5" />
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Collapsible Milestones & Linked Tasks Section */}
                {isExpanded && (
                  <div className="border-t border-[#263548] bg-[#080C12]/50 p-5 sm:p-6 space-y-6 animate-in fade-in duration-150">
                    {/* SECTION 1: Milestones */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                          <h3 className="text-xs font-bold text-[#F1F5F9] uppercase tracking-wider">
                            Project Milestones ({metrics.completedMilestones}/{metrics.totalMilestones})
                          </h3>
                        </div>

                        <button
                          onClick={() =>
                            setIsAddingMilestone((prev) => ({ ...prev, [p.id]: !prev[p.id] }))
                          }
                          className="flex items-center gap-1 text-[11px] font-semibold text-[#10B981] hover:text-[#2DD4BF] transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Milestone</span>
                        </button>
                      </div>

                      {/* Add Milestone Inline Form */}
                      {isAddingMilestone[p.id] && (
                        <div className="p-3 rounded-xl bg-[#101722] border border-[#263548] flex flex-col sm:flex-row items-center gap-2 animate-in fade-in">
                          <input
                            type="text"
                            placeholder="Milestone title (e.g. Database schema migration)..."
                            value={newMilestoneTitle[p.id] || ''}
                            onChange={(e) =>
                              setNewMilestoneTitle((prev) => ({ ...prev, [p.id]: e.target.value }))
                            }
                            className="flex-1 px-3 py-1.5 bg-[#0A1018] border border-[#263548] rounded-xl text-xs text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[#5EEAD4]"
                          />
                          <input
                            type="date"
                            value={newMilestoneDate[p.id] || p.deadline || ''}
                            onChange={(e) =>
                              setNewMilestoneDate((prev) => ({ ...prev, [p.id]: e.target.value }))
                            }
                            className="px-2.5 py-1.5 bg-[#0A1018] border border-[#263548] rounded-xl text-xs text-[#CBD5E1] focus:outline-none focus:border-[#5EEAD4]"
                          />
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleAddMilestone(p.id)}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#080C12] bg-[#10B981] hover:bg-[#059669] transition-colors cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              onClick={() =>
                                setIsAddingMilestone((prev) => ({ ...prev, [p.id]: false }))
                              }
                              className="p-1.5 rounded-xl text-[#94A3B8] hover:text-[#F1F5F9]"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Milestone list */}
                      {p.milestones.length === 0 ? (
                        <p className="text-xs text-[#64748B] italic py-1">
                          No milestones recorded yet. Click &quot;Add Milestone&quot; to define project phases.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {p.milestones.map((m) => (
                            <div
                              key={m.id}
                              className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                                m.completed
                                  ? 'bg-[#101722]/60 border-[#10B981]/20 text-[#64748B]'
                                  : 'bg-[#101722] border-[#263548] text-[#CBD5E1] hover:border-[#263548]/90'
                              }`}
                            >
                              <div
                                onClick={() => handleToggleMilestone(p.id, m.id)}
                                className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                              >
                                {m.completed ? (
                                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                                ) : (
                                  <Circle className="w-4 h-4 text-[#64748B] group-hover:text-[#10B981] transition-colors shrink-0" />
                                )}
                                <span
                                  className={`text-xs truncate ${
                                    m.completed ? 'line-through text-[#64748B]' : 'font-medium text-[#F1F5F9]'
                                  }`}
                                >
                                  {m.title}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {m.dueDate && (
                                  <span className="text-[11px] font-mono text-[#94A3B8]">
                                    {m.dueDate}
                                  </span>
                                )}

                                <button
                                  onClick={() => setEditingMilestone({ projectId: p.id, milestone: { ...m } })}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-[#94A3B8] hover:text-[#F1F5F9] transition-opacity cursor-pointer"
                                  title="Edit Milestone"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleDeleteMilestone(p.id, m.id)}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-[#94A3B8] hover:text-[#FB7185] transition-opacity cursor-pointer"
                                  title="Delete Milestone"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* SECTION 2: Linked Tasks */}
                    <div className="space-y-3 pt-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <ListTodo className="w-4 h-4 text-[#2DD4BF]" />
                          <h3 className="text-xs font-bold text-[#F1F5F9] uppercase tracking-wider">
                            Linked Tasks ({metrics.completedTasks}/{metrics.totalTasks})
                          </h3>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setIsQuickTaskOpen((prev) => ({ ...prev, [p.id]: !prev[p.id] }))
                            }
                            className="flex items-center gap-1 text-[11px] font-semibold text-[#10B981] hover:text-[#2DD4BF] transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Quick Add Task</span>
                          </button>

                          <button
                            onClick={() =>
                              setIsLinkingTask((prev) => ({ ...prev, [p.id]: !prev[p.id] }))
                            }
                            className="flex items-center gap-1 text-[11px] font-semibold text-[#94A3B8] hover:text-[#CBD5E1] transition-colors cursor-pointer"
                          >
                            <Link2 className="w-3.5 h-3.5" />
                            <span>Link Existing Task</span>
                          </button>
                        </div>
                      </div>

                      {/* Quick Add Task Form */}
                      {isQuickTaskOpen[p.id] && (
                        <div className="p-3 rounded-xl bg-[#101722] border border-[#263548] flex flex-col sm:flex-row items-center gap-2 animate-in fade-in">
                          <input
                            type="text"
                            placeholder="Task headline (e.g. Implement WebSocket reconnection logic)..."
                            value={quickTaskTitle[p.id] || ''}
                            onChange={(e) =>
                              setQuickTaskTitle((prev) => ({ ...prev, [p.id]: e.target.value }))
                            }
                            className="flex-1 px-3 py-1.5 bg-[#0A1018] border border-[#263548] rounded-xl text-xs text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[#5EEAD4]"
                          />
                          <select
                            value={quickTaskPriority[p.id] || 'medium'}
                            onChange={(e) =>
                              setQuickTaskPriority((prev) => ({
                                ...prev,
                                [p.id]: e.target.value as Priority,
                              }))
                            }
                            className="px-2.5 py-1.5 bg-[#0A1018] border border-[#263548] rounded-xl text-xs text-[#CBD5E1] focus:outline-none focus:border-[#5EEAD4]"
                          >
                            <option value="urgent">Urgent</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                          </select>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleCreateLinkedTask(p.id)}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#080C12] bg-[#10B981] hover:bg-[#059669] transition-colors cursor-pointer"
                            >
                              Add
                            </button>
                            <button
                              onClick={() =>
                                setIsQuickTaskOpen((prev) => ({ ...prev, [p.id]: false }))
                              }
                              className="p-1.5 rounded-xl text-[#94A3B8] hover:text-[#F1F5F9]"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Link Existing Task Form */}
                      {isLinkingTask[p.id] && (
                        <div className="p-3 rounded-xl bg-[#101722] border border-[#263548] flex items-center gap-2 animate-in fade-in">
                          <select
                            value={selectedTaskToLink[p.id] || ''}
                            onChange={(e) =>
                              setSelectedTaskToLink((prev) => ({ ...prev, [p.id]: e.target.value }))
                            }
                            className="flex-1 px-3 py-1.5 bg-[#0A1018] border border-[#263548] rounded-xl text-xs text-[#CBD5E1] focus:outline-none focus:border-[#5EEAD4]"
                          >
                            <option value="">Select a task to link...</option>
                            {getUnlinkedTasks(p.id).map((t) => (
                              <option key={t.id} value={t.id}>
                                [{t.priority.toUpperCase()}] {t.title} ({t.status})
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleLinkExistingTask(p.id)}
                            disabled={!selectedTaskToLink[p.id]}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#080C12] bg-[#10B981] hover:bg-[#059669] transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            Link
                          </button>
                          <button
                            onClick={() =>
                              setIsLinkingTask((prev) => ({ ...prev, [p.id]: false }))
                            }
                            className="p-1.5 rounded-xl text-[#94A3B8] hover:text-[#F1F5F9]"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* Linked Task List */}
                      {metrics.linkedTasks.length === 0 ? (
                        <p className="text-xs text-[#64748B] italic py-1">
                          No tasks linked to this project yet. Click &quot;Quick Add Task&quot; or &quot;Link Existing Task&quot;.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {metrics.linkedTasks.map((t) => {
                            const isDone = t.status === 'completed';

                            return (
                              <div
                                key={t.id}
                                className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                                  isDone
                                    ? 'bg-[#101722]/60 border-[#10B981]/20 text-[#64748B]'
                                    : 'bg-[#101722] border-[#263548] text-[#CBD5E1] hover:border-[#263548]/90'
                                }`}
                              >
                                <div
                                  onClick={() => handleToggleLinkedTask(t.id)}
                                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                                >
                                  {isDone ? (
                                    <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-[#64748B] group-hover:text-[#10B981] transition-colors shrink-0" />
                                  )}
                                  <span
                                    className={`text-xs truncate ${
                                      isDone ? 'line-through text-[#64748B]' : 'font-medium text-[#F1F5F9]'
                                    }`}
                                  >
                                    {t.title}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span
                                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded border uppercase font-bold ${
                                      t.priority === 'urgent'
                                        ? 'bg-rose-950/60 text-[#FB7185] border-rose-500/40'
                                        : t.priority === 'high'
                                        ? 'bg-amber-950/60 text-[#FBBF24] border-amber-500/40'
                                        : 'bg-[#172231] text-[#94A3B8] border-[#263548]'
                                    }`}
                                  >
                                    {t.priority}
                                  </span>

                                  {t.dueDate && (
                                    <span className="text-[11px] font-mono text-[#94A3B8]">
                                      {t.dueDate}
                                    </span>
                                  )}

                                  <button
                                    onClick={() => handleUnlinkTask(t.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-[#94A3B8] hover:text-[#FB7185] transition-opacity cursor-pointer"
                                    title="Unlink from project"
                                  >
                                    <Unlink className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT PROJECT MODAL */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-[#101722] border border-[#263548] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#263548]">
              <h3 className="text-base font-bold text-[#F1F5F9] flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-[#10B981]" />
                <span>{editingProjectId ? 'Edit Project' : 'Create New Project'}</span>
              </h3>
              <button
                onClick={() => setIsProjectModalOpen(false)}
                className="p-1 rounded-xl text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1C2A3B] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Consensus Engine"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0A1018] border border-[#263548] rounded-xl text-xs text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[#5EEAD4] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe architectural intent, engineering stack, and goals..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0A1018] border border-[#263548] rounded-xl text-xs text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[#5EEAD4] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                    Domain Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) =>
                      setFormCategory(e.target.value as 'GenAI' | 'Full-Stack' | 'Systems' | 'Personal')
                    }
                    className="w-full px-3 py-2 bg-[#0A1018] border border-[#263548] rounded-xl text-xs text-[#F1F5F9] focus:outline-none focus:border-[#5EEAD4]"
                  >
                    <option value="GenAI">GenAI</option>
                    <option value="Full-Stack">Full-Stack</option>
                    <option value="Systems">Systems</option>
                    <option value="Personal">Personal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ProjectStatus)}
                    className="w-full px-3 py-2 bg-[#0A1018] border border-[#263548] rounded-xl text-xs text-[#F1F5F9] focus:outline-none focus:border-[#5EEAD4]"
                  >
                    <option value="active">Active</option>
                    <option value="planning">Planning</option>
                    <option value="in_review">In Review</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                    Target Deadline
                  </label>
                  <input
                    type="date"
                    required
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A1018] border border-[#263548] rounded-xl text-xs text-[#F1F5F9] focus:outline-none focus:border-[#5EEAD4]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                    Stack Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="Go, Raft, Docker"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A1018] border border-[#263548] rounded-xl text-xs text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[#5EEAD4]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                    GitHub Repo URL (optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={formRepoUrl}
                    onChange={(e) => setFormRepoUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A1018] border border-[#263548] rounded-xl text-xs text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[#5EEAD4]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                    Live Demo URL (optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://demo.app/..."
                    value={formLiveUrl}
                    onChange={(e) => setFormLiveUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A1018] border border-[#263548] rounded-xl text-xs text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[#5EEAD4]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#263548]">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1C2A3B] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#080C12] bg-[#10B981] hover:bg-[#059669] transition-colors shadow-sm cursor-pointer"
                >
                  {editingProjectId ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MILESTONE MODAL */}
      {editingMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-[#101722] border border-[#263548] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#263548]">
              <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                <span>Edit Milestone</span>
              </h3>
              <button
                onClick={() => setEditingMilestone(null)}
                className="p-1 rounded-xl text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1C2A3B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMilestoneEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                  Milestone Title *
                </label>
                <input
                  type="text"
                  required
                  value={editingMilestone.milestone.title}
                  onChange={(e) =>
                    setEditingMilestone({
                      ...editingMilestone,
                      milestone: { ...editingMilestone.milestone, title: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-[#0A1018] border border-[#263548] rounded-xl text-xs text-[#F1F5F9] focus:outline-none focus:border-[#5EEAD4]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={editingMilestone.milestone.dueDate}
                  onChange={(e) =>
                    setEditingMilestone({
                      ...editingMilestone,
                      milestone: { ...editingMilestone.milestone, dueDate: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-[#0A1018] border border-[#263548] rounded-xl text-xs text-[#F1F5F9] focus:outline-none focus:border-[#5EEAD4]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#263548]">
                <button
                  type="button"
                  onClick={() => setEditingMilestone(null)}
                  className="px-4 py-2 rounded-xl text-xs text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1C2A3B] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#080C12] bg-[#10B981] hover:bg-[#059669] transition-colors shadow-sm cursor-pointer"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE PROJECT IN-APP CONFIRMATION MODAL */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-[#101722] border border-rose-950/70 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-[#FB7185]">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F1F5F9]">Delete Project?</h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">&quot;{projectToDelete.name}&quot;</p>
              </div>
            </div>

            <p className="text-xs text-[#CBD5E1] leading-relaxed">
              This will remove this project and its milestones. Any tasks linked to this project will be unlinked and preserved in your general Tasks list.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#263548]">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1C2A3B] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProject}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#FB7185] hover:bg-rose-600 transition-colors shadow-sm cursor-pointer"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
