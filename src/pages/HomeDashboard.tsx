/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Eye of Agamotto - Cosmic Purple Home Dashboard
 */

import React, { useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Calendar as CalendarIcon,
  GraduationCap,
  FolderGit2,
  Briefcase,
  Sparkles,
  ArrowRight,
  Plus,
  AlertCircle,
} from 'lucide-react';
import {
  Task,
  CalendarEvent,
  LearningRoadmap,
  Project,
  JobApplication,
  NavigationItem,
  UserProfile,
} from '../types';
import { MountainBanner } from '../components/common/MountainBanner';

interface HomeDashboardProps {
  tasks: Task[];
  calendarEvents: CalendarEvent[];
  roadmaps: LearningRoadmap[];
  projects: Project[];
  jobs: JobApplication[];
  profile: UserProfile;
  onNavigate: (nav: NavigationItem) => void;
  onToggleTask: (id: string) => void;
  onOpenQuickCapture: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  tasks,
  calendarEvents,
  roadmaps,
  projects,
  jobs,
  profile,
  onNavigate,
  onToggleTask,
  onOpenQuickCapture,
}) => {
  // Today's date reference in local timezone
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);
  const formattedToday = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  // Filter tasks for today, overdue, or completed today
  const todayTasks = useMemo(() => {
    return tasks.filter(
      (t) =>
        t.dueDate === todayStr ||
        (t.dueDate < todayStr && t.status !== 'completed') ||
        (t.completedAt && t.completedAt.startsWith(todayStr))
    );
  }, [tasks, todayStr]);

  const completedTodayTasks = useMemo(() => {
    return todayTasks.filter((t) => t.status === 'completed');
  }, [todayTasks]);

  // Today's agenda events
  const todayEvents = useMemo(() => {
    return calendarEvents
      .filter((e) => e.startDate === todayStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [calendarEvents, todayStr]);

  // Upcoming critical deadlines
  const upcomingDeadlines = useMemo(() => {
    const projectDeadlines = projects
      .filter((p) => p.status !== 'completed')
      .map((p) => ({
        type: 'Project',
        title: p.name,
        date: p.deadline,
        nav: 'projects' as NavigationItem,
      }));

    const taskDeadlines = tasks
      .filter((t) => t.status !== 'completed' && t.dueDate >= todayStr)
      .map((t) => ({
        type: 'Task',
        title: t.title,
        date: t.dueDate,
        nav: 'tasks' as NavigationItem,
      }));

    return [...projectDeadlines, ...taskDeadlines]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 4);
  }, [projects, tasks, todayStr]);

  // Calculate learning progress for each roadmap from actual completed items
  const roadmapStats = useMemo(() => {
    return roadmaps.map((r) => {
      let totalItems = 0;
      let completedItems = 0;
      r.modules.forEach((m) => {
        m.topics.forEach((t) => {
          if (t.subtopics && t.subtopics.length > 0) {
            t.subtopics.forEach((st) => {
              totalItems++;
              if (st.completed) completedItems++;
            });
          } else {
            totalItems++;
            if (t.completed) completedItems++;
          }
        });
      });
      const percent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
      return {
        ...r,
        totalTopics: totalItems,
        completedTopics: completedItems,
        percent,
      };
    });
  }, [roadmaps]);

  // Job pipeline summary
  const jobStats = useMemo(() => {
    const interviewing = jobs.filter((j) => j.status === 'interviewing').length;
    const applied = jobs.filter((j) => j.status === 'applied').length;
    const offered = jobs.filter((j) => j.status === 'offered').length;
    return { interviewing, applied, offered, total: jobs.length };
  }, [jobs]);

  const priorityStyle = (p: Task['priority']) => {
    switch (p) {
      case 'urgent':
        return { text: 'text-[var(--status-danger)]', dot: 'bg-[var(--status-danger)]', label: 'Urgent' };
      case 'high':
        return { text: 'text-[var(--status-warning)]', dot: 'bg-[var(--status-warning)]', label: 'High' };
      case 'medium':
        return { text: 'text-[var(--brand-cyan)]', dot: 'bg-[var(--brand-cyan)]', label: 'Medium' };
      case 'low':
      default:
        return { text: 'text-[var(--text-muted)]', dot: 'bg-[var(--border-default)]', label: 'Low' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Cinematic Mountain Hero Banner */}
      <MountainBanner
        greeting={`Good day, ${profile.name.split(' ')[0]}`}
        dateStr={formattedToday}
        focusQuote="Bend the stream of time with disciplined daily execution. What you master today anchors your future."
        completedTasksCount={completedTodayTasks.length}
        totalTasksCount={todayTasks.length}
        onQuickAction={onOpenQuickCapture}
      />

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div
          onClick={() => onNavigate('tasks')}
          className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--brand-primary)] hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer group shadow-card"
        >
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-medium">Today's Tasks</span>
            <div className="p-1.5 rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[var(--text-primary)] font-mono tabular-nums">
              {completedTodayTasks.length}/{todayTasks.length}
            </span>
            <span className="text-xs text-[var(--text-muted)]">done</span>
            {todayTasks.length > 0 && (
              <span className="text-xs font-mono text-[var(--status-success)] font-semibold ml-auto">
                {Math.round((completedTodayTasks.length / todayTasks.length) * 100)}%
              </span>
            )}
          </div>
          <div className="mt-2 text-[11px] text-[var(--brand-secondary)] group-hover:underline flex items-center gap-1 font-medium">
            <span>Manage checklist</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Metric 2 */}
        <div
          onClick={() => onNavigate('learning')}
          className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--brand-cyan)] hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer group shadow-card"
        >
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-medium">Active Roadmaps</span>
            <div className="p-1.5 rounded-lg bg-[var(--brand-cyan)]/10 text-[var(--brand-cyan)]">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[var(--text-primary)] font-mono tabular-nums">
              {roadmaps.length}
            </span>
            <span className="text-xs text-[var(--text-muted)]">tracks</span>
          </div>
          <div className="mt-2 text-[11px] text-[var(--brand-cyan)] group-hover:underline flex items-center gap-1 font-medium">
            <span>GATE DA · GenAI · DSA</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Metric 3 */}
        <div
          onClick={() => onNavigate('projects')}
          className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--brand-tertiary)] hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer group shadow-card"
        >
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-medium">Active Projects</span>
            <div className="p-1.5 rounded-lg bg-[var(--brand-tertiary)]/10 text-[var(--brand-tertiary)]">
              <FolderGit2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[var(--text-primary)] font-mono tabular-nums">
              {projects.filter((p) => p.status === 'active').length}
            </span>
            <span className="text-xs text-[var(--text-muted)]">in flight</span>
          </div>
          <div className="mt-2 text-[11px] text-[var(--brand-tertiary)] group-hover:underline flex items-center gap-1 font-medium">
            <span>View milestones</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Metric 4 */}
        <div
          onClick={() => onNavigate('career')}
          className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--status-warning)] hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer group shadow-card"
        >
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-medium">Interview Pipeline</span>
            <div className="p-1.5 rounded-lg bg-[var(--status-warning)]/10 text-[var(--status-warning)]">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[var(--text-primary)] font-mono tabular-nums">
              {jobStats.interviewing}
            </span>
            <span className="text-xs text-[var(--text-muted)]">active loops</span>
          </div>
          <div className="mt-2 text-[11px] text-[var(--status-warning)] group-hover:underline flex items-center gap-1 font-medium">
            <span>{jobStats.applied} applied · {jobStats.offered} offer</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Primary 2-Column Split: Today's Action Center & Daily Agenda */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Today's Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Tasks Card */}
          <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-5 space-y-4 shadow-card transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm md:text-base font-bold text-[var(--text-primary)]">Today's Priority Agenda</h2>
                <p className="text-xs text-[var(--text-muted)]">
                  {todayTasks.length === 0
                    ? 'No tasks scheduled for today'
                    : `${completedTodayTasks.length} of ${todayTasks.length} completed`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenQuickCapture}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] glow-purple"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Task</span>
                </button>
                <button
                  onClick={() => onNavigate('tasks')}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors font-medium"
                >
                  View All
                </button>
              </div>
            </div>

            {/* Task Rows */}
            <div className="divide-y divide-[var(--border-subtle)]">
              {todayTasks.length === 0 ? (
                <div className="py-10 px-4 text-center space-y-2 flex flex-col items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-[var(--status-success)]" />
                  <div className="text-xs font-semibold text-[var(--text-primary)]">All caught up for today!</div>
                  <p className="text-[11px] text-[var(--text-muted)] max-w-xs">
                    Your queue is clear. Capture a new study topic, interview follow-up, or project objective.
                  </p>
                  <button
                    onClick={onOpenQuickCapture}
                    className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] shadow-sm transition-all glow-purple"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Quick Capture Task</span>
                  </button>
                </div>
              ) : (
                todayTasks.map((t) => {
                  const isDone = t.status === 'completed';
                  const pInfo = priorityStyle(t.priority);
                  return (
                    <div
                      key={t.id}
                      className="py-3 flex items-start justify-between gap-3 group hover:bg-[var(--bg-surface-hover)] px-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <button
                          onClick={() => onToggleTask(t.id)}
                          className="mt-0.5 text-[var(--text-muted)] hover:text-[var(--brand-primary)] transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] rounded"
                          aria-label={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-[var(--status-success)]" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>

                        <div className="min-w-0">
                          <div
                            className={`text-xs font-medium transition-colors ${
                              isDone ? 'line-through text-[var(--text-disabled)]' : 'text-[var(--text-primary)]'
                            }`}
                          >
                            {t.title}
                          </div>

                          {t.description && (
                            <p className="text-[11px] text-[var(--text-muted)] mt-0.5 line-clamp-1">
                              {t.description}
                            </p>
                          )}

                          {/* Metadata row with clean unboxed text and separators */}
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[var(--text-muted)]">
                            {t.dueTime && (
                              <>
                                <span className="flex items-center gap-1 font-mono text-[var(--text-secondary)]">
                                  <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                                  {t.dueTime}
                                </span>
                                <span aria-hidden="true" className="text-[var(--text-disabled)]">·</span>
                              </>
                            )}
                            <span className="capitalize">{t.category.replace('_', ' ')}</span>
                            {t.tags.length > 0 && (
                              <>
                                <span aria-hidden="true" className="text-[var(--text-disabled)]">·</span>
                                <span>{t.tags.slice(0, 2).join(', ')}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Clean priority indicator */}
                      <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${pInfo.dot}`} />
                        <span className={`text-[11px] font-mono capitalize ${pInfo.text}`}>
                          {pInfo.label}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Learning Progress Cards */}
          <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-5 space-y-4 shadow-card transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm md:text-base font-bold text-[var(--text-primary)]">Curriculum & Roadmap Milestones</h2>
                <p className="text-xs text-[var(--text-muted)]">
                  Track your mastery across foundational engineering domains
                </p>
              </div>
              <button
                onClick={() => onNavigate('learning')}
                className="text-xs text-[var(--brand-secondary)] hover:text-[var(--brand-primary)] font-medium flex items-center gap-1 transition-colors"
              >
                <span>Full Roadmaps</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {roadmapStats.map((r) => (
                <div
                  key={r.id}
                  onClick={() => onNavigate('learning')}
                  className="p-4 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] hover:border-[var(--brand-primary)] hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--brand-secondary)] transition-colors">
                      {r.title}
                    </span>
                    <span className="text-xs font-mono font-semibold text-[var(--brand-primary)] dark:text-[var(--brand-secondary)] tabular-nums">
                      {r.percent}%
                    </span>
                  </div>

                  <p className="text-[11px] text-[var(--text-muted)] mt-1 line-clamp-2 leading-relaxed">
                    {r.summary}
                  </p>

                  <div className="mt-3">
                    <div className="w-full h-1.5 bg-[var(--bg-app)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                      <div
                        className="h-full bg-gradient-to-r from-[var(--brand-indigo)] via-[var(--brand-primary)] to-[var(--brand-cyan)] rounded-full"
                        style={{ width: `${r.percent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1.5 text-[10px] text-[var(--text-muted)] font-mono">
                      <span>{r.completedTopics} of {r.totalTopics} topics mastered</span>
                      <span>{r.shortCode}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Project Progress Cards */}
          <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-5 space-y-4 shadow-card transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm md:text-base font-bold text-[var(--text-primary)]">Active Engineering Projects</h2>
                <p className="text-xs text-[var(--text-muted)]">Real deliverables, milestones, and repositories</p>
              </div>
              <button
                onClick={() => onNavigate('projects')}
                className="text-xs text-[var(--brand-cyan)] hover:text-[var(--brand-secondary)] font-medium flex items-center gap-1 transition-colors"
              >
                <span>All Projects</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {projects.map((p) => {
                const linkedTasks = tasks.filter((t) => t.linkedProjectId === p.id);
                const totalItems = p.milestones.length + linkedTasks.length;
                const completedItems =
                  p.milestones.filter((m) => m.completed).length +
                  linkedTasks.filter((t) => t.status === 'completed').length;
                const calcProgress =
                  totalItems > 0
                    ? Math.round((completedItems / totalItems) * 100)
                    : p.status === 'completed'
                    ? 100
                    : 0;

                return (
                  <div
                    key={p.id}
                    onClick={() => onNavigate('projects')}
                    className="p-4 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] hover:border-[var(--brand-cyan)] hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer group flex flex-col justify-between shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] mb-1">
                        <span className="capitalize">{p.category}</span>
                        <span className="font-mono text-[var(--brand-cyan)] font-semibold">{calcProgress}%</span>
                      </div>

                      <h3 className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--brand-cyan)] transition-colors truncate">
                        {p.name}
                      </h3>

                      <p className="text-[11px] text-[var(--text-muted)] mt-1 line-clamp-2">
                        {p.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
                      <div className="w-full h-1 bg-[var(--bg-app)] rounded-full overflow-hidden mb-2 border border-[var(--border-subtle)]">
                        <div
                          className="h-full bg-gradient-to-r from-[var(--brand-indigo)] to-[var(--brand-cyan)] rounded-full"
                          style={{ width: `${calcProgress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                        <span>Due {p.deadline}</span>
                        <span className="font-mono text-[9px] text-[var(--text-secondary)]">
                          {completedItems}/{totalItems} items
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Calendar Agenda, AI Assistant Quick Panel & Deadlines */}
        <div className="space-y-6">
          {/* Daily Calendar Agenda */}
          <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-5 space-y-4 shadow-card transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[var(--brand-primary)]" />
                <h2 className="text-sm font-bold text-[var(--text-primary)]">Daily Agenda</h2>
              </div>
              <button
                onClick={() => onNavigate('calendar')}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors font-medium"
              >
                Calendar
              </button>
            </div>

            <div className="space-y-2">
              {todayEvents.length === 0 ? (
                <div className="py-6 px-3 border border-dashed border-[var(--border-default)] rounded-xl flex flex-col items-center justify-center text-center space-y-2">
                  <span className="text-xs text-[var(--text-muted)]">No time blocks scheduled for today.</span>
                  <button
                    onClick={() => onNavigate('calendar')}
                    className="text-[11px] text-[var(--brand-cyan)] hover:underline font-mono flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Schedule Timeblock</span>
                  </button>
                </div>
              ) : (
                todayEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] flex items-start gap-3 hover:bg-[var(--bg-surface-hover)] transition-colors"
                  >
                    <div className="w-1.5 h-full min-h-[32px] rounded-full bg-[var(--brand-primary)] shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        {evt.title}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] mt-1 font-mono tabular-nums">
                        <span>
                          {evt.startTime} - {evt.endTime}
                        </span>
                        {evt.location && (
                          <>
                            <span aria-hidden="true" className="text-[var(--text-disabled)]">·</span>
                            <span>{evt.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* AI Assistant Quick Intelligence Panel */}
          <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-5 space-y-4 shadow-card transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--brand-secondary)]" />
                <h2 className="text-sm font-bold text-[var(--text-primary)]">Agamotto Intelligence</h2>
              </div>
              <span className="text-[10px] font-mono text-[var(--brand-secondary)] uppercase tracking-wider">
                gemini-3.8-flash
              </span>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Your server-side AI partner for intelligent scheduling, concept breakdowns, and study drill generation.
            </p>

            {/* Quick Action Presets */}
            <div className="space-y-2">
              <button
                onClick={() => onNavigate('assistant')}
                className="w-full text-left p-2.5 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] hover:border-[var(--brand-primary)] hover:bg-[var(--bg-surface-hover)] text-xs text-[var(--text-secondary)] transition-colors flex items-center justify-between group"
              >
                <span>Plan today's study & deep work</span>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--brand-secondary)] transition-colors" />
              </button>

              <button
                onClick={() => onNavigate('assistant')}
                className="w-full text-left p-2.5 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] hover:border-[var(--brand-primary)] hover:bg-[var(--bg-surface-hover)] text-xs text-[var(--text-secondary)] transition-colors flex items-center justify-between group"
              >
                <span>Explain SVD & Eigenvalue geometry</span>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--brand-secondary)] transition-colors" />
              </button>

              <button
                onClick={() => onNavigate('assistant')}
                className="w-full text-left p-2.5 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] hover:border-[var(--brand-primary)] hover:bg-[var(--bg-surface-hover)] text-xs text-[var(--text-secondary)] transition-colors flex items-center justify-between group"
              >
                <span>Prepare 5 GATE DA practice problems</span>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--brand-secondary)] transition-colors" />
              </button>
            </div>

            <button
              onClick={() => onNavigate('assistant')}
              className="w-full py-2 px-3 text-xs font-semibold text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] rounded-lg shadow-sm transition-all text-center focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] glow-purple"
            >
              Open AI Workspace
            </button>
          </div>

          {/* Upcoming Deadlines List */}
          <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-5 space-y-3 shadow-card transition-colors duration-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[var(--status-warning)]" />
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Upcoming Deadlines</h2>
            </div>

            <div className="space-y-2">
              {upcomingDeadlines.length === 0 ? (
                <div className="py-4 text-center text-xs text-[var(--text-muted)]">
                  No upcoming deadlines found.
                </div>
              ) : (
                upcomingDeadlines.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => onNavigate(item.nav)}
                    className="p-2.5 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] hover:border-[var(--status-warning)] hover:bg-[var(--bg-surface-hover)] cursor-pointer transition-colors flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-[var(--text-primary)] truncate font-medium">{item.title}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">{item.type}</div>
                    </div>
                    <span className="text-[11px] font-mono tabular-nums text-[var(--status-warning)] shrink-0 font-medium">
                      {item.date}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
