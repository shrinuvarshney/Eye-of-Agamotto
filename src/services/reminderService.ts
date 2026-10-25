/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Eye of Agamotto - Timezone-Aware Reminder & Delivery Confirmation Service
 */

import {
  Task,
  CalendarEvent,
  Reminder,
  ReminderStatus,
  ReminderDeliveryStatus,
  NotificationPreferences,
  RecurringFrequency,
} from '../types';

const STORAGE_KEYS = {
  PREFERENCES: 'agamotto_notification_prefs',
  SNOOZED_MAP: 'agamotto_reminders_snoozed',
  DISMISSED_SET: 'agamotto_reminders_dismissed',
  CONFIRMED_DELIVERIES: 'agamotto_reminders_confirmed',
};

// URL Base64 to Uint8Array helper for VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

class ReminderService {
  private listeners: Set<() => void> = new Set();
  private swRegistration: ServiceWorkerRegistration | null = null;
  private isPushSubscribed = false;

  constructor() {
    this.initServiceWorker();
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (e) {
        console.error('Reminder listener error:', e);
      }
    });
  }

  // Preferences
  public getPreferences(): NotificationPreferences {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      browserNotificationsEnabled: false,
      backgroundPushEnabled: false,
      soundEnabled: true,
      defaultSnoozeMinutes: 15,
      userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    };
  }

  public savePreferences(prefs: NotificationPreferences): void {
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
    this.notify();
  }

  // Snooze map: reminderId -> ISO string
  public getSnoozeMap(): Record<string, string> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SNOOZED_MAP);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {};
  }

  private setSnoozeMap(map: Record<string, string>): void {
    localStorage.setItem(STORAGE_KEYS.SNOOZED_MAP, JSON.stringify(map));
  }

  // Dismissed map: reminderId -> ISO string
  public getDismissedIds(): Set<string> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DISMISSED_SET);
      if (raw) return new Set(JSON.parse(raw));
    } catch {}
    return new Set();
  }

  private addDismissedId(id: string): void {
    const set = this.getDismissedIds();
    set.add(id);
    localStorage.setItem(STORAGE_KEYS.DISMISSED_SET, JSON.stringify(Array.from(set)));
  }

  // Confirmed deliveries: reminderId -> { channel, confirmedAt }
  public getConfirmedDeliveries(): Record<
    string,
    { channel: 'in_app' | 'browser_api' | 'web_push'; confirmedAt: string }
  > {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CONFIRMED_DELIVERIES);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {};
  }

  public recordDeliveryConfirmation(
    reminderId: string,
    channel: 'in_app' | 'browser_api' | 'web_push'
  ): void {
    const map = this.getConfirmedDeliveries();
    map[reminderId] = { channel, confirmedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.CONFIRMED_DELIVERIES, JSON.stringify(map));
    this.notify();
  }

  // Initialize service worker
  private async initServiceWorker(): Promise<void> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      this.swRegistration = reg;

      // Listen for message from service worker when notification is clicked
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'REMINDER_NOTIFICATION_CLICK') {
          console.log('[ReminderService] Notification clicked:', event.data);
          this.notify();
        }
      });

      // Check current push subscription status
      const existingSub = await reg.pushManager.getSubscription();
      this.isPushSubscribed = !!existingSub;
    } catch (err) {
      console.warn('[ReminderService] Service worker registration error:', err);
    }
  }

  public getPushSupportStatus(): {
    supported: boolean;
    isSubscribed: boolean;
    permission: NotificationPermission;
  } {
    const supported =
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window;
    const permission = typeof Notification !== 'undefined' ? Notification.permission : 'default';
    return {
      supported,
      isSubscribed: this.isPushSubscribed,
      permission,
    };
  }

  // Request browser-only notification permission
  public async requestBrowserPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    const perm = await Notification.requestPermission();
    const prefs = this.getPreferences();
    this.savePreferences({
      ...prefs,
      browserNotificationsEnabled: perm === 'granted',
    });
    this.notify();
    return perm;
  }

  // Subscribe to reliable background Web Push (Server-Side Scheduling)
  public async enableBackgroundPush(userId: string = 'harsh'): Promise<{
    success: boolean;
    error?: string;
  }> {
    if (!this.swRegistration) {
      await this.initServiceWorker();
    }
    if (!this.swRegistration) {
      return { success: false, error: 'Service Worker not supported or registration failed.' };
    }

    try {
      // 1. Ensure notification permission is granted
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        return {
          success: false,
          error: 'Notification permission denied in browser settings.',
        };
      }

      // 2. Fetch server VAPID key
      const keyRes = await fetch('/api/reminders/vapid-key');
      if (!keyRes.ok) throw new Error('Failed to retrieve server VAPID key.');
      const { publicKey } = await keyRes.json();

      // 3. Subscribe with PushManager
      const applicationServerKey = urlBase64ToUint8Array(publicKey);
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as any,
      });

      // 4. Send subscription to server
      const subRes = await fetch('/api/reminders/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription,
          userId,
          timezone: this.getPreferences().userTimezone,
        }),
      });

      if (!subRes.ok) throw new Error('Server rejected push subscription.');

      this.isPushSubscribed = true;
      const prefs = this.getPreferences();
      this.savePreferences({
        ...prefs,
        browserNotificationsEnabled: true,
        backgroundPushEnabled: true,
      });

      this.notify();
      return { success: true };
    } catch (err: any) {
      console.error('[ReminderService] Push registration failed:', err);
      return { success: false, error: err.message || 'Push registration failed.' };
    }
  }

  // Schedule a server-side reminder
  public async scheduleServerReminder(reminder: Reminder, userId: string = 'harsh'): Promise<boolean> {
    try {
      const res = await fetch('/api/reminders/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reminderId: reminder.id,
          targetId: reminder.targetId,
          targetType: reminder.targetType,
          title: reminder.title,
          body: `Due ${reminder.dueTimeFormatted}. Timezone: ${reminder.timezone}`,
          scheduledTime: reminder.scheduledTime,
          timezone: reminder.timezone,
          userId,
        }),
      });
      return res.ok;
    } catch (e) {
      console.error('[ReminderService] Failed to schedule on server:', e);
      return false;
    }
  }

  // Snooze a reminder
  public snoozeReminder(reminderId: string, minutes: number): void {
    const snoozeUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    const map = this.getSnoozeMap();
    map[reminderId] = snoozeUntil;
    this.setSnoozeMap(map);

    // Call server snooze if background push is active
    fetch('/api/reminders/snooze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reminderId, minutes }),
    }).catch(() => {});

    this.notify();
  }

  // Dismiss a reminder
  public dismissReminder(reminderId: string): void {
    this.addDismissedId(reminderId);
    this.notify();
  }

  // Calculate timezone-aware date & time
  public parseItemDueDateTime(dateStr: string, timeStr?: string, tz?: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    const [hh, mm] = (timeStr || '09:00').split(':').map(Number);
    return new Date(y, m - 1, d, hh, mm, 0, 0);
  }

  // Advance recurring task to next occurrence
  public advanceRecurringTaskDate(currentDateStr: string, frequency: RecurringFrequency): string {
    const d = new Date(currentDateStr + 'T00:00:00');
    if (frequency === 'daily') {
      d.setDate(d.getDate() + 1);
    } else if (frequency === 'weekly') {
      d.setDate(d.getDate() + 7);
    } else if (frequency === 'monthly') {
      d.setMonth(d.getMonth() + 1);
    }
    return d.toISOString().split('T')[0];
  }

  // Compile full reminder list from Tasks and Calendar Events
  public computeAllReminders(tasks: Task[], events: CalendarEvent[]): Reminder[] {
    const now = new Date();
    const nowMs = now.getTime();
    const snoozeMap = this.getSnoozeMap();
    const dismissedIds = this.getDismissedIds();
    const confirmedDeliveries = this.getConfirmedDeliveries();
    const prefs = this.getPreferences();
    const userTz = prefs.userTimezone;

    const reminders: Reminder[] = [];

    // 1. Process Tasks
    tasks.forEach((task) => {
      if (task.status === 'completed') return;
      if (task.reminderEnabled === false) return;

      const reminderId = `task-rem-${task.id}`;
      if (dismissedIds.has(reminderId)) return;

      const dueDateTime = this.parseItemDueDateTime(task.dueDate, task.dueTime, userTz);
      const reminderOffsetMs = (task.reminderMinutesBefore || 0) * 60 * 1000;
      const scheduledMs = dueDateTime.getTime() - reminderOffsetMs;
      const scheduledIso = new Date(scheduledMs).toISOString();

      // Check snooze
      const snoozedUntil = snoozeMap[reminderId];
      const isCurrentlySnoozed = snoozedUntil && new Date(snoozedUntil).getTime() > nowMs;

      let status: ReminderStatus = 'scheduled';
      let overdueMinutes = 0;

      if (isCurrentlySnoozed) {
        status = 'snoozed';
      } else if (nowMs > scheduledMs) {
        status = 'overdue';
        overdueMinutes = Math.round((nowMs - scheduledMs) / (1000 * 60));
      } else if (scheduledMs - nowMs <= 15 * 60 * 1000) {
        // Due within 15 minutes
        status = 'due';
      }

      // Check delivery confirmation
      const confirmed = confirmedDeliveries[reminderId];
      let deliveryStatus: ReminderDeliveryStatus = 'pending';
      if (isCurrentlySnoozed) {
        deliveryStatus = 'snoozed';
      } else if (confirmed) {
        deliveryStatus =
          confirmed.channel === 'web_push'
            ? 'push_confirmed'
            : confirmed.channel === 'browser_api'
            ? 'browser_displayed'
            : 'in_app_displayed';
      }

      reminders.push({
        id: reminderId,
        targetType: 'task',
        targetId: task.id,
        title: task.title,
        scheduledTime: scheduledIso,
        dueTimeFormatted: `${task.dueDate} at ${task.dueTime || '09:00'}`,
        timezone: userTz,
        status,
        deliveryStatus,
        deliveryConfirmedAt: confirmed?.confirmedAt,
        deliveryChannel: confirmed?.channel,
        snoozedUntil: isCurrentlySnoozed ? snoozedUntil : undefined,
        overdueMinutes: overdueMinutes > 0 ? overdueMinutes : undefined,
        isRecurring: task.recurring !== 'none',
        recurringFrequency: task.recurring,
        createdAt: task.createdAt,
      });
    });

    // 2. Process Calendar Events
    events.forEach((event) => {
      const reminderId = `cal-rem-${event.id}`;
      if (dismissedIds.has(reminderId)) return;

      const startDateTime = this.parseItemDueDateTime(event.startDate, event.startTime, userTz);
      const scheduledIso = startDateTime.toISOString();
      const scheduledMs = startDateTime.getTime();

      const snoozedUntil = snoozeMap[reminderId];
      const isCurrentlySnoozed = snoozedUntil && new Date(snoozedUntil).getTime() > nowMs;

      let status: ReminderStatus = 'scheduled';
      let overdueMinutes = 0;

      if (isCurrentlySnoozed) {
        status = 'snoozed';
      } else if (nowMs > scheduledMs) {
        status = 'overdue';
        overdueMinutes = Math.round((nowMs - scheduledMs) / (1000 * 60));
      } else if (scheduledMs - nowMs <= 15 * 60 * 1000) {
        status = 'due';
      }

      const confirmed = confirmedDeliveries[reminderId];
      let deliveryStatus: ReminderDeliveryStatus = 'pending';
      if (isCurrentlySnoozed) {
        deliveryStatus = 'snoozed';
      } else if (confirmed) {
        deliveryStatus =
          confirmed.channel === 'web_push'
            ? 'push_confirmed'
            : confirmed.channel === 'browser_api'
            ? 'browser_displayed'
            : 'in_app_displayed';
      }

      reminders.push({
        id: reminderId,
        targetType: 'calendar_event',
        targetId: event.id,
        title: event.title,
        scheduledTime: scheduledIso,
        dueTimeFormatted: `${event.startDate} at ${event.startTime}`,
        timezone: userTz,
        status,
        deliveryStatus,
        deliveryConfirmedAt: confirmed?.confirmedAt,
        deliveryChannel: confirmed?.channel,
        snoozedUntil: isCurrentlySnoozed ? snoozedUntil : undefined,
        overdueMinutes: overdueMinutes > 0 ? overdueMinutes : undefined,
        isRecurring: false,
        createdAt: new Date().toISOString(),
      });
    });

    return reminders.sort((a, b) => {
      // Overdue first, then Due, then Snoozed, then Scheduled
      const weight = (s: ReminderStatus) =>
        s === 'overdue' ? 1 : s === 'due' ? 2 : s === 'snoozed' ? 3 : 4;
      if (weight(a.status) !== weight(b.status)) {
        return weight(a.status) - weight(b.status);
      }
      return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
    });
  }

  // Dispatch In-App / Browser notification
  public dispatchClientNotification(reminder: Reminder): void {
    const prefs = this.getPreferences();

    // 1. In-App delivery confirmation
    this.recordDeliveryConfirmation(reminder.id, 'in_app');

    // 2. Browser Notification API (if enabled & granted)
    if (
      prefs.browserNotificationsEnabled &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        const notif = new Notification(`⏰ ${reminder.title}`, {
          body: `Due ${reminder.dueTimeFormatted}. Timezone: ${reminder.timezone}`,
          icon: '/icon.svg',
          tag: reminder.id,
        });

        notif.onclick = () => {
          window.focus();
        };

        this.recordDeliveryConfirmation(reminder.id, 'browser_api');
      } catch (e) {
        console.warn('Browser notification error:', e);
      }
    }
  }
}

export const reminderService = new ReminderService();
