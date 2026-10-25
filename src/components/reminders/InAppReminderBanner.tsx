/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Eye of Agamotto - In-App Real-time Reminder Toast & Banner
 */

import React, { useState, useEffect } from 'react';
import { Bell, Clock, X, Check, Repeat, Sparkles } from 'lucide-react';
import { Reminder, Task } from '../../types';
import { reminderService } from '../../services/reminderService';
import { storageService } from '../../services/storageService';

interface InAppReminderBannerProps {
  tasks: Task[];
  onTasksChange: () => void;
  onOpenNotificationCenter: () => void;
}

export const InAppReminderBanner: React.FC<InAppReminderBannerProps> = ({
  tasks,
  onTasksChange,
  onOpenNotificationCenter,
}) => {
  const [activeAlert, setActiveAlert] = useState<Reminder | null>(null);

  useEffect(() => {
    const checkReminders = () => {
      const all = reminderService.computeAllReminders(tasks, []);
      // Look for active due or overdue reminders that have not been dismissed or snoozed
      const urgent = all.find((r) => r.status === 'due' || r.status === 'overdue');

      if (urgent && (!activeAlert || activeAlert.id !== urgent.id)) {
        setActiveAlert(urgent);
        reminderService.dispatchClientNotification(urgent);
      } else if (!urgent && activeAlert) {
        setActiveAlert(null);
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, 15000);
    const unsub = reminderService.subscribe(checkReminders);

    return () => {
      clearInterval(interval);
      unsub();
    };
  }, [tasks, activeAlert]);

  if (!activeAlert) return null;

  const handleSnooze = (minutes: number) => {
    reminderService.snoozeReminder(activeAlert.id, minutes);
    setActiveAlert(null);
  };

  const handleDismiss = () => {
    reminderService.dismissReminder(activeAlert.id);
    setActiveAlert(null);
  };

  const handleComplete = () => {
    if (activeAlert.targetType === 'task') {
      const task = tasks.find((t) => t.id === activeAlert.targetId);
      if (task) {
        if (task.recurring !== 'none') {
          const nextDate = reminderService.advanceRecurringTaskDate(task.dueDate, task.recurring);
          storageService.updateTask({
            ...task,
            dueDate: nextDate,
            status: 'todo',
          });
        } else {
          storageService.updateTask({
            ...task,
            status: 'completed',
            completedAt: new Date().toISOString(),
          });
        }
        onTasksChange();
      }
    }
    reminderService.dismissReminder(activeAlert.id);
    setActiveAlert(null);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 duration-200">
      <div
        className="p-4 rounded-2xl shadow-elevated space-y-3"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                color: 'var(--brand-primary)',
              }}
            >
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span
                  className="text-[10px] font-mono uppercase tracking-wider font-semibold"
                  style={{
                    color: activeAlert.status === 'overdue' ? 'var(--status-danger)' : 'var(--brand-primary)',
                  }}
                >
                  {activeAlert.status === 'overdue' ? 'Overdue Reminder' : 'Reminder Due Now'}
                </span>
                {activeAlert.isRecurring && (
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded flex items-center gap-0.5"
                    style={{
                      backgroundColor: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <Repeat className="w-2.5 h-2.5" />
                    <span className="capitalize">{activeAlert.recurringFrequency}</span>
                  </span>
                )}
              </div>
              <h4
                className="text-xs font-semibold truncate max-w-[220px]"
                style={{ color: 'var(--text-primary)' }}
              >
                {activeAlert.title}
              </h4>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg transition-colors cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="text-[11px] font-mono flex items-center justify-between" style={{ color: 'var(--text-muted)' }}>
          <span>Due: {activeAlert.dueTimeFormatted}</span>
          <span style={{ color: 'var(--brand-cyan)' }} className="text-[10px] flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            <span>Agamotto Sync ✓</span>
          </span>
        </div>

        {/* Action Buttons */}
        <div
          className="flex items-center justify-between pt-2.5"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center gap-1">
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Snooze:
            </span>
            {[5, 15, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => handleSnooze(mins)}
                className="px-2 py-0.5 rounded-lg text-[10px] font-mono transition-colors cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                +{mins === 60 ? '1h' : `${mins}m`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleComplete}
              className="flex items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-semibold text-white shadow-sm transition-all cursor-pointer"
              style={{
                backgroundColor: 'var(--brand-primary)',
              }}
            >
              <Check className="w-3 h-3" />
              <span>{activeAlert.isRecurring ? 'Advance' : 'Complete'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
