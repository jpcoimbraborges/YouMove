# 🎯 IMPLEMENTAÇÃO 2: Progressão Automática com IA

**Status**: 🚧 Em andamento  
**Estimativa**: 8-10h  
**Prioridade**: Alta

---

## 📋 OBJETIVO

Criar um sistema inteligente que analisa o histórico de treinos do usuário e sugere automaticamente quando e como progredir (aumentar carga, reps ou séries) em cada exercício, garantindo **progressive overload** seguro e eficiente.

---

## 🎯 FEATURES PRINCIPAIS

### 1. **Análise de Performance Histórica**
- Buscar últimas 5-10 sessões do mesmo exercício
- Calcular médias de:
  - Carga usada
  - Reps completadas
  - RPE (Rate of Perceived Exertion) se disponível
  - Volume total (sets × reps × weight)

### 2. **Regras de Progressão Inteligente**

#### Cenário 1: Aumentar Carga
**Condição**: Usuário completou target reps em todas as séries por 2+ treinos consecutivos

**Sugestão**:
```
Se: 3x12 @50kg completados por 2 treinos
Então: Sugerir 3x12 @52.5kg (+5%)
```

#### Cenário 2: Aumentar Reps
**Condição**: Usuário está progredindo mas carga ainda é desafiadora

**Sugestão**:
```
Se: 3x10 @50kg → 3x11 @50kg → 3x12 @50kg
Então: Sugerir 3x12 @52kg OU 3x15 @50kg
```

#### Cenário 3: Adicionar Série
**Condição**: Volume baixo comparado ao nível do usuário

**Sugestão**:
```
Se: Fazendo 2x12 há 3+ treinos
Então: Sugerir 3x12 (mesma carga)
```

#### Cenário 4: Manter (Recovery)
**Condição**: Performance caindo ou treino muito recente

**Sugestão**:
```
Se: Último treino de peito foi ontem
OU: Performance caiu 10%+ no último treino
Então: "Mantenha a carga atual ou descanse mais"
```

### 3. **Safety Limits por Nível**

| Nível | Max Aumento Carga/Semana | Max Aumento Reps/Treino | Max Sets |
|-------|-------------------------|------------------------|----------|
| Iniciante | 2.5-5% | +1-2 | 4 |
| Intermediário | 5-7.5% | +2-3 | 5 |
| Avançado | 7.5-10% | +3-5 | 6 |
| Atleta | 10-15% | +5+ | 8 |

### 4. **UI de Sugestão**

#### Durante Planejamento (Página de Treino)
```
┌────────────────────────────────────────┐
│ 💡 Sugestão de Progressão              │
│                                        │
│ Supino Reto                            │
│ Histórico: 3x10 @60kg (últimos 3x)    │
│                                        │
│ ✨ Progresso sugerido:                 │
│ 3x10 @62.5kg (+4.2%)                   │
│                                        │
│ Motivo: Você completou todas as reps  │
│ nos últimos 3 treinos. É hora de       │
│ aumentar!                              │
│                                        │
│ [Aplicar Sugestão] [Ignorar]          │
└────────────────────────────────────────┘
```

#### Pós-Treino (Resumo)
```
┌────────────────────────────────────────┐
│ 📊 Análise de Progressão               │
│                                        │
│ ✅ 3 exercícios progredidos            │
│ ⚠️ 1 exercício: manter carga           │
│ 🔥 2 novos PRs (Personal Records)!     │
│                                        │
│ Próximas sugestões:                    │
│ • Supino: +2.5kg na próxima            │
│ • Agachamento: +1 rep por série        │
│                                        │
│ [Ver Detalhes]                         │
└────────────────────────────────────────┘
```

---

## 🛠️ ARQUITETURA TÉCNICA

### Componentes a Criar

#### 1. **Progression Analyzer Service**
**Arquivo**: `frontend/src/lib/progression/analyzer.ts`

```typescript
interface ExerciseHistory {
    exercise_id: string;
    exercise_name: string;
    sessions: {
        date: string;
        sets: number;
        reps: number;
        weight_kg: number;
        completed_reps: number[];
        rpe?: number;
    }[];
}

interface ProgressionSuggestion {
    exercise_id: string;
    exercise_name: string;
    current: {
        sets: number;
        reps: number;
        weight_kg: number;
    };
    suggested: {
        sets: number;
        reps: number;
        weight_kg: number;
    };
    reasoning: string;
    confidence: 'high' | 'medium' | 'low';
    type: 'increase_weight' | 'increase_reps' | 'add_set' | 'maintain' | 'deload';
}

export function analyzeProgression(
    history: ExerciseHistory,
    userLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite'
): ProgressionSuggestion;
```

#### 2. **Progression Suggestion Component**
**Arquivo**: `frontend/src/components/workout/ProgressionSuggestionCard.tsx`

Props:
- `suggestion: ProgressionSuggestion`
- `onApply: (suggestion) => void`
- `onDismiss: () => void`

#### 3. **API Route (Opcional - para IA)**
**Arquivo**: `frontend/src/app/api/workout/progression/route.ts`

```typescript
POST /api/workout/progression
Body: {
    exercise_id: string;
    user_id: string;
    history: ExerciseHistory;
}

Response: {
    suggestion: ProgressionSuggestion;
    ai_reasoning: string;
}
```

---

## 📊 DADOS NECESSÁRIOS

### De `workout_sessions`
```sql
SELECT 
    ws.id,
    ws.completed_at,
    ws.exercises_completed
FROM workout_sessions ws
WHERE ws.user_id = $1
  AND ws.completed_at IS NOT NULL
ORDER BY ws.completed_at DESC
LIMIT 30;
```

### Estrutura de `exercises_completed` (JSONB)
```json
[
    {
        "exercise_id": "uuid",
        "exercise_name": "Supino Reto",
        "sets": [
            { "reps": 12, "weight_kg": 60, "completed": true },
            { "reps": 11, "weight_kg": 60, "completed": true },
            { "reps": 10, "weight_kg": 60, "completed": true }
        ]
    }
]
```

---

## 🎨 ALGORITMO DE ANÁLISE

### Pseudocódigo

```python
def analyzeProgression(exercise_history, user_level):
    # 1. Validar dados mínimos
    if len(exercise_history.sessions) < 2:
        return { type: 'maintain', reasoning: 'Dados insuficientes' }
    
    # 2. Calcular médias recentes (últimas 3 sessões)
    recent_sessions = exercise_history.sessions[:3]
    avg_weight = mean([s.weight_kg for s in recent_sessions])
    avg_reps_completed = mean([mean(s.completed_reps) for s in recent_sessions])
    target_reps = recent_sessions[0].reps
    
    # 3. Verificar se completou target reps
    completed_all_reps = all([
        all([r >= target_reps for r in s.completed_reps])
        for s in recent_sessions
    ])
    
    # 4. Verificar tendência
    is_improving = recent_sessions[0].weight_kg >= recent_sessions[-1].weight_kg
    
    # 5. Verificar recovery (tempo desde último treino)
    days_since_last = (today - recent_sessions[0].date).days
    is_recovered = days_since_last >= 2
    
    # 6. Aplicar regras
    if completed_all_reps and is_recovered:
        # Sugerir aumento de carga
        increase_percent = get_safe_increase(user_level)  # 2.5-10%
        new_weight = avg_weight * (1 + increase_percent)
        
        return {
            type: 'increase_weight',
            suggested: { weight_kg: round(new_weight, 1) },
            reasoning: f'Você completou {target_reps} reps em todas as séries por {len(recent_sessions)} treinos.',
            confidence: 'high'
        }
    
    elif avg_reps_completed / target_reps >= 0.9 and is_improving:
        # Sugerir aumento de reps
        return {
            type: 'increase_reps',
            suggested: { reps: target_reps + 1 },
            reasoning: 'Você está quase lá! Tente mais 1 rep por série.',
            confidence: 'medium'
        }
    
    elif not is_recovered:
        return {
            type: 'maintain',
            reasoning: f'Descanse mais {2 - days_since_last} dias antes de progredir.',
            confidence: 'high'
        }
    
    else:
        return {
            type: 'maintain',
            reasoning: 'Continue com a carga atual e foque na execução.',
            confidence: 'medium'
        }
```

---

## 🚀 PLANO DE EXECUÇÃO

### Fase 1: Core Logic (3h)
1. Criar `lib/progression/analyzer.ts`
2. Implementar função `analyzeProgression()`
3. Implementar `getSafeIncrease()` baseado em nível
4. Testes unitários básicos

### Fase 2: UI Components (2h)
5. Criar `ProgressionSuggestionCard.tsx`
6. Criar `ProgressionBadge.tsx` (mini indicator)
7. Estilizar com gradientes e animações

### Fase 3: Integração (2h)
8. Integrar na página de detalhes do treino (`/workout/[id]`)
9. Opcional: Modal pré-treino com sugestões
10. Salvar sugestões aplicadas no DB (tracking)

### Fase 4: Analytics & IA (2h)
11. Criar API `/api/workout/progression`
12. Prompt da IA para gerar reasoning personalizado
13. Dashboard de progressão (página dedicada futura)

### Revisão & Testes (1h)
14. Testar com diferentes cenários
15. Validar safety limits
16. Deploy

---

## ✅ CRITÉRIOS DE ACEITAÇÃO

- [ ] Análise funciona com mínimo 2 sessões passadas
- [ ] Sugestões respeitam safety limits por nível
- [ ] UI clara e acionável (botão "Aplicar")
- [ ] Não sugere progressão se treino foi ontem
- [ ] Calcula aumento percentual corretamente
- [ ] Empty state quando sem histórico
- [ ] Performance < 200ms para análise
- [ ] Mobile responsive

---

## 📝 EXEMPLO DE FLUXO

### Usuário João (Intermediário)

**Histórico de Supino**:
```
Treino 1 (há 7 dias): 3x12 @60kg ✅✅✅
Treino 2 (há 4 dias): 3x12 @60kg ✅✅✅
Treino 3 (hoje planejado)
```

**Sistema detecta**:
- ✅ Completou target reps 2x seguidas
- ✅ Já se passaram 4 dias (recuperado)
- ✅ Nível intermediário → aumento seguro: 5%

**Sugestão gerada**:
```
💡 Progresso Detectado!

Supino Reto
Você dominou 3x12 @60kg nos últimos 2 treinos.

Sugestão: 3x12 @63kg (+5%)

Motivo: Seu corpo está pronto para mais desafio.
Aumente gradualmente para evitar lesões.

[Aplicar Sugestão] [Manter Atual]
```

**Se usuário aplicar**:
- Treino atualizado automaticamente
- Registro salvo: "progression_suggestion_applied"
- Analytics trackeia taxa de sucesso

---

## 🔮 FEATURES FUTURAS (v2)

- [ ] Gráfico de progressão por exercício
- [ ] Previsão: "Com esse ritmo, você chegará a 100kg em 8 semanas"
- [ ] Auto-progressão: Sistema aplica automaticamente com confirmação
- [ ] Deload sugerido após 4-6 semanas de progressão contínua
- [ ] Integração com RPE (Rate of Perceived Exertion)
- [ ] Comparação com médias de usuários similares

---

**Começar Fase 1?** Responda "sim" para criar o analyzer.
