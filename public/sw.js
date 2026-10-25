/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Eye of Agamotto - Background Service Worker for Web Push & Notification Lifecycle
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Web Push Event Handler
self.addEventListener('push', (event) => {
  let payload = {
    title: 'Eye of Agamotto Reminder',
    body: 'A scheduled task or calendar block requires your attention.',
    reminderId: null,
    targetType: 'task',
    tag: 'agamotto-reminder',
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    } catch (e) {
      payload.body = event.data.text();
    }
  }

  const notificationOptions = {
    body: payload.body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: payload.tag || `reminder-${payload.reminderId || Date.now()}`,
    data: payload,
    requireInteraction: true,
    actions: [
      { action: 'snooze_15', title: '⏱ Snooze 15m' },
      { action: 'open', title: '👁 Open App' },
    ],
  };

  event.waitUntil(
    self.registration
      .showNotification(payload.title, notificationOptions)
      .then(() => {
        // Send confirmed delivery receipt back to server if reminderId is provided!
        if (payload.reminderId) {
          return fetch('/api/reminders/ack', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reminderId: payload.reminderId,
              status: 'push_confirmed',
              deliveredAt: new Date().toISOString(),
            }),
          }).catch((err) => {
            console.error('[SW] Failed to send push ACK:', err);
          });
        }
      })
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};

  if (event.action === 'snooze_15' && data.reminderId) {
    event.waitUntil(
      fetch('/api/reminders/snooze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reminderId: data.reminderId,
          minutes: 15,
        }),
      }).catch((err) => console.error('[SW] Snooze request failed:', err))
    );
    return;
  }

  // Open / focus app window
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            client.postMessage({
              type: 'REMINDER_NOTIFICATION_CLICK',
              reminderId: data.reminderId,
              targetId: data.targetId,
              targetType: data.targetType,
            });
            return;
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      })
  );
});
