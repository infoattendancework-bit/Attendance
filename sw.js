// sw.js
// Minimal service worker: no offline caching, just lets us call
// self.registration.showNotification() from the page so a "new notice"
// can appear as a real OS notification (with sound + vibration) instead
// of only an in-page beep. This works while the browser process is
// alive, including when this tab is backgrounded on Android — it does
// NOT work once the screen is fully locked or the browser is killed;
// that requires real push (Firebase Cloud Messaging or similar).

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// The page posts a message here whenever a genuinely new notice arrives.
// We ask the service worker to show the notification (rather than the
// page calling `new Notification(...)` directly) because service-worker
// notifications keep showing even if the tab is in the background.
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type !== 'SHOW_NOTICE') return;

  const title = data.subject || 'New notice';
  const options = {
    body: data.message || '',
    icon: 'https://raw.githubusercontent.com/infoattendancework-bit/Attendance/main/logo%20(1).png',
    badge: 'https://raw.githubusercontent.com/infoattendancework-bit/Attendance/main/logo%20(1).png',
    vibrate: [200, 100, 200],
    tag: 'attendance-notice-' + (data.id || Date.now()),
    renotify: true,
    data: { url: data.url || './employee-attendance.html' }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Tapping the notification focuses/opens the attendance tab.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || './employee-attendance.html';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsList) => {
      for (const client of clientsList) {
        if (client.url.includes('employee-attendance') && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
