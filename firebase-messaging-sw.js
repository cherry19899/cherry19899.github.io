importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Initialize Firebase in Service Worker
firebase.initializeApp({
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
});

const messaging = firebase.messaging();

// Handle background notifications
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM] Background notification:', payload);

  const notificationTitle = payload.notification?.title || 'PiWork';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/pi-icon.svg',
    badge: '/pi-badge.svg',
    tag: 'piwork-notification',
    data: payload.data,
    requireInteraction: false,
    click_action: payload.data?.click_action || '/',
  };

  // Send notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('push', (event) => {
  console.log('[FCM] Push event received');
});

// Handle notification click for deep linking
self.addEventListener('notificationclick', (event) => {
  console.log('[FCM] Notification clicked:', event.notification.data);

  event.notification.close();

  // Extract deep link from data
  const data = event.notification.data || {};
  const deepLink = data.click_action || data.link || '/';
  
  // Handle different notification types
  let urlToOpen = deepLink;
  if (data.type === 'task' && data.taskId) {
    urlToOpen = `/task/${data.taskId}`;
  } else if (data.type === 'chat' && data.taskId) {
    urlToOpen = `/chat/${data.taskId}`;
  } else if (data.type === 'dispute' && data.taskId) {
    urlToOpen = `/disputes/${data.taskId}`;
  } else if (data.type === 'message' && data.userId) {
    urlToOpen = `/chat/${data.userId}`;
  }

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      // Check if app is already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }

      // Open new window if app is not open
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[FCM] Notification closed');
});
