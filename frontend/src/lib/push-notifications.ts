/**
 * YOUMOVE - Push Notification Manager
 * Handles push notification subscription and permissions
 */

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

// ============================================
// PERMISSION STATUS
// ============================================

export type NotificationPermission = 'default' | 'granted' | 'denied';

export function getNotificationPermission(): NotificationPermission {
    if (!('Notification' in window)) {
        return 'denied';
    }
    return Notification.permission;
}

export function isNotificationsSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

// ============================================
// REQUEST PERMISSION
// ============================================

export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!isNotificationsSupported()) {
        console.warn('[Push] Notifications not supported');
        return 'denied';
    }

    const permission = await Notification.requestPermission();
    console.log('[Push] Permission:', permission);
    return permission;
}

// ============================================
// SUBSCRIBE TO PUSH
// ============================================

export async function subscribeToPush(): Promise<PushSubscription | null> {
    if (!isNotificationsSupported()) {
        console.warn('[Push] Push not supported');
        return null;
    }

    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
        console.warn('[Push] Permission not granted');
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.ready;

        // Check for existing subscription
        let subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            console.log('[Push] Existing subscription found');
            return subscription;
        }

        // Create new subscription
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        console.log('[Push] New subscription created');

        // TODO: Send subscription to backend
        // await sendSubscriptionToServer(subscription);

        return subscription;

    } catch (error) {
        console.error('[Push] Subscription failed:', error);
        return null;
    }
}

// ============================================
// UNSUBSCRIBE
// ============================================

export async function unsubscribeFromPush(): Promise<boolean> {
    if (!isNotificationsSupported()) {
        return false;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            await subscription.unsubscribe();
            console.log('[Push] Unsubscribed');

            // TODO: Remove subscription from backend
            // await removeSubscriptionFromServer(subscription);

            return true;
        }

        return false;

    } catch (error) {
        console.error('[Push] Unsubscribe failed:', error);
        return false;
    }
}

// ============================================
// GET SUBSCRIPTION
// ============================================

export async function getSubscription(): Promise<PushSubscription | null> {
    if (!isNotificationsSupported()) {
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        return await registration.pushManager.getSubscription();
    } catch {
        return null;
    }
}

// ============================================
// LOCAL NOTIFICATIONS
// ============================================

export function showLocalNotification(
    title: string,
    options?: NotificationOptions
): void {
    if (getNotificationPermission() !== 'granted') {
        console.warn('[Push] No permission for notifications');
        return;
    }

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(title, {
                icon: '/icons/icon-192x192.png',
                badge: '/icons/badge-72x72.png',
                ...options,
            } as NotificationOptions);
        });
    }
}

// Workout reminder notification
export function scheduleWorkoutReminder(workoutName: string, time: Date): void {
    const now = new Date();
    const delay = time.getTime() - now.getTime();

    if (delay <= 0) return;

    setTimeout(() => {
        showLocalNotification('Hora do treino! 💪', {
            body: `${workoutName} está te esperando`,
            tag: 'workout-reminder',
            data: { url: '/workout' },
        });
    }, delay);
}

// ============================================
// HELPER
// ============================================

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray as Uint8Array<ArrayBuffer>;
}
