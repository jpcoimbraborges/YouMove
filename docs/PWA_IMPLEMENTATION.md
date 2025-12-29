# YOUMOVE - PWA Implementation Guide

## Overview

This document describes the PWA implementation for YOUMOVE, including offline capabilities, caching strategies, and known limitations.

## Architecture

```
PWA Components
├── Service Worker (sw.ts)
│   ├── Workbox Precaching
│   ├── Runtime Caching
│   ├── Background Sync
│   └── Push Notifications
│
├── IndexedDB (offline-storage.ts)
│   ├── Workouts Store
│   ├── Exercises Store
│   ├── Sessions Store
│   ├── Workout Logs Store
│   └── Sync Queue Store
│
├── Sync Manager (sync-manager.ts)
│   ├── Queue Processing
│   ├── Retry Logic
│   └── Auto-sync on Reconnect
│
├── Offline Workout (offline-workout.ts)
│   ├── Session Management
│   ├── Set Logging
│   └── Data Caching
│
└── Push Notifications (push-notifications.ts)
    ├── Permission Handling
    ├── Subscription Management
    └── Local Notifications
```

## Caching Strategies

| Resource | Strategy | Cache Duration | Rationale |
|----------|----------|----------------|-----------|
| Static Assets | Precache | Until SW Update | Fast initial load |
| Exercises | CacheFirst | 7 days | Rarely changes |
| Workouts | StaleWhileRevalidate | 24 hours | User's own data |
| API Calls | NetworkFirst | 24 hours | Freshness priority |
| Images | CacheFirst | 30 days | Large, immutable |

## Offline Capabilities

### Fully Supported Offline:
1. **View saved workouts** - Cached in IndexedDB
2. **View exercise library** - Cached in IndexedDB
3. **Execute full workout** - All logging stored locally
4. **Log sets/reps/weight** - Queued for sync
5. **Complete workout session** - Marked for sync
6. **View workout history** - Cached data

### Requires Online:
1. **Login/Authentication** - OAuth requires network
2. **AI Workout Generation** - Requires OpenAI API
3. **Initial data sync** - First load needs connection
4. **Social features** - Real-time updates
5. **Push subscription** - Initial registration

## Sync Queue

Offline actions are stored in a sync queue with:
- **Automatic retry** - Up to 5 attempts
- **Exponential backoff** - 1s delay between retries
- **Background sync** - When browser supports it
- **Manual trigger** - User can force sync
- **Conflict resolution** - Server timestamp wins

### Queue Item Structure:
```typescript
{
  id: number,
  type: 'workout_log' | 'session_update' | 'profile_update',
  action: 'create' | 'update' | 'delete',
  data: {...},
  timestamp: number,
  retries: number
}
```

## Push Notifications (Prepared)

### Notification Types:
1. **Workout Reminders** - Scheduled workouts
2. **Rest Timer Complete** - During workout
3. **Weekly Summary** - Progress reports
4. **Personal Records** - Celebrations
5. **AI Recommendations** - Training insights

### Setup Required:
1. Generate VAPID keys
2. Add `NEXT_PUBLIC_VAPID_PUBLIC_KEY` to env
3. Implement backend subscription storage
4. Create notification sending endpoints

## Known Limitations

### 1. Service Worker in Development
- PWA is disabled in development mode
- Test in production build: `npm run build && npm start`

### 2. iOS Limitations
- Background Sync not supported
- Push notifications require Home Screen install
- Wake locks limited
- No vibration in notifications

### 3. Storage Quotas
- IndexedDB: ~50MB guaranteed, up to 20% of disk
- Cache Storage: Varies by browser
- Monitor with `navigator.storage.estimate()`

### 4. Sync Conflicts
- If same data modified online and offline
- Server version takes precedence
- Local changes may be overwritten

### 5. First Visit
- Requires network for initial data load
- Service worker installs on second visit
- Full offline available after first sync

### 6. Authentication Tokens
- Supabase tokens cached in localStorage
- May expire while offline
- Re-auth required on reconnect

### 7. Real-time Features
- No live updates while offline
- Data stale until sync
- No collaborative features offline

## Testing Offline

### Chrome DevTools:
1. Open DevTools → Application → Service Workers
2. Check "Offline" checkbox
3. Test app functionality

### Mobile Testing:
1. Install PWA to home screen
2. Enable airplane mode
3. Test workout execution

## Files Reference

| File | Purpose |
|------|---------|
| `public/manifest.json` | PWA manifest |
| `next.config.ts` | PWA plugin config |
| `src/sw.ts` | Service Worker |
| `src/lib/offline-storage.ts` | IndexedDB wrapper |
| `src/lib/sync-manager.ts` | Sync orchestration |
| `src/lib/offline-workout.ts` | Workout offline logic |
| `src/lib/push-notifications.ts` | Push handling |
| `src/components/ui/SyncIndicator.tsx` | Sync UI |

## Deployment Checklist

- [ ] HTTPS enabled (required for SW)
- [ ] manifest.json accessible
- [ ] Icons in all required sizes
- [ ] VAPID keys generated (for push)
- [ ] Service worker registered
- [ ] IndexedDB tested
- [ ] Offline flow tested
- [ ] Sync tested across reconnection
