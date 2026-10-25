/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  CheckSquare,
  Calendar as CalendarIcon,
  Trash2,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  Circle,
  X,
  ExternalLink,
  Layers,
  ArrowRight,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { CalendarEvent, Task, EventType, Priority } from '../types';
import { storageService } from '../services/storageService';

interface CalendarPageProps {
  events: CalendarEvent[];
  tasks: Task[];
  onEventsChange: () => void;
  onTasksChange: () => void;
}

type CalendarViewMode = 'month' | 'week' | 'day';
type ItemFilter = 'all' | 'events' | 'tasks';

// Timezone-aware date helpers using local components
const formatLocalDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const parseLocalDate = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0);
};

const addDaysToDate = (dateStr: string, days: number): string => {
  const dt = parseLocalDate(dateStr);
  dt.setDate(dt.getDate() + days);
  return formatLocalDate(dt);
};

export const CalendarPage: React.FC<CalendarPageProps> = ({
  events,
  tasks,
  onEventsChange,
  onTasksChange,
}) => {
  // Navigation & View state
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [itemFilter, setItemFilter] = useState<ItemFilter>('all');
  const [selectedEventType, setSelectedEventType] = useState<string>('all');

  // Initialize currentDate timezone-aware
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  // Today reference in local format
  const todayStr = useMemo(() => formatLocalDate(new Date()), []);

  // Event Modals state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // Event Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<EventType>('deep_work');
  const [formStartDate, setFormStartDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndDate, setFormEndDate] = useState('');
  const [formEndTime, setFormEndTime] = useState('10:30');
  const [formLocation, setFormLocation] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState('purple');
  const [formLinkedTaskId, setFormLinkedTaskId] = useState('');
  const [formError, setFormError] = useState('');
  const [allowDuplicateOverride, setAllowDuplicateOverride] = useState(false);

  // Reschedule Task Modal state
  const [reschedulingTask, setReschedulingTask] = useState<Task | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('18:00');

  // Event Delete confirmation modal
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);

  // Month navigation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === 'week') {
      const prevWeek = new Date(currentDate);
      prevWeek.setDate(prevWeek.getDate() - 7);
      setCurrentDate(prevWeek);
    } else {
      const prevDay = new Date(currentDate);
      prevDay.setDate(prevDay.getDate() - 1);
      setCurrentDate(prevDay);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === 'week') {
      const nextWeek = new Date(currentDate);
      nextWeek.setDate(nextWeek.getDate() + 7);
      setCurrentDate(nextWeek);
    } else {
      const nextDay = new Date(currentDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setCurrentDate(nextDay);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleJumpToDate = (targetDateStr: string) => {
    if (!targetDateStr) return;
    setCurrentDate(parseLocalDate(targetDateStr));
  };

  // Month grid calculations (Sunday start)
  const monthDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean; dateObj: Date }[] = [];

    // Leading padding days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dt = new Date(prevYear, prevMonth, d);
      days.push({
        dateStr: formatLocalDate(dt),
        dayNum: d,
        isCurrentMonth: false,
        dateObj: dt,
      });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month, d);
      days.push({
        dateStr: formatLocalDate(dt),
        dayNum: d,
        isCurrentMonth: true,
        dateObj: dt,
      });
    }

    // Trailing padding days to fill 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dt = new Date(nextYear, nextMonth, d);
      days.push({
        dateStr: formatLocalDate(dt),
        dayNum: d,
        isCurrentMonth: false,
        dateObj: dt,
      });
    }

    return days;
  }, [year, month]);

  // Week days calculations (Monday start for structured weekly productivity planning)
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const dayOfWeek = curr.getDay();
    const distanceToMonday = (dayOfWeek + 6) % 7; // Monday = 0
    const monday = new Date(curr);
    monday.setDate(curr.getDate() - distanceToMonday);

    const days: { dateStr: string; dayNum: number; label: string; dateObj: Date }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push({
        dateStr: formatLocalDate(d),
        dayNum: d.getDate(),
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dateObj: d,
      });
    }
    return days;
  }, [currentDate]);

  // Day view date string
  const currentDayStr = useMemo(() => formatLocalDate(currentDate), [currentDate]);

  // Duplicate event detection check
  const duplicateDetected = useMemo(() => {
    if (!formTitle.trim() || !formStartDate || !formStartTime) return false;
    const cleanTitle = formTitle.trim().toLowerCase();
    return events.some(
      (e) =>
        e.id !== (editingEvent?.id || '') &&
        e.startDate === formStartDate &&
        e.startTime === formStartTime &&
        e.title.trim().toLowerCase() === cleanTitle
    );
  }, [formTitle, formStartDate, formStartTime, events, editingEvent]);

  // Color & Badge utilities with Cosmic Purple & Cyan palette
  const eventBadgeStyle = (type: EventType, customColor?: string) => {
    if (customColor === 'purple' || (!customColor && type === 'deep_work')) {
      return 'bg-purple-500/15 text-purple-300 border-purple-500/35';
    }
    if (customColor === 'cyan' || (!customColor && type === 'task_block')) {
      return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35';
    }
    if (customColor === 'indigo' || (!customColor && type === 'study')) {
      return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/35';
    }
    if (customColor === 'amber' || (!customColor && type === 'interview')) {
      return 'bg-amber-500/15 text-amber-300 border-amber-500/35';
    }
    if (customColor === 'rose' || (!customColor && type === 'exam')) {
      return 'bg-rose-500/15 text-rose-300 border-rose-500/35';
    }
    if (customColor === 'emerald') {
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35';
    }
    return 'bg-purple-500/15 text-purple-300 border-purple-500/35';
  };

  const priorityBadgeStyle = (priority: Priority) => {
    switch (priority) {
      case 'urgent':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'high':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'medium':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      case 'low':
        return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  // Open Create Event Modal
  const handleOpenCreateEvent = (presetDate?: string, presetStartTime = '09:00') => {
    setEditingEvent(null);
    setFormTitle('');
    setFormType('deep_work');
    const targetDate = presetDate || (viewMode === 'day' ? currentDayStr : todayStr);
    setFormStartDate(targetDate);
    setFormStartTime(presetStartTime);
    setFormEndDate(targetDate);

    // Compute end time (default 1 hr 30 mins)
    const [h, m] = presetStartTime.split(':').map(Number);
    const endHour = Math.min(23, h + 1);
    const endMins = (m + 30) % 60;
    const finalHour = m + 30 >= 60 ? Math.min(23, endHour + 1) : endHour;
    setFormEndTime(`${String(finalHour).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`);

    setFormLocation('');
    setFormDescription('');
    setFormColor('purple');
    setFormLinkedTaskId('');
    setFormError('');
    setAllowDuplicateOverride(false);
    setIsEventModalOpen(true);
  };

  // Open Edit Event Modal
  const handleOpenEditEvent = (evt: CalendarEvent) => {
    setEditingEvent(evt);
    setFormTitle(evt.title);
    setFormType(evt.type);
    setFormStartDate(evt.startDate);
    setFormStartTime(evt.startTime);
    setFormEndDate(evt.endDate || evt.startDate);
    setFormEndTime(evt.endTime);
    setFormLocation(evt.location || '');
    setFormDescription(evt.description || '');
    setFormColor(evt.color || 'purple');
    setFormLinkedTaskId(evt.linkedTaskId || '');
    setFormError('');
    setAllowDuplicateOverride(false);
    setIsEventModalOpen(true);
  };

  // Save Event (Create or Update) with Duplicate Prevention
  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Please enter an event title.');
      return;
    }
    if (!formStartDate || !formStartTime || !formEndTime) {
      setFormError('Please enter valid date and time ranges.');
      return;
    }
    if (formStartTime >= formEndTime && formStartDate === formEndDate) {
      setFormError('End time must be after start time.');
      return;
    }

    if (duplicateDetected && !allowDuplicateOverride) {
      setFormError('Duplicate event detected! Adjust the time or tick the override option.');
      return;
    }

    const payload = {
      title: formTitle.trim(),
      type: formType,
      startDate: formStartDate,
      startTime: formStartTime,
      endDate: formEndDate || formStartDate,
      endTime: formEndTime,
      location: formLocation.trim() || undefined,
      description: formDescription.trim() || undefined,
      color: formColor,
      linkedTaskId: formLinkedTaskId || undefined,
    };

    if (editingEvent) {
      storageService.updateCalendarEvent({
        ...editingEvent,
        ...payload,
      });
    } else {
      storageService.addCalendarEvent(payload);
    }

    setIsEventModalOpen(false);
    setEditingEvent(null);
    onEventsChange();
  };

  // Delete event handler
  const handleConfirmDeleteEvent = () => {
    if (eventToDelete) {
      storageService.deleteCalendarEvent(eventToDelete.id);
      setEventToDelete(null);
      if (editingEvent?.id === eventToDelete.id) {
        setIsEventModalOpen(false);
        setEditingEvent(null);
      }
      onEventsChange();
    }
  };

  // Reschedule Task handler
  const handleOpenReschedule = (task: Task) => {
    setReschedulingTask(task);
    setRescheduleDate(task.dueDate);
    setRescheduleTime(task.dueTime || '18:00');
  };

  const handleSaveRescheduleTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingTask || !rescheduleDate) return;
    storageService.rescheduleTask(reschedulingTask.id, rescheduleDate, rescheduleTime);
    setReschedulingTask(null);
    onTasksChange();
  };

  // Toggle task complete directly
  const handleToggleTask = (taskId: string) => {
    storageService.toggleTaskCompletion(taskId);
    onTasksChange();
  };

  // Filtered lists for rendering
  const isItemVisible = (isEvent: boolean, eventType?: EventType) => {
    if (itemFilter === 'events' && !isEvent) return false;
    if (itemFilter === 'tasks' && isEvent) return false;
    if (isEvent && selectedEventType !== 'all' && eventType !== selectedEventType) return false;
    return true;
  };

  // Hourly timeline slots for day view (07:00 to 22:00)
  const dayTimelineHours = useMemo(() => {
    const slots = [];
    for (let h = 7; h <= 22; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`);
    }
    return slots;
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2.5" style={{ color: 'var(--text-primary)' }}>
            <CalendarIcon className="w-6 h-6" style={{ color: 'var(--brand-primary)' }} />
            <span>Calendar & Time Allocation</span>
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Synchronize deep work blocks, scheduled tasks, mock drills, and interviews in your local timezone
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Mode Segmented Controls */}
          <div
            className="flex items-center rounded-xl p-1 shadow-inner"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-default)',
            }}
          >
            {(['month', 'week', 'day'] as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all cursor-pointer"
                style={{
                  backgroundColor: viewMode === mode ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                  color: viewMode === mode ? 'var(--brand-secondary)' : 'var(--text-muted)',
                  border: viewMode === mode ? '1px solid var(--brand-primary)' : '1px solid transparent',
                  fontWeight: viewMode === mode ? 700 : 500,
                }}
              >
                {mode} View
              </button>
            ))}
          </div>

          <button
            onClick={() => handleOpenCreateEvent()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white rounded-xl shadow-md transition-all cursor-pointer"
            style={{
              backgroundColor: 'var(--brand-primary)',
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Event</span>
          </button>
        </div>
      </div>

      {/* Navigation & Filter Bar */}
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl px-4 py-3 shadow-card"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
        }}
      >
        {/* Date Navigator */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg transition-colors cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Previous Period"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg transition-colors cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Next Period"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
            }}
          >
            Today
          </button>

          <span className="text-sm font-bold ml-2 font-mono tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {viewMode === 'month' &&
              currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            {viewMode === 'week' && (
              <>
                {weekDays[0].dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{' '}
                – {weekDays[6].dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </>
            )}
            {viewMode === 'day' &&
              currentDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
          </span>

          {/* Quick Date Jump Input */}
          <input
            type="date"
            value={formatLocalDate(currentDate)}
            onChange={(e) => handleJumpToDate(e.target.value)}
            className="ml-2 text-xs rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
            }}
            title="Jump to date"
          />
        </div>

        {/* Visibility Filter Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div
            className="flex items-center rounded-lg p-0.5 text-xs"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-default)',
            }}
          >
            <button
              onClick={() => setItemFilter('all')}
              className="px-2.5 py-1 rounded-md transition-colors cursor-pointer"
              style={{
                backgroundColor: itemFilter === 'all' ? 'var(--bg-surface)' : 'transparent',
                color: itemFilter === 'all' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: itemFilter === 'all' ? 600 : 400,
              }}
            >
              All
            </button>
            <button
              onClick={() => setItemFilter('events')}
              className="px-2.5 py-1 rounded-md transition-colors cursor-pointer"
              style={{
                backgroundColor: itemFilter === 'events' ? 'var(--bg-surface)' : 'transparent',
                color: itemFilter === 'events' ? 'var(--brand-secondary)' : 'var(--text-muted)',
                fontWeight: itemFilter === 'events' ? 600 : 400,
              }}
            >
              Events ({events.length})
            </button>
            <button
              onClick={() => setItemFilter('tasks')}
              className="px-2.5 py-1 rounded-md transition-colors cursor-pointer"
              style={{
                backgroundColor: itemFilter === 'tasks' ? 'var(--bg-surface)' : 'transparent',
                color: itemFilter === 'tasks' ? 'var(--brand-cyan)' : 'var(--text-muted)',
                fontWeight: itemFilter === 'tasks' ? 600 : 400,
              }}
            >
              Tasks ({tasks.length})
            </button>
          </div>

          {/* Event Category Selector */}
          <select
            value={selectedEventType}
            onChange={(e) => setSelectedEventType(e.target.value)}
            className="text-xs rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
            }}
          >
            <option value="all">All Types</option>
            <option value="deep_work">Deep Work</option>
            <option value="interview">Interview</option>
            <option value="study">Study</option>
            <option value="exam">Exam Practice</option>
            <option value="event">Meetings</option>
            <option value="task_block">Task Blocks</option>
          </select>
        </div>
      </div>

      {/* VIEW: MONTH VIEW */}
      {viewMode === 'month' && (
        <div
          className="rounded-2xl overflow-hidden shadow-card"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
          }}
        >
          {/* Day of Week Headers */}
          <div
            className="grid grid-cols-7 text-center py-2.5 text-xs font-semibold"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              borderBottom: '1px solid var(--border-default)',
              color: 'var(--text-muted)',
            }}
          >
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Month Days Grid */}
          <div
            className="grid grid-cols-7 divide-x divide-y"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            {monthDays.map((d, idx) => {
              const dayEvents = events.filter(
                (e) => e.startDate === d.dateStr && isItemVisible(true, e.type)
              );
              const dayTasks = tasks.filter(
                (t) => t.dueDate === d.dateStr && isItemVisible(false)
              );
              const isToday = d.dateStr === todayStr;

              return (
                <div
                  key={idx}
                  className="min-h-[120px] p-2 flex flex-col justify-between transition-colors relative group/cell"
                  style={{
                    backgroundColor: isToday
                      ? 'rgba(139, 92, 246, 0.08)'
                      : d.isCurrentMonth
                      ? 'var(--bg-surface)'
                      : 'var(--bg-app)',
                    opacity: d.isCurrentMonth ? 1 : 0.45,
                    border: isToday ? '2px solid var(--brand-primary)' : undefined,
                  }}
                >
                  {/* Cell Top Header */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      onClick={() => {
                        setCurrentDate(d.dateObj);
                        setViewMode('day');
                      }}
                      className="text-xs font-mono tabular-nums cursor-pointer hover:underline"
                      style={{
                        backgroundColor: isToday ? 'var(--brand-primary)' : 'transparent',
                        color: isToday ? '#ffffff' : d.isCurrentMonth ? 'var(--text-primary)' : 'var(--text-disabled)',
                        padding: isToday ? '2px 6px' : '0',
                        borderRadius: isToday ? '9999px' : '0',
                        fontWeight: isToday ? 700 : 500,
                      }}
                      title="View day agenda"
                    >
                      {d.dayNum}
                    </span>

                    <div className="flex items-center gap-1 opacity-0 group-hover/cell:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenCreateEvent(d.dateStr)}
                        className="p-1 rounded transition-colors cursor-pointer"
                        style={{ color: 'var(--text-muted)' }}
                        title={`Add event on ${d.dateStr}`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Cell Items Content */}
                  <div className="space-y-1 overflow-y-auto max-h-24 pr-0.5">
                    {/* Events */}
                    {dayEvents.map((evt) => (
                      <div
                        key={evt.id}
                        onClick={() => handleOpenEditEvent(evt)}
                        className={`text-[10px] p-1 rounded-md border truncate flex items-center justify-between group/evt cursor-pointer hover:brightness-110 transition-all ${eventBadgeStyle(
                          evt.type,
                          evt.color
                        )}`}
                        title={`${evt.startTime} - ${evt.endTime}: ${evt.title}`}
                      >
                        <span className="truncate font-medium flex items-center gap-1">
                          <span className="font-mono text-[9px] opacity-75">{evt.startTime}</span>
                          <span className="truncate">{evt.title}</span>
                        </span>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover/evt:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEventToDelete(evt);
                            }}
                            className="p-0.5 rounded cursor-pointer"
                            style={{ color: 'var(--status-danger)' }}
                            title="Delete event"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Tasks */}
                    {dayTasks.map((t) => (
                      <div
                        key={t.id}
                        className="text-[10px] p-1 rounded-md border truncate flex items-center justify-between group/task transition-colors"
                        style={{
                          backgroundColor: 'var(--bg-surface-elevated)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <div
                          onClick={() => handleOpenReschedule(t)}
                          className="flex items-center gap-1 truncate cursor-pointer flex-1"
                          title={`Reschedule task: ${t.title}`}
                        >
                          <CheckSquare className="w-2.5 h-2.5 shrink-0" style={{ color: 'var(--brand-cyan)' }} />
                          <span
                            className="truncate font-medium"
                            style={{
                              textDecoration: t.status === 'completed' ? 'line-through' : 'none',
                              opacity: t.status === 'completed' ? 0.6 : 1,
                            }}
                          >
                            {t.title}
                          </span>
                        </div>
                        <button
                          onClick={() => handleToggleTask(t.id)}
                          className="shrink-0 p-0.5 cursor-pointer"
                          style={{ color: t.status === 'completed' ? 'var(--status-success)' : 'var(--text-disabled)' }}
                          title={t.status === 'completed' ? 'Mark uncompleted' : 'Mark completed'}
                        >
                          {t.status === 'completed' ? (
                            <CheckCircle2 className="w-2.5 h-2.5" />
                          ) : (
                            <Circle className="w-2.5 h-2.5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Cell Footer Count */}
                  {(dayEvents.length > 0 || dayTasks.length > 0) && (
                    <div className="text-[9px] font-mono text-right pt-0.5" style={{ color: 'var(--text-disabled)' }}>
                      {dayEvents.length + dayTasks.length} items
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map((d) => {
            const dayEvents = events
              .filter((e) => e.startDate === d.dateStr && isItemVisible(true, e.type))
              .sort((a, b) => a.startTime.localeCompare(b.startTime));
            const dayTasks = tasks.filter((t) => t.dueDate === d.dateStr && isItemVisible(false));
            const isToday = d.dateStr === todayStr;

            return (
              <div
                key={d.dateStr}
                className="rounded-2xl p-3 flex flex-col min-h-[480px] shadow-card transition-all"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: isToday ? '2px solid var(--brand-primary)' : '1px solid var(--border-default)',
                }}
              >
                {/* Day Header */}
                <div
                  className="flex items-center justify-between pb-2.5 mb-2.5"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}
                >
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                      {d.label}
                    </span>
                    <button
                      onClick={() => {
                        setCurrentDate(d.dateObj);
                        setViewMode('day');
                      }}
                      className="text-sm font-mono font-bold hover:underline cursor-pointer"
                      style={{ color: isToday ? 'var(--brand-primary)' : 'var(--text-primary)' }}
                      title="Open Day agenda"
                    >
                      {d.dayNum}
                    </button>
                  </div>

                  <button
                    onClick={() => handleOpenCreateEvent(d.dateStr)}
                    className="p-1 rounded-lg transition-colors cursor-pointer"
                    style={{ color: 'var(--text-muted)' }}
                    title={`Add event on ${d.dateStr}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Day Content Container */}
                <div className="space-y-2 flex-1 overflow-y-auto pr-0.5">
                  {/* Events Section */}
                  {dayEvents.map((evt) => (
                    <div
                      key={evt.id}
                      onClick={() => handleOpenEditEvent(evt)}
                      className={`p-2.5 rounded-xl border text-xs space-y-1.5 cursor-pointer hover:brightness-110 transition-all group ${eventBadgeStyle(
                        evt.type,
                        evt.color
                      )}`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-semibold leading-snug line-clamp-2">{evt.title}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEventToDelete(evt);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 cursor-pointer"
                          style={{ color: 'var(--status-danger)' }}
                          title="Delete event"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] font-mono opacity-85">
                        <Clock className="w-2.5 h-2.5" />
                        <span>
                          {evt.startTime} – {evt.endTime}
                        </span>
                      </div>

                      {evt.location && (
                        <div className="flex items-center gap-1 text-[10px] opacity-75 truncate">
                          <MapPin className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{evt.location}</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Tasks Section */}
                  {dayTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-2.5 rounded-xl border transition-colors text-xs space-y-1.5 group"
                      style={{
                        backgroundColor: 'var(--bg-surface-elevated)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div
                          onClick={() => handleOpenReschedule(t)}
                          className="flex items-start gap-1.5 cursor-pointer flex-1"
                        >
                          <CheckSquare className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--brand-cyan)' }} />
                          <span
                            className="font-semibold leading-snug"
                            style={{
                              textDecoration: t.status === 'completed' ? 'line-through' : 'none',
                              color: t.status === 'completed' ? 'var(--text-disabled)' : 'var(--text-primary)',
                            }}
                          >
                            {t.title}
                          </span>
                        </div>
                        <button
                          onClick={() => handleToggleTask(t.id)}
                          className="shrink-0 p-0.5 cursor-pointer"
                          style={{ color: t.status === 'completed' ? 'var(--status-success)' : 'var(--text-disabled)' }}
                        >
                          {t.status === 'completed' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Circle className="w-3 h-3" />
                          )}
                        </button>
                      </div>

                      <div
                        className="flex items-center justify-between text-[10px] font-mono pt-1"
                        style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--text-disabled)' }}
                      >
                        <span className={`px-1.5 py-0.2 rounded border text-[9px] ${priorityBadgeStyle(t.priority)}`}>
                          {t.priority}
                        </span>
                        {t.dueTime && <span>Due {t.dueTime}</span>}
                      </div>
                    </div>
                  ))}

                  {/* Empty state when no items */}
                  {dayEvents.length === 0 && dayTasks.length === 0 && (
                    <button
                      onClick={() => handleOpenCreateEvent(d.dateStr)}
                      className="w-full py-12 border border-dashed rounded-xl text-center text-xs transition-colors flex flex-col items-center justify-center gap-1 group cursor-pointer"
                      style={{
                        borderColor: 'var(--border-default)',
                        color: 'var(--text-disabled)',
                      }}
                    >
                      <span className="text-[11px]">Free Day</span>
                      <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5" style={{ color: 'var(--brand-primary)' }}>
                        <Plus className="w-3 h-3" />
                        <span>Add Block</span>
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW: DAY VIEW (Detailed Agenda & Hourly Timeline) */}
      {viewMode === 'day' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Hourly Timeline Schedule */}
          <div
            className="lg:col-span-2 rounded-2xl p-5 space-y-4 shadow-card"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
            }}
          >
            <div
              className="flex items-center justify-between pb-3"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <div>
                <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Clock className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
                  <span>Time-Blocked Schedule</span>
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Hourly breakdown from 07:00 to 22:00. Click any open slot to block deep work.
                </p>
              </div>

              <button
                onClick={() => handleOpenCreateEvent(currentDayStr)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white rounded-xl shadow-sm transition-all cursor-pointer"
                style={{
                  backgroundColor: 'var(--brand-primary)',
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Block</span>
              </button>
            </div>

            {/* Timeline hour rows */}
            <div className="space-y-1">
              {dayTimelineHours.map((slotHour) => {
                const hourPrefix = slotHour.split(':')[0];
                const slotEvents = events.filter(
                  (e) =>
                    e.startDate === currentDayStr &&
                    e.startTime.startsWith(hourPrefix) &&
                    isItemVisible(true, e.type)
                );
                const slotTasks = tasks.filter(
                  (t) =>
                    t.dueDate === currentDayStr &&
                    t.dueTime?.startsWith(hourPrefix) &&
                    isItemVisible(false)
                );

                return (
                  <div
                    key={slotHour}
                    className="flex items-start gap-3 py-2 rounded-lg px-2 transition-colors group/row"
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    {/* Time Label */}
                    <div className="w-14 text-xs font-mono font-semibold pt-0.5 shrink-0" style={{ color: 'var(--text-disabled)' }}>
                      {slotHour}
                    </div>

                    {/* Slot content */}
                    <div className="flex-1 min-h-[32px] flex items-center gap-2 flex-wrap">
                      {slotEvents.map((evt) => (
                        <div
                          key={evt.id}
                          onClick={() => handleOpenEditEvent(evt)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-2 cursor-pointer hover:brightness-110 shadow-sm ${eventBadgeStyle(
                            evt.type,
                            evt.color
                          )}`}
                          title={`Click to edit: ${evt.title}`}
                        >
                          <span className="font-mono text-[10px] opacity-80">
                            {evt.startTime} - {evt.endTime}
                          </span>
                          <span className="font-semibold">{evt.title}</span>
                          {evt.location && (
                            <span className="text-[10px] opacity-75 flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5" />
                              {evt.location}
                            </span>
                          )}
                          <Edit2 className="w-3 h-3 opacity-0 group-hover/row:opacity-100 ml-1" />
                        </div>
                      ))}

                      {slotTasks.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => handleOpenReschedule(t)}
                          className="px-3 py-1.5 rounded-lg border text-xs flex items-center gap-2 cursor-pointer transition-colors"
                          style={{
                            backgroundColor: 'var(--bg-surface-elevated)',
                            borderColor: 'var(--border-default)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          <CheckSquare className="w-3 h-3" style={{ color: 'var(--brand-cyan)' }} />
                          <span
                            className="font-medium"
                            style={{
                              textDecoration: t.status === 'completed' ? 'line-through' : 'none',
                              color: t.status === 'completed' ? 'var(--text-disabled)' : 'var(--text-primary)',
                            }}
                          >
                            {t.title}
                          </span>
                          <span className="text-[10px] font-mono" style={{ color: 'var(--text-disabled)' }}>
                            (Due {t.dueTime})
                          </span>
                        </div>
                      ))}

                      {/* Quick block button on hover when empty */}
                      {slotEvents.length === 0 && slotTasks.length === 0 && (
                        <button
                          onClick={() => handleOpenCreateEvent(currentDayStr, slotHour)}
                          className="opacity-0 group-hover/row:opacity-100 text-[11px] flex items-center gap-1 transition-opacity py-0.5 cursor-pointer"
                          style={{ color: 'var(--brand-primary)' }}
                        >
                          <Plus className="w-3 h-3" />
                          <span>Block slot</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 1 Col: Day Breakdown & Tasks Checklist */}
          <div className="space-y-6">
            {/* Day's Scheduled Tasks Checklist */}
            <div
              className="rounded-2xl p-5 space-y-4 shadow-card"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
              }}
            >
              <div
                className="flex items-center justify-between pb-2"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
              >
                <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <CheckSquare className="w-4 h-4" style={{ color: 'var(--brand-cyan)' }} />
                  <span>Tasks Due Today</span>
                </h3>
                <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                  {tasks.filter((t) => t.dueDate === currentDayStr).length} items
                </span>
              </div>

              <div className="space-y-2">
                {tasks.filter((t) => t.dueDate === currentDayStr).length === 0 ? (
                  <div
                    className="py-6 text-center text-xs rounded-xl border border-dashed"
                    style={{
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-disabled)',
                    }}
                  >
                    No tasks due on this date.
                  </div>
                ) : (
                  tasks
                    .filter((t) => t.dueDate === currentDayStr)
                    .map((t) => (
                      <div
                        key={t.id}
                        className="p-3 rounded-xl border flex items-start justify-between gap-2.5 transition-colors"
                        style={{
                          backgroundColor: 'var(--bg-surface-elevated)',
                          borderColor: 'var(--border-subtle)',
                        }}
                      >
                        <div className="flex items-start gap-2.5">
                          <button
                            onClick={() => handleToggleTask(t.id)}
                            className="mt-0.5 shrink-0 cursor-pointer"
                            style={{ color: t.status === 'completed' ? 'var(--status-success)' : 'var(--text-disabled)' }}
                          >
                            {t.status === 'completed' ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>
                          <div>
                            <span
                              className="text-xs font-semibold block"
                              style={{
                                textDecoration: t.status === 'completed' ? 'line-through' : 'none',
                                color: t.status === 'completed' ? 'var(--text-disabled)' : 'var(--text-primary)',
                              }}
                            >
                              {t.title}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] font-mono mt-1" style={{ color: 'var(--text-muted)' }}>
                              <span
                                className={`px-1.5 py-0.2 rounded border ${priorityBadgeStyle(
                                  t.priority
                                )}`}
                              >
                                {t.priority}
                              </span>
                              {t.dueTime && <span>at {t.dueTime}</span>}
                              {t.estimatedMinutes && <span>{t.estimatedMinutes}m</span>}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleOpenReschedule(t)}
                          className="p-1 rounded transition-colors shrink-0 cursor-pointer"
                          style={{ color: 'var(--text-muted)' }}
                          title="Reschedule task"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Day Agenda Summary Card */}
            <div
              className="rounded-2xl p-5 space-y-3.5 shadow-card"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
              }}
            >
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Layers className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
                <span>Events Summary</span>
              </h3>

              <div className="space-y-2.5">
                {events.filter((e) => e.startDate === currentDayStr).length === 0 ? (
                  <p className="text-xs py-3" style={{ color: 'var(--text-disabled)' }}>
                    No events recorded for this date.
                  </p>
                ) : (
                  events
                    .filter((e) => e.startDate === currentDayStr)
                    .map((evt) => (
                      <div
                        key={evt.id}
                        onClick={() => handleOpenEditEvent(evt)}
                        className="p-3 rounded-xl border cursor-pointer transition-all space-y-1.5 group"
                        style={{
                          backgroundColor: 'var(--bg-surface-elevated)',
                          borderColor: 'var(--border-subtle)',
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold transition-colors" style={{ color: 'var(--text-primary)' }}>
                            {evt.title}
                          </span>
                          <span
                            className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${eventBadgeStyle(
                              evt.type,
                              evt.color
                            )}`}
                          >
                            {evt.type}
                          </span>
                        </div>
                        {evt.description && (
                          <p className="text-[11px] line-clamp-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                            {evt.description}
                          </p>
                        )}
                        <div
                          className="flex items-center justify-between text-[10px] font-mono pt-1"
                          style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--text-disabled)' }}
                        >
                          <span>
                            {evt.startTime} – {evt.endTime}
                          </span>
                          {evt.location && <span>{evt.location}</span>}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE & EDIT EVENT MODAL */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-lg rounded-2xl shadow-elevated p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between pb-3"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" style={{ color: 'var(--brand-primary)' }} />
                <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  {editingEvent ? 'Edit Calendar Event' : 'Schedule New Event'}
                </h3>
              </div>
              <button
                onClick={() => setIsEventModalOpen(false)}
                className="p-1 rounded-lg transition-colors cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Duplicate Collision Warning Banner */}
            {duplicateDetected && (
              <div
                className="p-3 rounded-xl space-y-2"
                style={{
                  backgroundColor: 'rgba(251, 191, 36, 0.12)',
                  border: '1px solid rgba(251, 191, 36, 0.4)',
                }}
              >
                <div className="flex items-start gap-2 text-xs" style={{ color: 'var(--status-warning)' }}>
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Duplicate Event Detected</span>
                    <span>
                      An event titled "{formTitle.trim()}" is already scheduled on {formStartDate} at{' '}
                      {formStartTime}.
                    </span>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs cursor-pointer pt-1" style={{ color: 'var(--text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={allowDuplicateOverride}
                    onChange={(e) => setAllowDuplicateOverride(e.target.checked)}
                    className="rounded"
                  />
                  <span>Allow concurrent scheduling anyway</span>
                </label>
              </div>
            )}

            {formError && (
              <div
                className="p-2.5 rounded-xl text-xs"
                style={{
                  backgroundColor: 'rgba(251, 113, 133, 0.12)',
                  border: '1px solid rgba(251, 113, 133, 0.4)',
                  color: 'var(--status-danger)',
                }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveEvent} className="space-y-4">
              {/* Event Title */}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Event Title <span style={{ color: 'var(--brand-primary)' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deep Work: Matrix Factorization & PyTorch"
                  value={formTitle}
                  onChange={(e) => {
                    setFormTitle(e.target.value);
                    setFormError('');
                  }}
                  className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              {/* Event Type & Color */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Category / Type
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as EventType)}
                    className="w-full px-3 py-2 rounded-xl text-xs focus:outline-none transition-colors"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="deep_work">Deep Work Block</option>
                    <option value="interview">Job Interview</option>
                    <option value="study">Study Session</option>
                    <option value="exam">Exam Practice</option>
                    <option value="task_block">Task Timebox</option>
                    <option value="event">Meeting / General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Color Accent
                  </label>
                  <select
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs focus:outline-none transition-colors"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="purple">Cosmic Purple (Default Focus)</option>
                    <option value="cyan">Electric Cyan (Balanced)</option>
                    <option value="indigo">Deep Indigo (Study/Theory)</option>
                    <option value="amber">Amber (Interview/Priority)</option>
                    <option value="rose">Rose (Urgent/Exam)</option>
                    <option value="emerald">Emerald (Health/Wellness)</option>
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Start Date <span style={{ color: 'var(--brand-primary)' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => {
                      setFormStartDate(e.target.value);
                      if (!formEndDate || formEndDate < e.target.value) {
                        setFormEndDate(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs focus:outline-none transition-colors"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs focus:outline-none transition-colors"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>

              {/* Times */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Start Time <span style={{ color: 'var(--brand-primary)' }}>*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs focus:outline-none transition-colors"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    End Time <span style={{ color: 'var(--brand-primary)' }}>*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs focus:outline-none transition-colors"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>

              {/* Location or Meeting URL */}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Location or Video Link
                </label>
                <input
                  type="text"
                  placeholder="e.g. Google Meet, Desk, Library, or Zoom link"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs focus:outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              {/* Link to Existing Task */}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Connect to Task (Optional)
                </label>
                <select
                  value={formLinkedTaskId}
                  onChange={(e) => setFormLinkedTaskId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs focus:outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="">No linked task</option>
                  {tasks
                    .filter((t) => t.status !== 'completed')
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        [{t.category.toUpperCase()}] {t.title}
                      </option>
                    ))}
                </select>
              </div>

              {/* Description / Notes */}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Notes & Objective
                </label>
                <textarea
                  rows={2}
                  placeholder="Add key notes, agenda items, or links..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs focus:outline-none transition-colors resize-none"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div
                className="flex items-center justify-between pt-3"
                style={{ borderTop: '1px solid var(--border-subtle)' }}
              >
                {editingEvent ? (
                  <button
                    type="button"
                    onClick={() => setEventToDelete(editingEvent)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl transition-colors cursor-pointer"
                    style={{
                      backgroundColor: 'rgba(251, 113, 133, 0.1)',
                      color: 'var(--status-danger)',
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Event</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEventModalOpen(false)}
                    className="px-3 py-1.5 text-xs rounded-xl transition-colors cursor-pointer"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-md transition-all cursor-pointer"
                    style={{
                      backgroundColor: 'var(--brand-primary)',
                    }}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{editingEvent ? 'Save Changes' : 'Confirm & Schedule'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESCHEDULE TASK MODAL */}
      {reschedulingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-sm rounded-2xl shadow-elevated p-6 space-y-4"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
            }}
          >
            <div
              className="flex items-center justify-between pb-3"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4" style={{ color: 'var(--brand-cyan)' }} />
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  Reschedule Task
                </h3>
              </div>
              <button
                onClick={() => setReschedulingTask(null)}
                className="p-1 rounded-lg transition-colors cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-medium truncate" style={{ color: 'var(--text-secondary)' }}>
              {reschedulingTask.title}
            </p>

            {/* Quick Reschedule Presets */}
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Quick Presets
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: 'Today', days: 0 },
                  { label: '+1 Day', days: 1 },
                  { label: '+3 Days', days: 3 },
                  { label: '+7 Days', days: 7 },
                ].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() =>
                      setRescheduleDate(p.days === 0 ? todayStr : addDaysToDate(todayStr, p.days))
                    }
                    className="px-2 py-1 text-[10px] font-mono rounded-lg transition-colors cursor-pointer"
                    style={{
                      backgroundColor: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveRescheduleTask} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Due Date
                </label>
                <input
                  type="date"
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl text-xs focus:outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Due Time
                </label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl text-xs focus:outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div
                className="flex items-center justify-end gap-2 pt-2"
                style={{ borderTop: '1px solid var(--border-subtle)' }}
              >
                <button
                  type="button"
                  onClick={() => setReschedulingTask(null)}
                  className="px-3 py-1.5 text-xs rounded-xl transition-colors cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white rounded-xl shadow-sm transition-all cursor-pointer"
                  style={{
                    backgroundColor: 'var(--brand-primary)',
                  }}
                >
                  Update Task Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE EVENT CONFIRMATION MODAL */}
      {eventToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-sm rounded-2xl shadow-elevated p-6 space-y-4"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid rgba(251, 113, 133, 0.4)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2" style={{ color: 'var(--status-danger)' }}>
                <Trash2 className="w-4 h-4" />
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  Delete Calendar Event
                </h3>
              </div>
              <button
                onClick={() => setEventToDelete(null)}
                className="p-1 rounded-lg transition-colors cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Are you sure you want to delete{' '}
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                "{eventToDelete.title}"
              </span>{' '}
              on {eventToDelete.startDate}? This block will be removed from your calendar.
            </p>

            <div
              className="flex items-center justify-end gap-2 pt-2"
              style={{ borderTop: '1px solid var(--border-subtle)' }}
            >
              <button
                type="button"
                onClick={() => setEventToDelete(null)}
                className="px-3 py-1.5 text-xs rounded-xl transition-colors cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteEvent}
                className="px-3.5 py-1.5 text-xs font-semibold text-white rounded-xl shadow-sm transition-colors cursor-pointer"
                style={{
                  backgroundColor: 'var(--status-danger)',
                }}
              >
                Delete Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
