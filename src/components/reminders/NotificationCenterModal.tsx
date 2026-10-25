/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Eye of Agamotto - Notification Center & Reminders Management
 */

import React, { useState } from 'react';
import {
  Bell,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  Volume2,
  VolumeX,
  ShieldCheck,
  Globe,
  Radio,
  ExternalLink,
  ChevronRight,
  Repeat,
  RotateCcw,
  Check,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Reminder, Task, CalendarEvent, NavigationItem } from '../../types';
import { reminderService } from '../../services/reminderService';
import { storageService } from '../../services/storageService';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  events: CalendarEvent[];
  onTasksChange: () => void;
  onNavigate: (tab: NavigationItem) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  tasks,
  events,
  onTasksChange,
  onNavigate,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'due' | 'overdue' | 'snoozed'>('all');
  const [pushLoading, setPushLoading] = useState(false);
  const [pushStatusMessage, setPushStatusMessage] = useState<string | null>(null);

  const reminders = reminderService.computeAllReminders(tasks, events);
  const prefs = reminderService.getPreferences();
  const pushStatus = reminderService.getPushSupportStatus();

  if (!isOpen) return null;

  const dueCount = reminders.filter((r) => r.status === 'due').length;
  const overdueCount = reminders.filter((r) => r.status === 'overdue').length;
  const snoozedCount = reminders.filter((r) => r.status === 'snoozed').length;

  const filteredReminders = reminders.filter((r) => {
    if (filterMode === 'due') return r.status === 'due';
    if (filterMode === 'overdue') return r.status === 'overdue';
    if (filterMode === 'snoozed') return r.status === 'snoozed';
    return true;
  });

  const handleSnooze = (reminderId: string, minutes: number) => {
    reminderService.snoozeReminder(reminderId, minutes);
  };

  const handleDismiss = (reminderId: string) => {
    reminderService.dismissReminder(reminderId);
  };

  const handleCompleteTask = (taskId: string, isRecurring?: boolean, recurringFreq?: any) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (isRecurring && recurringFreq && recurringFreq !== 'none') {
      const nextDate = reminderService.advanceRecurringTaskDate(task.dueDate, recurringFreq);
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

    reminderService.dismissReminder(`task-rem-${taskId}`);
    onTasksChange();
  };

  const handleEnablePush = async () => {
    setPushLoading(true);
    setPushStatusMessage(null);
    const res = await reminderService.enableBackgroundPush('harsh');
    setPushLoading(false);
    if (res.success) {
      setPushStatusMessage('Reliable Background Web Push activated! Reminders are synced with the server.');
    } else {
      setPushStatusMessage(`Push setup notice: ${res.error || 'Failed to activate web push.'}`);
    }
  };

  const handleRequestBrowserPermission = async () => {
    await reminderService.requestBrowserPermission();
  };

  const renderDeliveryBadge = (reminder: Reminder) => {
    if (reminder.deliveryStatus === 'push_confirmed') {
      return (
        <span
          className="text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1"
          style={{
            backgroundColor: 'rgba(139, 92, 246, 0.15)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            color: 'var(--brand-secondary)',
          }}
        >
          <ShieldCheck className="w-3 h-3" />
          <span>Confirmed Push Delivery ({new Date(reminder.deliveryConfirmedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
        </span>
      );
    }
    if (reminder.deliveryStatus === 'browser_displayed') {
      return (
        <span
          className="text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1"
          style={{
            backgroundColor: 'rgba(34, 211, 238, 0.15)',
            border: '1px solid rgba(34, 211, 238, 0.3)',
            color: 'var(--brand-cyan)',
          }}
        >
          <Check className="w-3 h-3" />
          <span>Confirmed in Browser ({new Date(reminder.deliveryConfirmedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
        </span>
      );
    }
    if (reminder.deliveryStatus === 'in_app_displayed') {
      return (
        <span
          className="text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1"
          style={{
            backgroundColor: 'rgba(52, 211, 153, 0.15)',
            border: '1px solid rgba(52, 211, 153, 0.3)',
            color: 'var(--status-success)',
          }}
        >
          <Check className="w-3 h-3" />
          <span>Confirmed In-App ({new Date(reminder.deliveryConfirmedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
        </span>
      );
    }
    if (reminder.deliveryStatus === 'snoozed') {
      return (
        <span
          className="text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1"
          style={{
            backgroundColor: 'rgba(251, 191, 36, 0.15)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            color: 'var(--status-warning)',
          }}
        >
          <Clock className="w-3 h-3" />
          <span>Snoozed until {new Date(reminder.snoozedUntil!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </span>
      );
    }
    return (
      <span
        className="text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1"
        style={{
          backgroundColor: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-disabled)',
        }}
      >
        <Clock className="w-3 h-3" />
        <span>Pending Trigger</span>
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl rounded-2xl shadow-elevated p-6 max-h-[90vh] flex flex-col space-y-4"
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
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-xl"
              style={{
                backgroundColor: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                color: 'var(--brand-primary)',
              }}
            >
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <span>Reminders & Time-Locked Alerts</span>
                {overdueCount > 0 && (
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold"
                    style={{
                      backgroundColor: 'rgba(251, 113, 133, 0.15)',
                      border: '1px solid rgba(251, 113, 133, 0.3)',
                      color: 'var(--status-danger)',
                    }}
                  >
                    {overdueCount} Overdue
                  </span>
                )}
              </h2>
              <p className="text-xs flex items-center gap-1.5 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                <Globe className="w-3 h-3" style={{ color: 'var(--brand-cyan)' }} />
                <span>Timezone: {prefs.userTimezone}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notification Modes Clarity Card */}
        <div
          className="p-4 rounded-xl space-y-3"
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
              <Radio className="w-3.5 h-3.5" style={{ color: 'var(--brand-cyan)' }} />
              <span>Notification Delivery Channels</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  reminderService.savePreferences({
                    ...prefs,
                    soundEnabled: !prefs.soundEnabled,
                  })
                }
                className="text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
                title={prefs.soundEnabled ? 'Mute alert chime' : 'Enable alert chime'}
              >
                {prefs.soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5" style={{ color: 'var(--brand-primary)' }} />
                ) : (
                  <VolumeX className="w-3.5 h-3.5" style={{ color: 'var(--text-disabled)' }} />
                )}
                <span>{prefs.soundEnabled ? 'Chime ON' : 'Muted'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Channel 1: Browser-Only Notifications */}
            <div
              className="p-3 rounded-xl space-y-2"
              style={{
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Browser-Only Alerts
                </span>
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded capitalize"
                  style={{
                    backgroundColor:
                      Notification.permission === 'granted'
                        ? 'rgba(52, 211, 153, 0.15)'
                        : 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color:
                      Notification.permission === 'granted'
                        ? 'var(--status-success)'
                        : 'var(--text-muted)',
                  }}
                >
                  {Notification.permission}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Operates via standard HTML5 Notification API. Triggers only while this browser window/tab is running.
              </p>
              {Notification.permission !== 'granted' && (
                <button
                  onClick={handleRequestBrowserPermission}
                  className="w-full mt-1 px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Request Permission
                </button>
              )}
            </div>

            {/* Channel 2: Reliable Background Notifications */}
            <div
              className="p-3 rounded-xl space-y-2"
              style={{
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold flex items-center gap-1" style={{ color: 'var(--brand-secondary)' }}>
                  <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--brand-cyan)' }} />
                  <span>Reliable Background Push</span>
                </span>
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: pushStatus.isSubscribed
                      ? 'rgba(139, 92, 246, 0.15)'
                      : 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: pushStatus.isSubscribed ? 'var(--brand-secondary)' : 'var(--text-muted)',
                    fontWeight: pushStatus.isSubscribed ? 700 : 400,
                  }}
                >
                  {pushStatus.isSubscribed ? 'Active' : 'Unsubscribed'}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Server-scheduled Web Push via Service Worker. Wakes device even when the browser tab is completely closed.
              </p>
              {!pushStatus.isSubscribed ? (
                <button
                  onClick={handleEnablePush}
                  disabled={pushLoading}
                  className="w-full mt-1 px-2.5 py-1 text-[11px] font-semibold text-white rounded-lg transition-colors cursor-pointer"
                  style={{
                    backgroundColor: 'var(--brand-primary)',
                  }}
                >
                  {pushLoading ? 'Activating...' : 'Enable Background Push'}
                </button>
              ) : (
                <div className="text-[10px] font-mono flex items-center gap-1" style={{ color: 'var(--brand-cyan)' }}>
                  <Check className="w-3 h-3" />
                  <span>Server sync active</span>
                </div>
              )}
            </div>
          </div>

          {pushStatusMessage && (
            <p
              className="text-[11px] font-mono p-2 rounded-lg"
              style={{
                backgroundColor: 'rgba(34, 211, 238, 0.12)',
                border: '1px solid rgba(34, 211, 238, 0.3)',
                color: 'var(--brand-cyan)',
              }}
            >
              {pushStatusMessage}
            </p>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'All Reminders', count: reminders.length },
            { id: 'overdue', label: 'Overdue', count: overdueCount },
            { id: 'due', label: 'Due Now', count: dueCount },
            { id: 'snoozed', label: 'Snoozed', count: snoozedCount },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterMode(f.id as any)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              style={{
                backgroundColor:
                  filterMode === f.id ? 'rgba(139, 92, 246, 0.18)' : 'var(--bg-surface-elevated)',
                border: `1px solid ${filterMode === f.id ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                color: filterMode === f.id ? 'var(--brand-secondary)' : 'var(--text-muted)',
                fontWeight: filterMode === f.id ? 700 : 500,
              }}
            >
              <span>{f.label}</span>
              <span className="text-[10px] font-mono opacity-80">({f.count})</span>
            </button>
          ))}
        </div>

        {/* Reminder List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filteredReminders.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--brand-primary)',
                }}
              >
                <Bell className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                No active reminders
              </h4>
              <p className="text-[11px] max-w-xs mx-auto" style={{ color: 'var(--text-muted)' }}>
                All scheduled tasks and calendar events are up to date.
              </p>
            </div>
          ) : (
            filteredReminders.map((r) => {
              const isTask = r.targetType === 'task';

              return (
                <div
                  key={r.id}
                  className="p-4 rounded-xl transition-all space-y-3"
                  style={{
                    backgroundColor:
                      r.status === 'overdue'
                        ? 'rgba(251, 113, 133, 0.08)'
                        : r.status === 'due'
                        ? 'rgba(251, 191, 36, 0.08)'
                        : 'var(--bg-surface-elevated)',
                    border: `1px solid ${
                      r.status === 'overdue'
                        ? 'rgba(251, 113, 133, 0.4)'
                        : r.status === 'due'
                        ? 'rgba(251, 191, 36, 0.4)'
                        : 'var(--border-default)'
                    }`,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                          {isTask ? 'Task Reminder' : 'Calendar Event'}
                        </span>
                        {r.isRecurring && (
                          <span
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1"
                            style={{
                              backgroundColor: 'rgba(34, 211, 238, 0.12)',
                              border: '1px solid rgba(34, 211, 238, 0.3)',
                              color: 'var(--brand-cyan)',
                            }}
                          >
                            <Repeat className="w-2.5 h-2.5" />
                            <span className="capitalize">{r.recurringFrequency}</span>
                          </span>
                        )}
                        {r.status === 'overdue' && (
                          <span
                            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1"
                            style={{
                              backgroundColor: 'rgba(251, 113, 133, 0.15)',
                              border: '1px solid rgba(251, 113, 133, 0.4)',
                              color: 'var(--status-danger)',
                            }}
                          >
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>Overdue by {r.overdueMinutes}m</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                        {r.title}
                      </h4>

                      <div className="text-xs font-mono flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                        <Clock className="w-3 h-3" />
                        <span>Scheduled: {r.dueTimeFormatted}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleDismiss(r.id)}
                        className="p-1 rounded-lg transition-colors cursor-pointer"
                        style={{ color: 'var(--text-muted)' }}
                        title="Dismiss Reminder"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Delivery Status Confirmation */}
                  <div
                    className="flex items-center justify-between text-xs pt-2 flex-wrap gap-2"
                    style={{ borderTop: '1px solid var(--border-subtle)' }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        Delivery State:
                      </span>
                      {renderDeliveryBadge(r)}
                    </div>

                    {/* Action Buttons: Snooze & Complete */}
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1">
                        {[5, 15, 60].map((mins) => (
                          <button
                            key={mins}
                            onClick={() => handleSnooze(r.id, mins)}
                            className="px-2 py-1 rounded-lg text-[10px] font-mono transition-colors cursor-pointer"
                            style={{
                              backgroundColor: 'var(--bg-app)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-secondary)',
                            }}
                            title={`Snooze ${mins}m`}
                          >
                            +{mins === 60 ? '1h' : `${mins}m`}
                          </button>
                        ))}
                      </div>

                      {isTask && (
                        <button
                          onClick={() =>
                            handleCompleteTask(r.targetId, r.isRecurring, r.recurringFrequency)
                          }
                          className="flex items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-semibold text-white shadow-sm transition-all cursor-pointer"
                          style={{
                            backgroundColor: 'var(--brand-primary)',
                          }}
                        >
                          <Check className="w-3 h-3" />
                          <span>{r.isRecurring ? 'Complete & Advance' : 'Complete'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
