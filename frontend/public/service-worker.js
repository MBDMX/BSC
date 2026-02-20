// Service Worker for Burger Social Club
// Enables background notifications even when the tab is not active

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : { title: "Alerte Stock", body: "Un ingrédient est bas." };

    const options = {
        body: data.body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'stock-alert',
        renotify: true,
        data: {
            url: self.location.origin + '/matieres-premieres'
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});

// Since we are not using a full Web Push server yet, 
// we also listen for messages from the main thread 
// to trigger notifications when the app is in the background.
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const { title, body } = event.data;
        self.registration.showNotification(title, {
            body: body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'stock-alert',
            renotify: true
        });
    }
});
