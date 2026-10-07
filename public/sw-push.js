// Service Worker for Push Notifications
// This handles background push notifications for iOS PWA and all platforms

const CACHE_NAME = 'planik-v1';

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
        );
      }),
    ])
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event);
  
  let notificationData = {
    title: 'Planik Fitness',
    body: 'Time for your workout! 💪',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'workout-reminder',
    requireInteraction: true,
    data: {
      url: '/',
      timestamp: Date.now()
    }
  };

  // Try to get data from push event
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (e) {
      // If not JSON, use text
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      vibrate: [200, 100, 200],
      actions: [
        { action: 'open', title: 'Open App' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    })
  );
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Focus or open the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window if app isn't open
      if (clients.openWindow) {
        const url = event.notification.data?.url || '/';
        return clients.openWindow(url);
      }
    })
  );
});

// Background sync for scheduled notifications
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'workout-reminder') {
    event.waitUntil(checkScheduledReminders());
  }
});

// Periodic background sync (for browsers that support it)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag);
  
  if (event.tag === 'check-reminders') {
    event.waitUntil(checkScheduledReminders());
  }
});

// Check for scheduled reminders
async function checkScheduledReminders() {
  console.log('[SW] Checking scheduled reminders...');
  
  // Get scheduled reminders from IndexedDB or send message to client
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({
      type: 'CHECK_REMINDERS',
      timestamp: Date.now()
    });
  });
}

// Listen for messages from the main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SCHEDULE_NOTIFICATION') {
    scheduleLocalNotification(event.data.notification);
  }
  
  if (event.data.type === 'SHOW_NOTIFICATION') {
    showImmediateNotification(event.data.notification);
  }
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Schedule a notification to be shown at a specific time
function scheduleLocalNotification(notification) {
  const delay = notification.scheduledTime - Date.now();
  
  if (delay <= 0) {
    showImmediateNotification(notification);
    return;
  }

  // Use setTimeout for scheduling (limited but works for short delays)
  setTimeout(() => {
    showImmediateNotification(notification);
  }, delay);
  
  console.log('[SW] Notification scheduled for', new Date(notification.scheduledTime).toLocaleString());
}

// Show a notification immediately
function showImmediateNotification(notification) {
  self.registration.showNotification(notification.title || 'Planik Fitness', {
    body: notification.body || 'Time for your workout! 💪',
    icon: notification.icon || '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: notification.tag || 'general',
    requireInteraction: notification.requireInteraction || false,
    data: notification.data || { url: '/' },
    vibrate: [200, 100, 200],
    silent: notification.silent || false
  });
}

// Handle fetch for offline support
self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip non-http requests
  if (!event.request.url.startsWith('http')) return;
  
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
