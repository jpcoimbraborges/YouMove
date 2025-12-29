'use client';

/**
 * DEBUG PAGE - Verificar dados no Supabase
 * Acesse: /debug para ver os dados brutos do banco
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DebugPage() {
    const [userId, setUserId] = useState<string | null>(null);
    const [sessions, setSessions] = useState<any[]>([]);
    const [columns, setColumns] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            // Get user directly from Supabase session
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setError('Usuário não autenticado. Por favor, faça login.');
                setLoading(false);
                return;
            }

            setUserId(user.id);

            try {
                // Buscar todas as sessões
                const { data, error: fetchError } = await supabase
                    .from('workout_sessions')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (fetchError) {
                    setError(fetchError.message);
                    return;
                }

                if (data && data.length > 0) {
                    setColumns(Object.keys(data[0]));
                    setSessions(data);
                } else {
                    setError('Nenhuma sessão encontrada');
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0B0E14] p-8 text-white">
                <p>Carregando dados do banco...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B0E14] p-8 text-white overflow-x-auto">
            <h1 className="text-2xl font-bold mb-6">🔍 Debug - Dados do Banco</h1>

            {error && (
                <div className="bg-red-500/20 border border-red-500 p-4 rounded-lg mb-6">
                    <p className="text-red-400">{error}</p>
                </div>
            )}

            <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Colunas na tabela workout_sessions:</h2>
                <div className="flex flex-wrap gap-2">
                    {columns.map(col => (
                        <span key={col} className="px-2 py-1 bg-blue-500/20 rounded text-xs text-blue-400">
                            {col}
                        </span>
                    ))}
                </div>
            </div>

            <h2 className="text-lg font-semibold mb-4">Últimas 10 sessões (dados brutos):</h2>

            {sessions.map((session, idx) => (
                <div key={session.id} className="bg-[#1F2937] rounded-lg p-4 mb-4 border border-white/10">
                    <h3 className="font-bold text-blue-400 mb-3">
                        Sessão {idx + 1}: {session.name || session.workout_name || 'Sem nome'}
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                            <span className="text-gray-500">ID:</span>
                            <p className="text-white truncate">{session.id}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Status:</span>
                            <p className="text-white">{session.status || 'N/A'}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Duração (segundos):</span>
                            <p className={session.duration_seconds > 0 ? 'text-green-400' : 'text-red-400'}>
                                {session.duration_seconds ?? 'NULL'}
                            </p>
                        </div>
                        <div>
                            <span className="text-gray-500">Volume (total_volume):</span>
                            <p className={session.total_volume > 0 ? 'text-green-400' : 'text-red-400'}>
                                {session.total_volume ?? 'NULL'}
                            </p>
                        </div>
                        <div>
                            <span className="text-gray-500">Sets (total_sets):</span>
                            <p className={session.total_sets > 0 ? 'text-green-400' : 'text-red-400'}>
                                {session.total_sets ?? 'NULL'}
                            </p>
                        </div>
                        <div>
                            <span className="text-gray-500">Reps (total_reps):</span>
                            <p className={session.total_reps > 0 ? 'text-green-400' : 'text-red-400'}>
                                {session.total_reps ?? 'NULL'}
                            </p>
                        </div>
                        <div>
                            <span className="text-gray-500">Iniciado:</span>
                            <p className="text-white text-xs">{session.started_at || 'NULL'}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Concluído:</span>
                            <p className="text-white text-xs">{session.completed_at || 'NULL'}</p>
                        </div>
                    </div>
                </div>
            ))}

            <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <h3 className="font-bold text-yellow-400 mb-2">📌 Diagnóstico:</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Se campos estão <span className="text-red-400">vermelhos</span> (0 ou NULL): dados não foram salvos corretamente</li>
                    <li>• Se campos estão <span className="text-green-400">verdes</span> (&gt;0): dados foram salvos corretamente</li>
                    <li>• Treinos ANTIGOS terão dados zerados (é esperado)</li>
                    <li>• Faça um NOVO treino após o deploy para testar</li>
                </ul>
            </div>

            {/* Reset Data Section */}
            <ResetDataSection userId={userId || undefined} onReset={() => window.location.reload()} />
        </div>
    );
}

function ResetDataSection({ userId, onReset }: { userId?: string, onReset: () => void }) {
    const [isConfirming, setIsConfirming] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleDelete = async () => {
        if (!userId) return;

        setIsDeleting(true);
        setResult(null);

        try {
            // Use API route to bypass RLS
            const response = await fetch('/api/reset-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete data');
            }

            // Clear local storage
            if (typeof window !== 'undefined') {
                localStorage.removeItem('youmove_active_session');
                localStorage.removeItem('youmove_session_backup');
                localStorage.removeItem('youmove_pending_sync');
                localStorage.removeItem('youmove_session_events');
            }

            setResult({
                success: true,
                message: `✅ Dados deletados com sucesso! ${data.deleted?.sessions || 0} sessões removidas.`
            });

            // Reload after 2 seconds
            setTimeout(() => {
                onReset();
            }, 2000);

        } catch (err: any) {
            setResult({
                success: false,
                message: `❌ Erro: ${err.message}`
            });
        } finally {
            setIsDeleting(false);
            setIsConfirming(false);
        }
    };

    return (
        <div className="mt-8 p-6 bg-red-500/10 border border-red-500/30 rounded-lg">
            <h3 className="font-bold text-red-400 mb-4 flex items-center gap-2">
                ⚠️ Zona de Perigo - Reset de Dados
            </h3>

            {result && (
                <div className={`mb-4 p-3 rounded-lg ${result.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {result.message}
                </div>
            )}

            {!isConfirming ? (
                <div>
                    <p className="text-sm text-gray-400 mb-4">
                        Isso irá deletar <strong>TODAS</strong> as suas sessões de treino do banco de dados
                        e limpar o armazenamento local. Use apenas para fins de teste.
                    </p>
                    <button
                        onClick={() => setIsConfirming(true)}
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg border border-red-500/50 transition-all"
                    >
                        🗑️ Zerar Todos os Meus Dados
                    </button>
                </div>
            ) : (
                <div>
                    <p className="text-sm text-red-300 mb-4 font-semibold">
                        ⚠️ TEM CERTEZA? Esta ação é IRREVERSÍVEL!
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all disabled:opacity-50"
                        >
                            {isDeleting ? '⏳ Deletando...' : '✓ Sim, Deletar Tudo'}
                        </button>
                        <button
                            onClick={() => setIsConfirming(false)}
                            disabled={isDeleting}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all"
                        >
                            ✕ Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
