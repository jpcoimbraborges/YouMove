/**
 * YOUMOVE - Coach IA API
 * 
 * Endpoint para gerar micro-dicas da IA durante a execução do treino
 * Dicas são curtas, práticas e focadas no momento atual
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';



interface CoachRequest {
    exerciseName: string;
    exerciseNamePt?: string;
    targetMuscle: string;
    equipment: string;
    currentSet: number;
    totalSets: number;
    targetReps: number;
    weight?: number;
    userLevel: 'beginner' | 'intermediate' | 'advanced';
    userGoal?: string;
    previousTip?: string; // Para evitar repetição
    context?: 'execution' | 'rest' | 'start' | 'finish';
}

const COACH_SYSTEM_PROMPT = `Você é o Coach IA do app YouMove, um personal trainer virtual especializado.

REGRAS ABSOLUTAS:
1. Seja DIRETO e BREVE - máximo de 1 frase curta
2. Dê apenas dicas PRÁTICAS e ACIONÁVEIS
3. NUNCA interrompa o fluxo do treino com textos longos
4. Adapte a linguagem ao nível do usuário
5. NUNCA dê conselhos médicos ou diagnósticos
6. Use linguagem motivacional mas não exagerada
7. Foque em: técnica, respiração, concentração muscular, cadência
8. Máximo 80 caracteres na resposta

ESTILO:
- Iniciante: dicas básicas de postura e segurança
- Intermediário: foco em técnica e mind-muscle connection
- Avançado: dicas de otimização e intensificação

EXEMPLOS DE BONS OUTPUTS:
- "Controle a descida por 2 segundos."
- "Expire ao empurrar, inspire ao descer."
- "Mantenha os cotovelos junto ao corpo."
- "Ative o core antes de iniciar."
- "Última série! Dê tudo de si! 💪"`;

function getContextPrompt(context: string): string {
    switch (context) {
        case 'start':
            return 'O usuário está prestes a iniciar este exercício.';
        case 'rest':
            return 'O usuário está descansando entre séries.';
        case 'finish':
            return 'O usuário está na última série do exercício.';
        case 'execution':
        default:
            return 'O usuário está executando uma série.';
    }
}

export async function POST(request: NextRequest) {
    try {
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        const body: CoachRequest = await request.json();

        const {
            exerciseName,
            exerciseNamePt,
            targetMuscle,
            equipment,
            currentSet,
            totalSets,
            targetReps,
            weight,
            userLevel = 'intermediate',
            userGoal,
            previousTip,
            context = 'execution'
        } = body;

        if (!exerciseName) {
            return NextResponse.json(
                { error: 'Nome do exercício é obrigatório' },
                { status: 400 }
            );
        }

        const displayName = exerciseNamePt || exerciseName;
        const contextInfo = getContextPrompt(context);

        const userPrompt = `
Exercício: ${displayName}
Músculo alvo: ${targetMuscle}
Equipamento: ${equipment}
Série atual: ${currentSet}/${totalSets}
Repetições alvo: ${targetReps}
${weight ? `Carga: ${weight}kg` : ''}
Nível do usuário: ${userLevel}
${userGoal ? `Objetivo: ${userGoal}` : ''}
${previousTip ? `Dica anterior (não repita): "${previousTip}"` : ''}

Contexto: ${contextInfo}

Gere UMA micro-dica prática e curta (máximo 80 caracteres).`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: COACH_SYSTEM_PROMPT },
                { role: 'user', content: userPrompt }
            ],
            max_tokens: 60,
            temperature: 0.7,
        });

        const tip = completion.choices[0]?.message?.content?.trim() || '';

        // Garantir que a dica não é muito longa
        const finalTip = tip.length > 100 ? tip.substring(0, 97) + '...' : tip;

        return NextResponse.json({
            tip: finalTip,
            context,
            exerciseName: displayName,
        });

    } catch (error) {
        console.error('Coach IA error:', error);

        // Fallback para dicas pré-definidas em caso de erro
        const fallbackTips = [
            'Mantenha a postura correta.',
            'Respire de forma controlada.',
            'Foco na contração muscular.',
            'Controle o movimento.',
            'Você está indo muito bem! 💪'
        ];

        const randomTip = fallbackTips[Math.floor(Math.random() * fallbackTips.length)];

        return NextResponse.json({
            tip: randomTip,
            context: 'fallback',
            exerciseName: '',
        });
    }
}
