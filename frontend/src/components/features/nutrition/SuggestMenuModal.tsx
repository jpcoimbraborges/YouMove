import { useState, useEffect } from 'react';
import {
    X, Brain, Loader2, RefreshCw, CheckCircle2, Sparkles,
    Flame, Scale, Dumbbell, CalendarRange, ShoppingCart,
    Download, ArrowRight, ChevronRight, Calendar
} from 'lucide-react';

interface SuggestMenuModalProps {
    onClose: () => void;
    onApplyMenu: (menu: any) => void;
    userProfile?: any;
}

export function SuggestMenuModal({ onClose, onApplyMenu, userProfile }: SuggestMenuModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [suggestion, setSuggestion] = useState<any | null>(null);
    const [goalType, setGoalType] = useState('balanced');

    // Auto-detect goal from profile
    useEffect(() => {
        if (userProfile?.fitness_goal) {
            const goal = userProfile.fitness_goal.toLowerCase();
            if (goal.includes('perder') || goal.includes('weight') || goal.includes('fat') || goal.includes('gordura')) {
                setGoalType('cutting');
            } else if (goal.includes('ganhar') || goal.includes('muscle') || goal.includes('massa')) {
                setGoalType('bulking');
            } else {
                setGoalType('balanced');
            }
        }
    }, [userProfile]);
    const [duration, setDuration] = useState('today'); // today, tomorrow, weekly
    const [activeDayIndex, setActiveDayIndex] = useState(0);
    const [viewMode, setViewMode] = useState<'meals' | 'shopping'>('meals');

    const handleGenerate = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/nutrition/suggest-menu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ goalType, duration, userProfile })
            });

            if (!response.ok) throw new Error('Failed to generate');

            const data = await response.json();
            setSuggestion(data);
            setActiveDayIndex(0);
            setViewMode('meals');
        } catch (error) {
            console.error('Error generating menu:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (!suggestion) return;

        let content = `🥑 YOUMOVE - PLANO NUTRICIONAL\n`;
        content += `${suggestion.title || 'Sugestão Inteligente'}\n`;
        content += `===================================\n\n`;

        content += `🛒 LISTA DE COMPRAS SUGERIDA:\n`;
        suggestion.shoppingList?.forEach((item: string) => {
            content += `[ ] ${item}\n`;
        });
        content += `\n===================================\n\n`;

        suggestion.days?.forEach((day: any) => {
            content += `📅 ${day.day}\n`;
            day.meals.forEach((meal: any) => {
                content += `  • ${meal.name} (${meal.calories} kcal)\n`;
                content += `    ${meal.items.join(', ')}\n`;
                content += `    P: ${meal.protein}g | C: ${meal.carbs}g | G: ${meal.fats}g\n\n`;
            });
            content += `-----------------------------------\n\n`;
        });

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `plano_nutricional_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-[600px] max-h-[90vh] flex flex-col bg-[#09090b] border border-[#1f1f23] rounded-3xl shadow-2xl relative overflow-hidden">
                {/* Background Glow Effect */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-24 bg-blue-600/10 blur-[60px] pointer-events-none" />

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all z-10"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="flex-shrink-0 p-6 pb-2 relative z-10">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-[#0e121b] border border-blue-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                            <Brain size={24} className="text-blue-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                {suggestion ? (suggestion.title || 'Plano Gerado') : 'Sugerir Cardápio'}
                                {!suggestion && <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold uppercase tracking-wider">AI Beta</span>}
                            </h3>
                            <p className="text-sm text-gray-400">
                                {suggestion ? 'Visualize, edite ou exporte seu plano' : 'Nutrição inteligente baseada na sua meta'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 pt-0 custom-scrollbar relative z-10">
                    {suggestion?.tdee_info && (
                        <div className="mb-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex gap-3 text-xs text-blue-200">
                            <Sparkles size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                            <div>{suggestion.tdee_info}</div>
                        </div>
                    )}

                    {!suggestion ? (
                        <div className="space-y-8 mt-4">
                            {/* 1. Auto-detected Goal Info */}
                            <div className="bg-[#121214] p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${goalType === 'cutting' ? 'bg-orange-500/10 text-orange-500' :
                                    goalType === 'bulking' ? 'bg-purple-500/10 text-purple-500' :
                                        'bg-cyan-500/10 text-cyan-400'
                                    }`}>
                                    {goalType === 'cutting' ? <Flame size={24} /> :
                                        goalType === 'bulking' ? <Dumbbell size={24} /> :
                                            <Scale size={24} />}
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-sm">Objetivo: {
                                        goalType === 'cutting' ? 'Perda de Peso' :
                                            goalType === 'bulking' ? 'Ganho de Massa' :
                                                'Equilibrado'
                                    }</h4>
                                    <p className="text-xs text-gray-500">Definido no seu perfil</p>
                                </div>
                            </div>

                            {/* 2. Duration Selection */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">2. Período do planejamento</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'today', label: 'Hoje', sub: 'Imediato' },
                                        { id: 'tomorrow', label: 'Amanhã', sub: 'Planejar' },
                                        { id: 'weekly', label: 'Semanal', sub: '7 Dias' }
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setDuration(opt.id)}
                                            className={`p-3 rounded-xl border text-left transition-all ${duration === opt.id
                                                ? 'bg-blue-500/10 border-blue-500 text-white'
                                                : 'bg-[#121214] border-white/5 text-gray-400 hover:bg-[#18181b] hover:text-gray-300'
                                                }`}
                                        >
                                            <div className="font-bold text-sm">{opt.label}</div>
                                            <div className="text-[10px] opacity-60 font-mono uppercase">{opt.sub}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Main Action Button */}
                            <button
                                onClick={handleGenerate}
                                disabled={isLoading}
                                className="w-full py-4 rounded-2xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden mt-4"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[200%] rotate-45 group-hover:translate-x-[200%] transition-transform duration-1000" />
                                {isLoading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        <span className="text-sm">Criando Estratégia...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={20} className="text-blue-100" />
                                        <span>Gerar Plano Completo</span>
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">

                            {/* View Mode Switcher */}
                            <div className="flex bg-[#121214] p-1 rounded-xl border border-white/5">
                                <button
                                    onClick={() => setViewMode('meals')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'meals'
                                        ? 'bg-[#1c1c1f] text-white shadow-sm border border-white/10'
                                        : 'text-gray-500 hover:text-gray-300'
                                        }`}
                                >
                                    <Calendar size={16} />
                                    Refeições
                                </button>
                                <button
                                    onClick={() => setViewMode('shopping')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'shopping'
                                        ? 'bg-[#1c1c1f] text-white shadow-sm border border-white/10'
                                        : 'text-gray-500 hover:text-gray-300'
                                        }`}
                                >
                                    <ShoppingCart size={16} />
                                    Lista de Compras
                                </button>
                            </div>

                            {/* Days Tabs (Only if > 1 day) */}
                            {suggestion.days && suggestion.days.length > 1 && viewMode === 'meals' && (
                                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                    {suggestion.days.map((day: any, idx: number) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveDayIndex(idx)}
                                            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${activeDayIndex === idx
                                                ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20'
                                                : 'bg-[#121214] text-gray-500 border-white/5 hover:bg-[#18181b]'
                                                }`}
                                        >
                                            {day.day}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Content Area */}
                            <div className="min-h-[300px]">
                                {viewMode === 'meals' ? (
                                    <div className="space-y-3">
                                        {/* Day Header */}
                                        <div className="flex items-center justify-between px-1 mb-2">
                                            <h4 className="text-white font-bold flex items-center gap-2">
                                                <CalendarRange size={16} className="text-blue-500" />
                                                {suggestion.days?.[activeDayIndex]?.day || 'Hoje'}
                                            </h4>
                                            <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">
                                                {suggestion.days?.[activeDayIndex]?.meals?.length} refeições
                                            </span>
                                        </div>

                                        {suggestion.days?.[activeDayIndex]?.meals?.map((meal: any, idx: number) => (
                                            <div key={idx} className="p-4 rounded-xl bg-[#121214] border border-white/5 hover:border-blue-500/20 transition-colors group">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                                                        {meal.name}
                                                    </h4>
                                                    <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                                                        {meal.calories} kcal
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400 leading-relaxed mb-2">
                                                    {meal.items.join(', ')}
                                                </p>
                                                <div className="flex gap-2 text-[10px] text-gray-600 font-mono">
                                                    <span>P: {meal.protein}g</span>
                                                    <span>C: {meal.carbs}g</span>
                                                    <span>G: {meal.fats}g</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-sm font-bold text-white">Ingredientes Sugeridos</h4>
                                            <span className="text-xs text-gray-500">{suggestion.shoppingList?.length || 0} itens</span>
                                        </div>
                                        <div className="bg-[#121214] rounded-xl border border-white/5 overflow-hidden">
                                            {suggestion.shoppingList?.map((item: string, idx: number) => (
                                                <div key={idx} className="px-4 py-3 border-b border-white/5 last:border-0 flex items-center gap-3">
                                                    <div className="w-4 h-4 rounded border border-gray-600" />
                                                    <span className="text-sm text-gray-300">{item}</span>
                                                </div>
                                            ))}
                                            {!suggestion.shoppingList?.length && (
                                                <div className="p-8 text-center text-gray-500 text-sm">
                                                    Nenhuma lista gerada.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions (Only if suggestion exists) */}
                {suggestion && (
                    <div className="flex-shrink-0 p-6 pt-4 border-t border-white/5 bg-[#09090b] relative z-20 flex gap-3">
                        <button
                            onClick={() => setSuggestion(null)}
                            className="p-3.5 rounded-xl bg-[#121214] border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition-all"
                            title="Refazer"
                        >
                            <RefreshCw size={20} />
                        </button>

                        <button
                            onClick={handleDownload}
                            className="flex-1 py-3.5 rounded-xl bg-[#121214] border border-white/10 hover:bg-white/5 text-gray-300 font-bold text-sm flex items-center justify-center gap-2 transition-all"
                        >
                            <Download size={18} />
                            Salvar Arquivo
                        </button>

                        <button
                            onClick={() => {
                                // Aplica apenas o dia ativo visualizado para não quebrar o layout
                                const dayPlan = suggestion.days?.[activeDayIndex];
                                if (dayPlan) {
                                    onApplyMenu(dayPlan);
                                    onClose();
                                }
                            }}
                            className="flex-[2] py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                        >
                            <CheckCircle2 size={18} />
                            Aplicar Dia Atual
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
