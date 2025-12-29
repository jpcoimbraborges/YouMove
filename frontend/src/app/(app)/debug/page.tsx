'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { syncWorkoutSessions, getSyncStatus } from '@/lib/workout-sync';
import { getPendingSync } from '@/lib/workout-session';

export default function DebugPage() {
    const { user } = useAuth();
    const [logs, setLogs] = useState<string[]>([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [dbStatus, setDbStatus] = useState<'unknown' | 'ok' | 'error'>('unknown');

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
    };

    const checkPending = () => {
        const pending = getPendingSync();
        setPendingCount(pending.length);
        addLog(`Pending items in Local Storage: ${pending.length}`);
        if (pending.length > 0) {
            addLog(`First pending ID: ${pending[0].session_id}`);
            addLog(`First pending attempts: ${pending[0].attempts}`);
        }
    };

    const runPermissionsTest = async () => {
        if (!user) {
            addLog('❌ No user logged in');
            return;
        }

        addLog('🔄 Testing Workout Sessions Insert...');
        const dummyId = crypto.randomUUID();

        try {
            // 1. Try to Insert
            const { error: insertError } = await supabase
                .from('workout_sessions')
                .insert({
                    id: dummyId,
                    user_id: user.id,
                    workout_name: '__DEBUG_TEST__',
                    started_at: new Date().toISOString(),
                    completed_at: new Date().toISOString(),
                    duration_seconds: 60,
                    total_sets: 1,
                    total_reps: 10,
                    total_volume: 100
                });

            if (insertError) {
                addLog(`❌ Insert Failed: ${insertError.message} (${insertError.code})`);
                setDbStatus('error');
            } else {
                addLog('✅ Insert Successful');

                // 2. Try to Delete (Cleanup)
                const { error: deleteError } = await supabase
                    .from('workout_sessions')
                    .delete()
                    .eq('id', dummyId);

                if (deleteError) {
                    addLog(`⚠️ Cleanup Delete Failed: ${deleteError.message}`);
                } else {
                    addLog('✅ Cleanup Successful');
                }
                setDbStatus('ok');
            }

        } catch (e: any) {
            addLog(`❌ Exception: ${e.message}`);
        }
    };

    const forceSync = async () => {
        addLog('🔄 Force Sync Initiated...');
        try {
            const result = await syncWorkoutSessions();
            addLog(`🏁 Sync Result: Success=${result.success}, Synced=${result.synced}, Failed=${result.failed}`);
            if (result.errors.length > 0) {
                result.errors.forEach(e => addLog(`❌ Sync Error [${e.session_id}]: ${e.error}`));
            }
        } catch (e: any) {
            addLog(`❌ Sync Exception: ${e.message}`);
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0E14] text-white p-8 pb-24">
            <h1 className="text-2xl font-bold mb-6 text-blue-500">System Debugger</h1>

            <div className="grid gap-6">
                {/* Auth Status */}
                <div className="bg-[#1F2937] p-4 rounded-xl border border-white/10">
                    <h2 className="font-bold mb-2">Authentication</h2>
                    <p>User ID: <span className="font-mono text-xs bg-black/30 px-2 py-1 rounded">{user?.id || 'Not logged in'}</span></p>
                    <p className="text-sm text-gray-400 mt-1">Email: {user?.email}</p>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap gap-2">
                    <button onClick={checkPending} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-medium">
                        Check Pending ({pendingCount})
                    </button>
                    <button onClick={runPermissionsTest} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg font-medium">
                        Test DB Permissions
                    </button>
                    <button onClick={forceSync} className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg font-medium">
                        Force Retry Sync
                    </button>
                    <button onClick={() => setLogs([])} className="bg-red-900/50 hover:bg-red-900 px-4 py-2 rounded-lg font-medium border border-red-500/30">
                        Clear Logs
                    </button>
                </div>

                {/* Console */}
                <div className="bg-black/50 p-4 rounded-xl border border-white/10 h-96 overflow-y-auto font-mono text-xs">
                    {logs.length === 0 && <span className="text-gray-500">Ready. Click buttons above to test.</span>}
                    {logs.map((log, i) => (
                        <div key={i} className={`mb-1 ${log.includes('❌') ? 'text-red-400' : log.includes('✅') ? 'text-green-400' : 'text-gray-300'}`}>
                            {log}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
