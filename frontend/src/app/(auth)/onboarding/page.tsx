'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    ChevronLeft,
    ChevronRight,
    Target,
    Dumbbell,
    Clock,
    AlertTriangle,
    Check
} from 'lucide-react';

const STEPS = [
    { id: 'goal', title: 'Qual seu objetivo?' },
    { id: 'level', title: 'Qual seu nível de experiência?' },
    { id: 'body', title: 'Dados físicos' },
    { id: 'preferences', title: 'Preferências de treino' },
    { id: 'equipment', title: 'Equipamentos disponíveis' },
];

const GOALS = [
    { id: 'lose_weight', label: 'Perder peso', icon: '🔥' },
    { id: 'build_muscle', label: 'Ganhar massa', icon: '💪' },
    { id: 'improve_endurance', label: 'Resistência', icon: '🏃' },
    { id: 'increase_strength', label: 'Força', icon: '🏋️' },
    { id: 'general_fitness', label: 'Saúde geral', icon: '❤️' },
    { id: 'flexibility', label: 'Flexibilidade', icon: '🧘' },
];

const LEVELS = [
    { id: 'beginner', label: 'Iniciante', desc: 'Novo em treinos ou menos de 6 meses' },
    { id: 'intermediate', label: 'Intermediário', desc: '6 meses a 2 anos de experiência' },
    { id: 'advanced', label: 'Avançado', desc: 'Mais de 2 anos treinando consistentemente' },
    { id: 'elite', label: 'Elite', desc: 'Atleta ou competidor' },
];

const EQUIPMENT = [
    { id: 'none', label: 'Nenhum (corpo livre)' },
    { id: 'dumbbells', label: 'Halteres' },
    { id: 'barbell', label: 'Barra e anilhas' },
    { id: 'machines', label: 'Máquinas de academia' },
    { id: 'cables', label: 'Cabos/Polias' },
    { id: 'bands', label: 'Elásticos' },
    { id: 'kettlebell', label: 'Kettlebell' },
    { id: 'pull_bar', label: 'Barra fixa' },
];

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        goal: '',
        level: '',
        height: '',
        weight: '',
        birth_date: '',
        gender: '',
        duration: 45,
        days: [1, 3, 5],
        equipment: [] as string[],
        injuries: '',
    });

    const currentStep = STEPS[step];
    const progress = ((step + 1) / STEPS.length) * 100;

    const handleNext = () => {
        if (step < STEPS.length - 1) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 0) {
            setStep(step - 1);
        }
    };

    const toggleEquipment = (id: string) => {
        setFormData(prev => ({
            ...prev,
            equipment: prev.equipment.includes(id)
                ? prev.equipment.filter(e => e !== id)
                : [...prev.equipment, id]
        }));
    };

    const toggleDay = (day: number) => {
        setFormData(prev => ({
            ...prev,
            days: prev.days.includes(day)
                ? prev.days.filter(d => d !== day)
                : [...prev.days, day].sort()
        }));
    };

    const handleComplete = async () => {
        setLoading(true);
        try {
            // TODO: Save profile to Supabase
            await new Promise(resolve => setTimeout(resolve, 1500));
            router.push('/dashboard');
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (currentStep.id) {
            case 'goal':
                return (
                    <div className="grid grid-cols-2 gap-3">
                        {GOALS.map(goal => (
                            <button
                                key={goal.id}
                                type="button"
                                onClick={() => setFormData({ ...formData, goal: goal.id })}
                                className={`card card-interactive flex flex-col items-center gap-2 py-6 ${formData.goal === goal.id ? 'border-primary bg-primary/10' : ''
                                    }`}
                            >
                                <span className="text-3xl">{goal.icon}</span>
                                <span className="font-medium">{goal.label}</span>
                            </button>
                        ))}
                    </div>
                );

            case 'level':
                return (
                    <div className="flex flex-col gap-3">
                        {LEVELS.map(level => (
                            <button
                                key={level.id}
                                type="button"
                                onClick={() => setFormData({ ...formData, level: level.id })}
                                className={`card card-interactive text-left ${formData.level === level.id ? 'border-primary bg-primary/10' : ''
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold">{level.label}</p>
                                        <p className="text-secondary text-sm mt-1">{level.desc}</p>
                                    </div>
                                    {formData.level === level.id && (
                                        <Check className="text-primary" size={24} />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                );

            case 'body':
                return (
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                label="Altura (cm)"
                                type="number"
                                placeholder="175"
                                value={formData.height}
                                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                            />
                            <Input
                                label="Peso (kg)"
                                type="number"
                                placeholder="70"
                                value={formData.weight}
                                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                            />
                        </div>
                        <Input
                            label="Data de nascimento"
                            type="date"
                            value={formData.birth_date}
                            onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                        />
                        <div>
                            <label className="input-label mb-2 block">Gênero</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['Masculino', 'Feminino', 'Outro'].map(g => (
                                    <button
                                        key={g}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, gender: g.toLowerCase() })}
                                        className={`btn btn-secondary ${formData.gender === g.toLowerCase() ? 'border-primary bg-primary/10' : ''
                                            }`}
                                        style={{ minHeight: 44 }}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'preferences':
                return (
                    <div className="flex flex-col gap-6">
                        <div>
                            <label className="input-label mb-3 block flex items-center gap-2">
                                <Clock size={18} />
                                Duração do treino: {formData.duration} min
                            </label>
                            <input
                                type="range"
                                min={15}
                                max={120}
                                step={5}
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                                className="w-full"
                            />
                            <div className="flex justify-between text-muted text-xs mt-1">
                                <span>15 min</span>
                                <span>120 min</span>
                            </div>
                        </div>

                        <div>
                            <label className="input-label mb-3 block">Dias da semana</label>
                            <div className="flex gap-2">
                                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => toggleDay(i)}
                                        className={`w-10 h-10 rounded-full font-medium text-sm ${formData.days.includes(i)
                                                ? 'bg-primary text-white'
                                                : 'bg-surface border border-border'
                                            }`}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'equipment':
                return (
                    <div className="flex flex-col gap-3">
                        {EQUIPMENT.map(eq => (
                            <button
                                key={eq.id}
                                type="button"
                                onClick={() => toggleEquipment(eq.id)}
                                className={`card card-interactive flex items-center justify-between ${formData.equipment.includes(eq.id) ? 'border-primary bg-primary/10' : ''
                                    }`}
                            >
                                <span>{eq.label}</span>
                                {formData.equipment.includes(eq.id) && (
                                    <Check className="text-primary" size={20} />
                                )}
                            </button>
                        ))}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen flex flex-col safe-top safe-bottom">
            {/* Progress Bar */}
            <div className="h-1 bg-surface">
                <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Header */}
            <div className="p-6 pb-4">
                <div className="flex items-center gap-4 mb-6">
                    {step > 0 && (
                        <button onClick={handleBack} className="p-2 -ml-2">
                            <ChevronLeft size={24} />
                        </button>
                    )}
                    <div className="flex-1">
                        <p className="text-muted text-sm">Passo {step + 1} de {STEPS.length}</p>
                        <h1 className="text-xl font-bold mt-1">{currentStep.title}</h1>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 pb-6 overflow-y-auto">
                {renderStep()}
            </div>

            {/* Footer */}
            <div className="p-6 pt-4 border-t border-border">
                {step < STEPS.length - 1 ? (
                    <Button onClick={handleNext} fullWidth>
                        Continuar
                        <ChevronRight size={20} />
                    </Button>
                ) : (
                    <Button onClick={handleComplete} loading={loading} fullWidth>
                        Começar a treinar
                        <Dumbbell size={20} />
                    </Button>
                )}
            </div>
        </div>
    );
}
