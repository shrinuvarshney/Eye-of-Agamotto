/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Eye of Agamotto - Cosmic Purple Quick Capture Modal
 */

import React, { useState } from 'react';
import { X, CheckSquare, BookOpen, Calendar, Flag, Check, Bell } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { Priority, TaskCategory, RecurringFrequency, EventType } from '../../types';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

type TabType = 'task' | 'note' | 'event' | 'goal';

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('task');

  const getLocalToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState<Priority>('medium');
  const [taskCategory, setTaskCategory] = useState<TaskCategory>('study');
  const [taskDueDate, setTaskDueDate] = useState(getLocalToday);
  const [taskDueTime, setTaskDueTime] = useState('18:00');
  const [taskRecurring, setTaskRecurring] = useState<RecurringFrequency>('none');
  const [taskTags, setTaskTags] = useState('');
  const [taskReminderEnabled, setTaskReminderEnabled] = useState(false);
  const [taskReminderMinutesBefore, setTaskReminderMinutesBefore] = useState(15);

  // Note form state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteFolderId, setNoteFolderId] = useState('folder-genai');
  const [noteContent, setNoteContent] = useState('');
  const [noteTags, setNoteTags] = useState('');

  // Event form state
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<EventType>('deep_work');
  const [eventDate, setEventDate] = useState(getLocalToday);
  const [eventStart, setEventStart] = useState('10:00');
  const [eventEnd, setEventEnd] = useState('11:30');
  const [eventLocation, setEventLocation] = useState('');

  // Goal form state
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTimeframe, setGoalTimeframe] = useState<'annual' | 'quarterly' | 'monthly'>('quarterly');
  const [goalCategory, setGoalCategory] = useState<'learning' | 'career' | 'projects' | 'health'>('learning');
  const [goalDueDate, setGoalDueDate] = useState('2026-12-31');

  // Error feedback
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (activeTab === 'task') {
      if (!taskTitle.trim()) {
        setErrorMsg('Task title is required');
        return;
      }
      storageService.addTask({
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        priority: taskPriority,
        category: taskCategory,
        status: 'todo',
        dueDate: taskDueDate,
        dueTime: taskDueTime || undefined,
        recurring: taskRecurring,
        tags: taskTags ? taskTags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        reminderEnabled: taskReminderEnabled,
        reminderMinutesBefore: taskReminderEnabled ? taskReminderMinutesBefore : undefined,
      });
      onSuccess(`Created task "${taskTitle.trim()}"`);
    } else if (activeTab === 'note') {
      if (!noteTitle.trim()) {
        setErrorMsg('Note title is required');
        return;
      }
      storageService.addNote({
        title: noteTitle.trim(),
        folderId: noteFolderId,
        content: noteContent.trim() || '# ' + noteTitle.trim(),
        tags: noteTags ? noteTags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        isBookmarked: false,
        isPinned: false,
      });
      onSuccess(`Created note "${noteTitle.trim()}"`);
    } else if (activeTab === 'event') {
      if (!eventTitle.trim()) {
        setErrorMsg('Event title is required');
        return;
      }
      if (
        storageService.checkCalendarEventDuplicate({
          title: eventTitle,
          startDate: eventDate,
          startTime: eventStart,
        })
      ) {
        setErrorMsg('An event with this title and start time is already scheduled on this day.');
        return;
      }
      storageService.addCalendarEvent({
        title: eventTitle.trim(),
        type: eventType,
        startDate: eventDate,
        startTime: eventStart,
        endDate: eventDate,
        endTime: eventEnd,
        location: eventLocation.trim() || undefined,
      });
      onSuccess(`Scheduled event "${eventTitle.trim()}"`);
    } else if (activeTab === 'goal') {
      if (!goalTitle.trim()) {
        setErrorMsg('Goal title is required');
        return;
      }
      const existingGoals = storageService.getGoals();
      existingGoals.push({
        id: `goal-${Date.now()}`,
        title: goalTitle.trim(),
        timeframe: goalTimeframe,
        category: goalCategory,
        dueDate: goalDueDate,
        keyResults: [
          {
            id: `kr-${Date.now()}-1`,
            title: 'Initial setup & requirements complete',
            completed: false,
          },
        ],
      });
      storageService.saveGoals(existingGoals);
      onSuccess(`Saved goal "${goalTitle.trim()}"`);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] rounded-2xl shadow-elevated overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[var(--text-primary)] tracking-wide">Quick Capture</span>
            <span className="text-xs text-[var(--text-muted)]">· Add to Eye of Agamotto</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Tab Selector */}
        <div className="flex items-center gap-1.5 px-6 pt-3 pb-3 border-b border-[var(--border-subtle)] bg-[var(--bg-app)]">
          <button
            type="button"
            onClick={() => setActiveTab('task')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'task'
                ? 'bg-[var(--brand-primary)] text-white shadow-sm font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Task</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('note')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'note'
                ? 'bg-[var(--brand-primary)] text-white shadow-sm font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Note</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('event')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'event'
                ? 'bg-[var(--brand-primary)] text-white shadow-sm font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Event</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('goal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'goal'
                ? 'bg-[var(--brand-primary)] text-white shadow-sm font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Goal</span>
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-[var(--status-danger)]/15 border border-[var(--status-danger)]/40 text-xs text-[var(--status-danger)]">
              {errorMsg}
            </div>
          )}

          {activeTab === 'task' && (
            <>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Task Title <span className="text-[var(--brand-primary)]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master KV cache memory calculation"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--brand-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional context or acceptance criteria..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--brand-primary)] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as Priority)}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
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
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value as TaskCategory)}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                  >
                    <option value="study">Study</option>
                    <option value="work">Work</option>
                    <option value="career">Career</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Due Time</label>
                  <input
                    type="time"
                    value={taskDueTime}
                    onChange={(e) => setTaskDueTime(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Recurrence</label>
                  <select
                    value={taskRecurring}
                    onChange={(e) => setTaskRecurring(e.target.value as RecurringFrequency)}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                  >
                    <option value="none">Does not repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="AI, Math, GATE"
                    value={taskTags}
                    onChange={(e) => setTaskTags(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>
              </div>

              {/* Optional Reminder */}
              <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-[var(--brand-cyan)]" />
                    <span className="text-xs font-medium text-[var(--text-primary)]">Set Reminder Notification</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={taskReminderEnabled}
                      onChange={(e) => setTaskReminderEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[var(--bg-app)] border border-[var(--border-default)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--brand-primary)]"></div>
                  </label>
                </div>

                {taskReminderEnabled && (
                  <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Trigger Alert</span>
                    <select
                      value={taskReminderMinutesBefore}
                      onChange={(e) => setTaskReminderMinutesBefore(Number(e.target.value))}
                      className="px-2.5 py-1 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-md text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
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
            </>
          )}

          {activeTab === 'note' && (
            <>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Note Title <span className="text-[var(--brand-primary)]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FlashAttention-2 Memory IO Analysis"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--brand-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Folder</label>
                  <select
                    value={noteFolderId}
                    onChange={(e) => setNoteFolderId(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                  >
                    <option value="folder-genai">GenAI & LLMs</option>
                    <option value="folder-math">GATE DA Math</option>
                    <option value="folder-sys">System Design</option>
                    <option value="folder-career">Career & Interviews</option>
                    <option value="folder-all">All Notes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="Architecture, Paper, GPU"
                    value={noteTags}
                    onChange={(e) => setNoteTags(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Markdown Body</label>
                <textarea
                  rows={4}
                  placeholder="# Core Equations..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--brand-primary)] resize-none"
                />
              </div>
            </>
          )}

          {activeTab === 'event' && (
            <>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Event Title <span className="text-[var(--brand-primary)]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deep Work: Transformer Backpropagation"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--brand-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Type</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as EventType)}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                  >
                    <option value="deep_work">Deep Work Block</option>
                    <option value="interview">Interview</option>
                    <option value="exam">Exam Practice</option>
                    <option value="event">Meeting / Event</option>
                    <option value="task_block">Task Timebox</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Start Time</label>
                  <input
                    type="time"
                    value={eventStart}
                    onChange={(e) => setEventStart(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">End Time</label>
                  <input
                    type="time"
                    value={eventEnd}
                    onChange={(e) => setEventEnd(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Location or Link</label>
                <input
                  type="text"
                  placeholder="e.g. Google Meet or Study Desk"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--brand-primary)]"
                />
              </div>
            </>
          )}

          {activeTab === 'goal' && (
            <>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Goal Title <span className="text-[var(--brand-primary)]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Publish Open-Source RAG Benchmark on Hugging Face"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--brand-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Timeframe</label>
                  <select
                    value={goalTimeframe}
                    onChange={(e) => setGoalTimeframe(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                  >
                    <option value="quarterly">Quarterly</option>
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Category</label>
                  <select
                    value={goalCategory}
                    onChange={(e) => setGoalCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                  >
                    <option value="learning">Learning</option>
                    <option value="career">Career</option>
                    <option value="projects">Projects</option>
                    <option value="health">Personal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Target Deadline</label>
                <input
                  type="date"
                  value={goalDueDate}
                  onChange={(e) => setGoalDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                />
              </div>
            </>
          )}

          {/* Form Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] rounded-lg shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] glow-purple"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
