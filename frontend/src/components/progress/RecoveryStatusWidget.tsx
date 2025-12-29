'use client';

import { useState } from 'react';
import { Battery, BatteryLow, BatteryMedium, Zap, Clock, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface MuscleData {
    muscle: string;
    volume: number;
    sessions: number;
    sets: number;
    lastTrained?: Date;
}

interface RecoveryStatusWidgetProps {
    muscleData: MuscleData[];
}

export function RecoveryStatusWidget({ muscleData }: RecoveryStatusWidgetProps) {
    const [showInfo, setShowInfo] = useState(false);

    const getRecoveryStatus = (lastTrained?: Date) => {
        if (!lastTrained) return {
            label: 'Totalmente Descansado',
            shortLabel: 'Descansado',
            color: 'text-emerald-400',
            borderColor: 'border-emerald-500/20',
            bgColor: 'bg-emerald-500/10',
            icon: CheckCircle2,
            percentage: 100,
            status: 'recovered'
        };

        const now = new Date();
        const diffHours = (now.getTime() - new Date(lastTrained).getTime()) / (1000 * 60 * 60);

        if (diffHours < 24) return {
            label: 'Fadiga Intensa',
            shortLabel: 'Fadiga',
            color: 'text-red-500',
            borderColor: 'border-red-500/20',
            bgColor: 'bg-red-500/10',
            icon: AlertTriangle,
            percentage: 25,
            status: 'fatigued'
        };
        if (diffHours < 48) return {
            label: 'Em Recuperação',
            shortLabel: 'Recuperando',
            color: 'text-amber-500',
            borderColor: 'border-amber-500/20',
            bgColor: 'bg-amber-500/10',
            icon: Clock,
            percentage: 65,
            status: 'recovering'
        };
        return {
            label: 'Pronto para Treinar',
            shortLabel: 'Pronto',
            color: 'text-blue-400',
            borderColor: 'border-blue-500/20',
            bgColor: 'bg-blue-500/10',
            icon: Zap,
            percentage: 100,
            status: 'ready'
        };
    };

    const getRelativeTime = (date?: Date) => {
        if (!date) return 'Nunca treinado';
        const now = new Date();
        const diffMs = now.getTime() - new Date(date).getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffHours < 1) return 'Treinado agora';
        if (diffHours < 24) return `${diffHours}h atrás`;
        if (diffDays === 1) return 'Ontem';
        if (diffDays < 7) return `${diffDays} dias atrás`;
        return `${Math.floor(diffDays / 7)} sem. atrás`;
    };

    // Sort: Fatigued/Recovering first (so user sees what NOT to train), then Ready.
    // Actually, maybe show Ready first? "What can I train?"
    // Let's sort by "Recency" (Last Trained desc) naturally handles "Fatigued" first usually.
    // User requested "Better understanding".
    // I will Group them.

    const processedData = muscleData.map(m => ({
        ...m,
        status: getRecoveryStatus(m.lastTrained),
        relativeTime: getRelativeTime(m.lastTrained)
    }));

    const fatigued = processedData.filter(m => m.status.status === 'fatigued' || m.status.status === 'recovering');
    const ready = processedData.filter(m => m.status.status === 'ready' || m.status.status === 'recovered');

    return (
        <div className="bg-[#1F2937] p-6 rounded-3xl border border-white/5 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    <BatteryMedium className="text-emerald-400" size={20} />
                    Status de Recuperação
                </h3>
                <button
                    className="text-gray-500 hover:text-white transition-colors"
                    onClick={() => setShowInfo(!showInfo)}
                >
                    <Info size={16} />
                </button>
            </div>

            {/* Info Panel */}
            {showInfo && (
                <div className="mb-6 bg-[#111318] p-4 rounded-xl border border-white/5 text-xs text-gray-400 animate-in fade-in slide-in-from-top-2">
                    <p className="mb-2"><strong className="text-red-400">Fadiga:</strong> Evite treinar (0-24h pós treino).</p>
                    <p className="mb-2"><strong className="text-amber-400">Recuperando:</strong> Pode treinar leve (24-48h).</p>
                    <p><strong className="text-emerald-400">Pronto:</strong> Músculo 100% recuperado.</p>
                </div>
            )}

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">

                {/* Fatigued Section */}
                {fatigued.length > 0 && (
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Clock size={12} /> Em Recuperação
                        </h4>
                        <div className="space-y-2">
                            {fatigued.map((item, i) => (
                                <div key={i} className={`group flex items-center justify-between p-3 rounded-xl border bg-[#111318] ${item.status.borderColor} hover:bg-[#1a1d24] transition-all`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.status.bgColor}`}>
                                            <item.status.icon size={18} className={item.status.color} />
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-sm">{item.muscle}</p>
                                            <p className="text-[10px] text-gray-500">{item.relativeTime}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-xs font-bold ${item.status.color} px-2 py-1 rounded-lg ${item.status.bgColor}`}>
                                            {item.status.shortLabel}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Ready Section */}
                {ready.length > 0 && (
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Zap size={12} /> Prontos para Treinar
                        </h4>
                        <div className="space-y-2">
                            {ready.slice(0, 5).map((item, i) => ( // Limit relevant ready muscles
                                <div key={i} className="group flex items-center justify-between p-3 rounded-xl border border-white/5 bg-[#111318] hover:border-emerald-500/30 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-800 group-hover:bg-emerald-500/10 transition-colors">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        </div>
                                        <div>
                                            <p className="text-gray-200 font-medium text-sm group-hover:text-white">{item.muscle}</p>
                                            <p className="text-[10px] text-gray-600 group-hover:text-gray-500">
                                                {item.lastTrained ? item.relativeTime : 'Nunca treinado'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                                            Go!
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {muscleData.length === 0 && (
                    <div className="text-center py-10 text-gray-500 text-sm">
                        Realize treinos para ver seu status de recuperação.
                    </div>
                )}
            </div>
        </div>
    );
}
