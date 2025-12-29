/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, Route } from 'workbox-routing';
import {
    NetworkFirst,
    CacheFirst,
    StaleWhileRevalidate
} from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

declare const self: ServiceWorkerGlobalScope;

// ============================================
// PRECACHE STATIC ASSETS
// ============================================
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// ============================================
// CACHE NAMES
// ============================================
const CACHE_NAMES = {
    STATIC: 'youmove-static-v1',
    DYNAMIC: 'youmove-dynamic-v1',
    API: 'youmove-api-v1',
    IMAGES: 'youmove-images-v1',
    WORKOUTS: 'youmove-workouts-v1',
    EXERCISES: 'youmove-exercises-v1',
};

// ============================================
// API ROUTES - NETWORK FIRST
// ============================================

// Supabase API calls - NetworkFirst with fallback
registerRoute(
    ({ url }) => url.hostname.includes('supabase.co'),
    new NetworkFirst({
        cacheName: CACHE_NAMES.API,
        networkTimeoutSeconds: 10,
        plugins: [
            new CacheableResponsePlugin({
                statuses: [0, 200],
            }),
            new ExpirationPlugin({
                maxEntries: 100,
                maxAgeSeconds: 24 * 60 * 60, // 24 hours
            }),
        ],
    })
);

// ============================================
// EXERCISES - CACHE FIRST (rarely changes)
// ============================================
registerRoute(
    ({ url, request }) =>
        url.pathname.includes('/exercises') ||
        url.pathname.includes('/rest/v1/exercises'),
    new CacheFirst({
        cacheName: CACHE_NAMES.EXERCISES,
        plugins: [
            new CacheableResponsePlugin({
                statuses: [0, 200],
            }),
            new ExpirationPlugin({
                maxEntries: 200,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
            }),
        ],
    })
);

// ============================================
// WORKOUTS - STALE WHILE REVALIDATE
// ============================================
registerRoute(
    ({ url, request }) =>
        url.pathname.includes('/workouts') ||
        url.pathname.includes('/rest/v1/workouts'),
    new StaleWhileRevalidate({
        cacheName: CACHE_NAMES.WORKOUTS,
        plugins: [
            new CacheableResponsePlugin({
                statuses: [0, 200],
            }),
            new ExpirationPlugin({
                maxEntries: 50,
                maxAgeSeconds: 24 * 60 * 60, // 24 hours
            }),
        ],
    })
);

// ============================================
// IMAGES - CACHE FIRST
// ============================================
registerRoute(
    ({ request }) => request.destination === 'image',
    new CacheFirst({
        cacheName: CACHE_NAMES.IMAGES,
        plugins: [
            new CacheableResponsePlugin({
                statuses: [0, 200],
            }),
            new ExpirationPlugin({
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
            }),
        ],
    })
);

// ============================================
// BACKGROUND SYNC - OFFLINE QUEUE
// ============================================

// Background sync for workout logs
const workoutSyncPlugin = new BackgroundSyncPlugin('workout-sync-queue', {
    maxRetentionTime: 24 * 60, // Retry for 24 hours
    onSync: async ({ queue }) => {
        console.log('[SW] Syncing workout queue...');
        let entry;
        while ((entry = await queue.shiftRequest())) {
            try {
                await fetch(entry.request);
                console.log('[SW] Synced:', entry.request.url);
            } catch (error) {
                console.error('[SW] Sync failed:', error);
                await queue.unshiftRequest(entry);
                throw error;
            }
        }
        // Notify clients that sync is complete
        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                client.postMessage({
                    type: 'SYNC_COMPLETE',
                    timestamp: Date.now(),
                });
            });
        });
    },
});

// Register route for workout log submissions
registerRoute(
    ({ url, request }) =>
        request.method === 'POST' &&
        (url.pathname.includes('/workout_logs') ||
            url.pathname.includes('/workout_sessions')),
    new NetworkFirst({
        cacheName: CACHE_NAMES.API,
        plugins: [workoutSyncPlugin],
    }),
    'POST'
);

// ============================================
// PUSH NOTIFICATIONS
// ============================================

self.addEventListener('push', (event) => {
    console.log('[SW] Push received:', event);

    if (!event.data) return;

    const data = event.data.json();

    // Using extended notification options for ServiceWorker
    const options = {
        body: data.body || 'Nova atualização disponível',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        data: {
            url: data.url || '/',
            dateOfArrival: Date.now(),
        },
        tag: data.tag || 'default',
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'YOUMOVE', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event);

    event.notification.close();

    if (event.action === 'close') return;

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(clients => {
                // Check if already open
                for (const client of clients) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Open new window
                return self.clients.openWindow(urlToOpen);
            })
    );
});

// ============================================
// INSTALL & ACTIVATE
// ============================================

self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(
        Promise.all([
            // Claim all clients
            self.clients.claim(),
            // Clean old caches
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => !Object.values(CACHE_NAMES).includes(name))
                        .map(name => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            }),
        ])
    );
});

// ============================================
// MESSAGE HANDLER
// ============================================

self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);

    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data?.type === 'CLEAR_CACHE') {
        caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
        });
    }

    if (event.data?.type === 'GET_CACHE_STATS') {
        getCacheStats().then(stats => {
            event.ports[0].postMessage(stats);
        });
    }
});

async function getCacheStats() {
    const stats: Record<string, number> = {};
    const cacheNames = await caches.keys();

    for (const name of cacheNames) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        stats[name] = keys.length;
    }

    return stats;
}

export { };
