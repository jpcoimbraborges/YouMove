# 🎯 IMPLEMENTAÇÃO 1: Dashboard Informativo

**Status**: 🚧 Em andamento  
**Estimativa**: 7h  
**Prioridade**: Alta

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Quick Actions (2h)
- [ ] Card de "Quick Actions" com botões principais
  - [ ] "Iniciar Treino IA"
  - [ ] "Log Rápido Refeição"
  - [ ] "Adicionar Sessão Manual"
  - [ ] "Ver Progresso"

### Fase 2: Widget de Sugestão Diária (2h)
- [ ] Integração com IA para sugestão contextual
- [ ] Análise de padrões (último treino, consistência)
- [ ] Card animado com recomendação
- [ ] Botão de ação rápida

### Fase 3: Resumo Nutricional do Dia (1.5h)
- [ ] Fetch de nutrition_logs de hoje
- [ ] Calcular macros consumidos vs meta
- [ ] Mini gráfico circular ou barra
- [ ] Link para página completa

### Fase 4: Timeline de Atividades Recentes (1.5h)
- [ ] Listar últimos 5 treinos/refeições
- [ ] Formato timeline vertical
- [ ] Ícones diferenciados
- [ ] Timestamps relativos ("há 2 horas")

---

## 🎨 DESIGN PROPOSTO

### Layout Estrutural
```
┌────────────────────────────────────────────────┐
│  Bom dia, João                     [🔔] [👤]  │
├────────────────────────────────────────────────┤
│                                                │
│  ┌──────────────────┐  ┌──────────────────┐   │
│  │ Meta Semanal     │  │ Próximo Treino   │   │
│  │ [Ring Progress]  │  │ [Image + Button] │   │
│  └──────────────────┘  └──────────────────┘   │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ 🎯 Sugestão do Dia (IA)                  │ │
│  │ "Seus ombros não treinam há 5 dias..."   │ │
│  │ [Gerar Treino de Ombros] →               │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ ⚡ Quick Actions                          │ │
│  │ [Treino IA] [Log Refeição] [Adicionar]   │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ┌────────────┬───────────────────────────────┐
│  │ Nutrição   │ Timeline Recente              │
│  │ Hoje       │ • Treino de Peito - há 1 dia  │
│  │            │ • Café da Manhã  - há 2h      │
│  │ 1200/2400  │ • Almoço - há 5h              │
│  │ kcal       │ • Treino de Pernas - há 3 dias│
│  └────────────┴───────────────────────────────┘
│                                                │
│  [Sequência] [Peso] [Calorias] [Sono]         │
└────────────────────────────────────────────────┘
```

---

## 🛠️ COMPONENTES A CRIAR

### 1. QuickActionsWidget.tsx
```typescript
interface QuickAction {
    id: string;
    label: string;
    icon: LucideIcon;
    href?: string;
    onClick?: () => void;
    color: string;
    gradient: string;
}

const actions: QuickAction[] = [
    {
        id: 'ai-workout',
        label: 'Treino IA',
        icon: Brain,
        href: '/workout?mode=ai',
        color: 'blue',
        gradient: 'from-blue-600 to-cyan-600'
    },
    // ...
];
```

### 2. AISuggestionWidget.tsx
```typescript
// Chama API /api/workout/coach com prompt:
"Analise o histórico recente do usuário e sugira 
uma ação para maximizar resultados hoje."

interface AISuggestion {
    type: 'workout' | 'nutrition' | 'recovery';
    title: string;
    description: string;
    action: {
        label: string;
        href: string;
    };
    priority: 'high' | 'medium' | 'low';
}
```

### 3. NutritionSummaryWidget.tsx
```typescript
interface NutritionSummary {
    consumed: {
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
    };
    goals: {
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
    };
    percentages: {
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
    };
}
```

### 4. ActivityTimelineWidget.tsx
```typescript
interface ActivityItem {
    id: string;
    type: 'workout' | 'meal' | 'weight';
    title: string;
    subtitle?: string;
    timestamp: string;
    icon: LucideIcon;
    color: string;
}
```

---

## 📊 DADOS NECESSÁRIOS

### API Calls
```typescript
// 1. Dados já existentes no dashboard atual:
- recentSessions (últimos 30 treinos)
- profileData (perfil do usuário)
- nextWorkout (próximo treino sugerido)

// 2. Novos dados a buscar:
- nutrition_logs (hoje)
- nutrition_goals (metas do usuário)
- ai_suggestion (nova API)
```

### Nova API: `/api/dashboard/daily-suggestion`
```typescript
POST /api/dashboard/daily-suggestion
Body: { user_id: string }

Response: {
    success: boolean;
    suggestion: {
        type: 'workout' | 'nutrition' | 'recovery';
        title: string;
        description: string;
        action: {
            label: string;
            href: string;
        };
        reasoning: string;
    };
}
```

---

## 🎨 ESTILO VISUAL

### Quick Actions
```css
/* Botões com gradiente e hover elevado */
.quick-action-btn {
    background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
    border-radius: 16px;
    padding: 16px;
    transition: all 0.3s ease;
}

.quick-action-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(59, 130, 246, 0.4);
}
```

### AI Suggestion Card
```css
/* Card com borda animada e glow effect */
.ai-suggestion-card {
    background: linear-gradient(145deg, #1c2128 0%, #0d1117 100%);
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 20px;
    position: relative;
    overflow: hidden;
}

.ai-suggestion-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent);
    animation: shimmer 3s infinite;
}

@keyframes shimmer {
    0% { left: -100%; }
    100% { left: 100%; }
}
```

---

## 🚀 PLANO DE EXECUÇÃO

### Dia 1 (4h)
1. Criar componentes base (1.5h)
   - QuickActionsWidget.tsx
   - NutritionSummaryWidget.tsx
2. Implementar Quick Actions (1h)
3. Implementar Resumo Nutricional (1.5h)

### Dia 2 (3h)
4. Criar API de sugestão diária (1.5h)
5. Implementar AISuggestionWidget.tsx (1h)
6. Implementar ActivityTimelineWidget.tsx (0.5h)

### Revisão e Ajustes (1h)
7. Testar responsividade
8. Ajustar loading states
9. Validar dados com Supabase

---

## ✅ CRITÉRIOS DE ACEITAÇÃO

- [ ] Dashboard carrega em < 2s
- [ ] Todos os widgets funcionam sem dados (empty states)
- [ ] Quick Actions levam para páginas corretas
- [ ] Sugestão da IA é contextual e útil
- [ ] Resumo nutricional atualiza em tempo real
- [ ] Timeline mostra últimas 5 atividades
- [ ] Responsivo em mobile e desktop
- [ ] Sem erros no console
- [ ] Loading states suaves

---

## 📝 NOTAS TÉCNICAS

### Performance
- Usar `React.memo` nos widgets
- Lazy load da sugestão da IA (não bloquear render inicial)
- Cache de dados de nutrição (SWR-like)

### Acessibilidade
- Labels ARIA em botões de ação
- Contrast ratio > 4.5:1
- Keyboard navigation

### Mobile First
- Grid responsivo: 1 col mobile, 2 cols desktop
- Touch targets > 44x44px
- Scroll suave

---

**Começar implementação?** Digite "sim" para iniciar a Fase 1.
