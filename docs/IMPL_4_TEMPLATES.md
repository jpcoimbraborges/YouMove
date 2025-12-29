# Implementação 4: Templates de Treino

**Status:** 🔄 Em Andamento
**Prioridade:** Alta
**Estimativa:** 4-6 horas

---

## 🎯 Objetivo

Criar uma biblioteca de templates de treino pré-configurados para facilitar o onboarding de iniciantes e oferecer opções rápidas para usuários que não querem usar a IA.

## 📋 Features

### 1. Biblioteca de Templates
- Templates categorizados por objetivo (Hipertrofia, Força, Emagrecimento, etc.)
- Filtragem por nível (Iniciante, Intermediário, Avançado)
- Filtragem por duração (15min, 30min, 45min, 60min)
- Busca por nome/músculo

### 2. Visualização de Template
- Detalhes completos (exercícios, séries, repetições)
- Preview visual dos músculos trabalhados
- Tempo estimado
- Dificuldade

### 3. Ações do Usuário
- "Usar Template" → Copia para treinos do usuário
- "Favoritar" → Salva nos favoritos
- Customização opcional → Editar antes de salvar

---

## 🗄️ Schema do Banco

### Tabela: `workout_templates`

```sql
CREATE TABLE workout_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    
    -- Classificação
    category TEXT NOT NULL, -- 'strength', 'hypertrophy', 'endurance', 'weight_loss', 'functional'
    difficulty TEXT NOT NULL, -- 'beginner', 'intermediate', 'advanced'
    target_muscles TEXT[] DEFAULT '{}',
    
    -- Estrutura
    duration_minutes INTEGER NOT NULL,
    exercises JSONB NOT NULL DEFAULT '[]',
    
    -- Metadados
    equipment_needed TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    
    -- Stats
    uses_count INTEGER DEFAULT 0,
    favorites_count INTEGER DEFAULT 0,
    rating_avg DECIMAL(2,1) DEFAULT 0,
    
    -- Sistema
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎨 UI/UX

### Página `/workout/templates`
- Grid de cards com templates
- Filtros laterais (mobile: bottom sheet)
- Busca no topo
- Badges: "Popular", "Novo", "Favorito"

### Card do Template
- Imagem/Ícone do tipo de treino
- Nome + Badge de dificuldade
- Duração + Músculos alvo (pills)
- Contador de usos
- Botão "Usar"

### Modal de Detalhes
- Header com imagem
- Lista de exercícios com séries/reps
- Macros do treino (volume, tempo, intensidade)
- Botões: "Usar Template", "Favoritar"

---

## 📂 Arquivos a Criar

1. `supabase/migrations/004_workout_templates.sql`
2. `frontend/src/types/template.types.ts`
3. `frontend/src/app/api/templates/route.ts`
4. `frontend/src/app/api/templates/[id]/route.ts`
5. `frontend/src/app/(app)/workout/templates/page.tsx`
6. `frontend/src/components/workout/TemplateCard.tsx`
7. `frontend/src/components/workout/TemplateDetailModal.tsx`
8. `frontend/src/components/workout/TemplateFilters.tsx`

---

## 📊 Templates Iniciais (Seeds)

### Por Categoria:

**Iniciante (5)**
1. Full Body Básico (45min)
2. Treino ABC Simples (3x/semana)
3. Cardio + Core (30min)
4. Upper/Lower Split (4x/semana)
5. Mobilidade e Alongamento (20min)

**Intermediário (5)**
1. Push/Pull/Legs (6x/semana)
2. Hipertrofia Peito/Costas (60min)
3. HIIT Queima de Gordura (25min)
4. Força 5x5 (45min)
5. Treino de Braços Completo (40min)

**Avançado (5)**
1. Programa de Força (Powerlifting)
2. Bodybuilding Split (6 dias)
3. CrossFit Style WOD
4. Giant Sets Hipertrofia
5. Periodização Ondulada

---

## ⏱️ Cronograma

| Fase | Tarefa | Tempo |
|------|--------|-------|
| 1 | Migration + Seeds | 1h |
| 2 | Types + API | 1h |
| 3 | UI Components | 2h |
| 4 | Página + Integração | 1h |
| 5 | Polish + Deploy | 1h |

**Total:** ~6h
