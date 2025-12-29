'use client';

import { useEffect, useState } from 'react';
import {
    getSyncStatus,
    onSyncStatusChange,
    syncOfflineData,
    type SyncStatus
} from '@/lib/sync-manager';
import { getOfflineDataStatus } from '@/lib/offline-workout';
import { Cloud, CloudOff, RefreshCw, Check, AlertTriangle } from 'lucide-react';

interface OfflineStatus {
    exercises: number;
    workouts: number;
    pendingLogs: number;
    pendingSync: number;
}

export function SyncIndicator() {
    const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
    const [offlineStatus, setOfflineStatus] = useState<OfflineStatus | null>(null);
    const [isOnline, setIsOnline] = useState(true);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        // Listen for sync status changes
        const unsubscribe = onSyncStatusChange(setSyncStatus);

        // Listen for online/offline
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        setIsOnline(navigator.onLine);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Get initial offline status
        getOfflineDataStatus().then(setOfflineStatus);

        return () => {
            unsubscribe();
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleSync = async () => {
        await syncOfflineData();
        const status = await getOfflineDataStatus();
        setOfflineStatus(status);
    };

    const getStatusIcon = () => {
        if (!isOnline) {
            return <CloudOff size={18} className="text-warning" />;
        }

        switch (syncStatus) {
            case 'syncing':
                return <RefreshCw size={18} className="text-primary animate-spin" />;
            case 'complete':
                return <Check size={18} className="text-success" />;
            case 'error':
                return <AlertTriangle size={18} className="text-error" />;
            default:
                return <Cloud size={18} className="text-muted" />;
        }
    };

    const hasPendingData = offlineStatus && (offlineStatus.pendingLogs > 0 || offlineStatus.pendingSync > 0);

    return (
        <div className="relative">
            <button
                onClick={() => setShowDetails(!showDetails)}
                className="p-2 rounded-full hover:bg-surface transition-colors relative"
            >
                {getStatusIcon()}
                {hasPendingData && (
                    <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-warning" />
                )}
            </button>

            {showDetails && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowDetails(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-64 bg-surface border border-border rounded-lg shadow-lg z-50 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">Status de Sincronização</h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${isOnline ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                                }`}>
                                {isOnline ? 'Online' : 'Offline'}
                            </span>
                        </div>

                        {offlineStatus && (
                            <div className="space-y-2 text-sm mb-4">
                                <div className="flex justify-between">
                                    <span className="text-secondary">Exercícios em cache</span>
                                    <span>{offlineStatus.exercises}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-secondary">Treinos em cache</span>
                                    <span>{offlineStatus.workouts}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-secondary">Logs pendentes</span>
                                    <span className={offlineStatus.pendingLogs > 0 ? 'text-warning' : ''}>
                                        {offlineStatus.pendingLogs}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-secondary">Fila de sync</span>
                                    <span className={offlineStatus.pendingSync > 0 ? 'text-warning' : ''}>
                                        {offlineStatus.pendingSync}
                                    </span>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleSync}
                            disabled={!isOnline || syncStatus === 'syncing'}
                            className="w-full py-2 px-3 bg-primary text-white rounded-lg font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {syncStatus === 'syncing' ? (
                                <>
                                    <RefreshCw size={16} className="animate-spin" />
                                    Sincronizando...
                                </>
                            ) : (
                                <>
                                    <RefreshCw size={16} />
                                    Sincronizar Agora
                                </>
                            )}
                        </button>

                        {syncStatus === 'error' && (
                            <p className="text-error text-xs mt-2 text-center">
                                Erro na sincronização. Tente novamente.
                            </p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
