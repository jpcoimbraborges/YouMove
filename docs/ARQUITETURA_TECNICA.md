# 🏗️ YOUMOVE - Arquitetura Técnica

**Versão**: 1.0  
**Data**: 29/12/2024

---

## 📐 VISÃO GERAL DA ARQUITETURA

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 16)                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │         PWA Service Worker (sw.ts)               │   │
│  │  • Offline caching                               │   │
│  │  • Background sync                               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │              App Router Pages                     │   │
│  │  • (auth): Login, Signup, Onboarding             │   │
│  │  • (app): Dashboard, Workout, Nutrition, etc     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │           API Routes (/api/*)                     │   │
│  │  • workout/generate: IA workout generation       │   │
│  │  • nutrition/suggest-menu: IA meal planning      │   │
│  │  • exercises/*: Wger integration                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │           State Management                        │   │
│  │  • Zustand: workout-session-store                │   │
│  │  • React Context: AuthContext                    │   │
│  │  • Local Storage: offline data                   │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    SUPABASE BACKEND                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │              PostgreSQL Database                  │   │
│  │  Tables:                                          │   │
│  │  • profiles (RLS enabled)                        │   │
│  │  • workouts (RLS enabled)                        │   │
│  │  • workout_sessions (RLS enabled)                │   │
│  │  • exercises (RLS enabled)                       │   │
│  │  • nutrition_logs (RLS enabled)                  │   │
│  │  • nutrition_goals (RLS enabled)                 │   │
│  │  • food_library (RLS enabled)                    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │         Supabase Auth (JWT)                       │   │
│  │  • Email/Password                                │   │
│  │  • OAuth (Google)                                │   │
│  │  • Session management                            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │          Supabase Storage                         │   │
│  │  • User avatars                                  │   │
│  │  • Exercise images                               │   │
│  │  • Food photos                                   │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          │ API Calls
                          ▼
┌─────────────────────────────────────────────────────────┐
│               EXTERNAL SERVICES                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │              OpenAI GPT-4                         │   │
│  │  • Workout generation                            │   │
│  │  • Meal planning                                 │   │
│  │  • Coach chat                                    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │               Wger API                            │   │
│  │  • Exercise database                             │   │
│  │  • Exercise images                               │   │
│  │  • Muscle mapping                                │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │            Unsplash (Fallback)                    │   │
│  │  • Exercise images quando Wger falha             │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 🗄️ SCHEMA DO BANCO DE DADOS

### Tabela: `profiles`
```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    full_name TEXT,
    email TEXT,
    birth_date DATE,
    weight_kg DECIMAL,
    height_cm DECIMAL,
    fitness_goal TEXT, -- 'Ganhar massa muscular', 'Perder gordura', etc
    fitness_level TEXT, -- 'Iniciante', 'Intermediário', 'Avançado', 'Atleta'
    equipment_available TEXT[], -- Array de IDs de equipamentos
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS Policy
CREATE POLICY "Users can only view/update own profile"
ON profiles FOR ALL
USING (auth.uid() = id);
```

### Tabela: `workouts`
```sql
CREATE TABLE workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    name TEXT NOT NULL,
    difficulty TEXT, -- 'beginner', 'intermediate', 'advanced', 'elite'
    workout_type TEXT, -- 'strength', 'cardio', 'custom'
    target_muscles TEXT[], -- Array de músculos trabalhados
    exercises JSONB, -- [{id, name, sets, reps, weight_kg, rest_seconds}]
    is_ai_generated BOOLEAN DEFAULT FALSE,
    avg_duration_minutes INT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- RLS Policy
CREATE POLICY "Users can manage own workouts"
ON workouts FOR ALL
USING (auth.uid() = user_id);
```

### Tabela: `workout_sessions`
```sql
CREATE TABLE workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    workout_id UUID REFERENCES workouts(id),
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    duration_minutes INT,
    exercises_completed JSONB, -- [{exercise_id, sets: [{reps, weight_kg}]}]
    total_volume_kg DECIMAL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- RLS Policy
CREATE POLICY "Users can manage own sessions"
ON workout_sessions FOR ALL
USING (auth.uid() = user_id);
```

### Tabela: `exercises`
```sql
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wger_id INT UNIQUE, -- ID externo do Wger
    name TEXT NOT NULL,
    description TEXT,
    category TEXT, -- 'strength', 'cardio', 'flexibility'
    muscles TEXT[], -- Array de músculos principais
    equipment TEXT[], -- Array de equipamentos necessários
    difficulty TEXT,
    thumbnail_url TEXT,
    video_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- RLS Policy: Público para leitura
CREATE POLICY "Exercises readable by all"
ON exercises FOR SELECT
USING (TRUE);
```

### Tabela: `nutrition_logs`
```sql
CREATE TABLE nutrition_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    log_date DATE NOT NULL,
    meal_type TEXT, -- 'breakfast', 'lunch', 'dinner', 'snack', 'water'
    item_name TEXT,
    calories INT,
    protein_g DECIMAL,
    carbs_g DECIMAL,
    fats_g DECIMAL,
    water_ml INT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- RLS Policy
CREATE POLICY "Users can manage own nutrition logs"
ON nutrition_logs FOR ALL
USING (auth.uid() = user_id);
```

### Tabela: `nutrition_goals`
```sql
CREATE TABLE nutrition_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) UNIQUE,
    daily_calories INT,
    protein_g INT,
    carbs_g INT,
    fats_g INT,
    water_liters DECIMAL,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS Policy
CREATE POLICY "Users can manage own nutrition goals"
ON nutrition_goals FOR ALL
USING (auth.uid() = user_id);
```

### Tabela: `food_library`
```sql
CREATE TABLE food_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    name TEXT NOT NULL,
    calories INT,
    protein_g DECIMAL,
    carbs_g DECIMAL,
    fats_g DECIMAL,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- RLS Policy
CREATE POLICY "Users can manage own food library"
ON food_library FOR ALL
USING (auth.uid() = user_id);
```

---

## 🔐 AUTENTICAÇÃO E SEGURANÇA

### Fluxo de Autenticação
```typescript
// 1. SignUp
supabase.auth.signUp({
    email: 'user@example.com',
    password: 'securepassword123',
    options: {
        data: { full_name: 'John Doe' }
    }
})

// 2. Login
supabase.auth.signInWithPassword({
    email: 'user@example.com',
    password: 'securepassword123'
})

// 3. OAuth (Google)
supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
        redirectTo: `${window.location.origin}/auth/callback`
    }
})

// 4. Session Management
const { data: { session } } = await supabase.auth.getSession()
```

### Row Level Security (RLS)
- ✅ Todas as tabelas principais com RLS habilitado
- ✅ Usuários só podem acessar seus próprios dados
- ✅ `exercises` é público para leitura
- ✅ Policies testadas e validadas

---

## 🤖 INTEGRAÇÃO COM IA (OpenAI)

### Arquitetura de IA
```
Frontend                     Backend                    OpenAI
  │                            │                          │
  │  POST /api/workout/generate│                          │
  ├──────────────────────────►│                          │
  │                            │                          │
  │                            │  Build prompt + context  │
  │                            │                          │
  │                            │  callOpenAIWithRetry()   │
  │                            ├─────────────────────────►│
  │                            │                          │
  │                            │  ◄─── JSON Response ───  │
  │                            │                          │
  │                            │  validateAISuggestion()  │
  │                            │  (safety limits)         │
  │                            │                          │
  │  ◄──── Validated Workout ──┤                          │
  │                            │                          │
```

### Prompts Sistema
**Arquivos**: `frontend/src/lib/ai/prompts/system-prompts.ts`

1. **WORKOUT_GENERATION**: Gera treino único
2. **WEEKLY_PLAN**: Gera plano de 7 dias
3. **LOG_ANALYSIS**: Analisa histórico de treinos
4. **SUGGESTION**: Gera sugestões personalizadas
5. **COACH_CHAT**: Responde perguntas do usuário

### Safety Validator
**Arquivo**: `frontend/src/lib/ai/engines/safety-validator.ts`

```typescript
// Valida sugestões da IA contra limites de segurança
const validation = validateAISuggestion(
    workout,
    userLevel: 'intermediate',
    userAge: 25
);

// Retorna ajustes se necessário
if (validation.adjustments.length > 0) {
    // Aplica correções automáticas
}
```

**Limites por Nível**:
- **Beginner**: Max 4 séries, 60 min, rest 90-120s
- **Intermediate**: Max 5 séries, 90 min, rest 60-90s
- **Advanced**: Max 6 séries, 120 min, rest 45-60s
- **Elite**: Max 8 séries, 150 min, rest 30-45s

---

## 📱 PWA (Progressive Web App)

### Service Worker
**Arquivo**: `frontend/src/sw.ts`

```typescript
// Estratégias de cache
const CACHE_STRATEGY = {
    static: 'Cache-First',      // HTML, CSS, JS
    images: 'Cache-First',      // Imagens de exercícios
    api: 'Network-First',       // Dados dinâmicos
    offline: 'Cache-Only'       // Sessão ativa offline
};

// Background sync
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-workout-session') {
        event.waitUntil(syncWorkoutData());
    }
});
```

### Manifest
**Arquivo**: `frontend/public/manifest.json`

```json
{
    "name": "YouMove - Fitness AI",
    "short_name": "YouMove",
    "start_url": "/",
    "display": "standalone",
    "theme_color": "#3B82F6",
    "background_color": "#0B0E14",
    "icons": [
        {
            "src": "/icons/icon-192x192.png",
            "sizes": "192x192",
            "type": "image/png"
        },
        {
            "src": "/icons/icon-512x512.png",
            "sizes": "512x512",
            "type": "image/png"
        }
    ]
}
```

---

## 🎨 DESIGN SYSTEM

### Cores Principais
```css
/* Dark Theme */
--bg-primary: #0B0E14;      /* Background main */
--bg-secondary: #111318;    /* Sidebar */
--bg-card: #1F2937;         /* Cards */
--bg-input: #121214;        /* Inputs */

/* Text */
--text-primary: #FFFFFF;    /* Títulos */
--text-secondary: #9CA3AF; /* Subtítulos */
--text-muted: #6B7280;     /* Labels */

/* Brand */
--brand-primary: #3B82F6;   /* Blue */
--brand-secondary: #06B6D4; /* Cyan */
--brand-accent: #8B5CF6;    /* Purple */

/* Semantic */
--success: #10B981;
--warning: #F59E0B;
--error: #EF4444;
```

### Tipografia
```css
/* Font Family */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Scale */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
```

### Componentes Base
- **Button**: Variants (primary, secondary, ghost)
- **Card**: Rounded 2xl, subtle border, hover effects
- **Input**: Dark bg, blue focus ring
- **Modal**: Backdrop blur, center alignment
- **Toast**: Fixed bottom, slide-in animation

---

## 📊 FLUXOS PRINCIPAIS

### 1. Criar Treino com IA
```
1. User clica "Modo IA"
2. Seleciona: Equipamento, Foco Muscular, Duração, Intensidade, Tipo (Único/Semanal)
3. Clica "Gerar Treino com IA"
4. Frontend POST /api/workout/generate
5. Backend busca perfil do usuário no Supabase
6. Backend chama OpenAI com context completo
7. OpenAI retorna JSON de treino
8. Backend valida com safety-validator
9. Ajusta se necessário (safety limits)
10. Retorna treino para frontend
11. Salva em localStorage
12. Navega para /workout/ai-generated
13. User visualiza treino
14. User pode: Iniciar Agora | Salvar | Gerar Outro
```

### 2. Executar Sessão de Treino
```
1. User clica "Iniciar Agora" ou navega para /active-session/{workout_id}
2. Frontend busca workout do Supabase
3. Cria nova workout_session (started_at = now)
4. Exibe overview do treino
5. User clica "Começar Treino"
6. Para cada exercício:
   a. Exibe nome, séries, reps, descanso
   b. User completa série
   c. Timer de descanso inicia
   d. User marca série como completa
   e. Dados salvos em Zustand store
   f. Auto-save a cada 10s no localStorage (offline-first)
7. User finaliza último exercício
8. Calcula métricas: duração total, volume, calorias
9. Salva workout_session completa no Supabase
10. Navega para tela de resumo com confetti 🎉
```

### 3. Log de Refeição
```
1. User acessa /nutrition
2. Seleciona data (hoje/ontem/etc)
3. Clica em "+ Adicionar" em uma refeição (café/almoço/lanche/jantar)
4. Modal abre com:
   a. Campo de busca (procura em food_library)
   b. Formulário manual (nome, cals, proteína, carbos, gorduras)
   c. Checkbox "Salvar na biblioteca"
5. User preenche dados
6. Clica "Salvar Registro"
7. Frontend INSERT em nutrition_logs
8. Se checkbox marcado, UPSERT em food_library
9. Recalcula totais do dia
10. Atualiza UI com novos valores
```

---

## 🧪 TESTES

### Estrutura
```
tests/
├── unit/
│   ├── calculations.test.ts      # TDEE, macros, etc
│   ├── safety-limits.test.ts     # Validação de limites
│   └── workout-mapping.test.ts   # Mapeamento de exercícios
├── integration/
│   ├── api-workout.test.ts       # Testes de API
│   └── api-nutrition.test.ts     # Testes de API
└── e2e/
    ├── signup-flow.spec.ts       # Fluxo completo de cadastro
    ├── workout-creation.spec.ts  # Criar e executar treino
    └── nutrition-logging.spec.ts # Logar refeições
```

### Comandos
```bash
# Unit tests
npm run test

# E2E tests (quando implementado)
npx playwright test

# Coverage
npm run test:coverage
```

---

## 🚀 DEPLOY

### Vercel
**Configuração**: `vercel.json`

```json
{
    "buildCommand": "cd frontend && npm run build",
    "outputDirectory": "frontend/.next",
    "installCommand": "cd frontend && npm install",
    "framework": "nextjs"
}
```

### Variáveis de Ambiente
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx... # Server-side only

# OpenAI
OPENAI_API_KEY=sk-xxx...

# App
NEXT_PUBLIC_APP_URL=https://youmove-ochre.vercel.app
```

### Pipeline
```
1. git push origin main
2. Vercel detecta mudança
3. Instala dependências (frontend/)
4. Roda build (next build)
5. Deploy automático
6. URL de produção atualizada
```

---

## 📈 PERFORMANCE

### Métricas Atuais (Lighthouse)
- **Performance**: ~85 
- **Accessibility**: ~92
- **Best Practices**: ~95
- **SEO**: ~98

### Otimizações Aplicadas
- ✅ Next.js Image optimization
- ✅ Code splitting automático
- ✅ SSR para SEO-critical pages
- ✅ Client-side caching (SWR-like)
- ✅ Service Worker para assets estáticos

### Oportunidades de Melhoria
- 🔄 Lazy loading de imagens abaixo da dobra
- 🔄 Prefetch de páginas comuns
- 🔄 Reduzir bundle size (tree-shaking agressivo)
- 🔄 CDN para imagens de exercícios

---

## 🔍 MONITORAMENTO (Proposto)

### Sentry (Error Tracking)
```typescript
Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
});
```

### Vercel Analytics
```typescript
import { Analytics } from '@vercel/analytics/react';

export default function App() {
    return (
        <>
            <Component {...pageProps} />
            <Analytics />
        </>
    );
}
```

### Custom Events
```typescript
// Track workout completion
analytics.track('workout_completed', {
    workout_id: id,
    duration_minutes: duration,
    exercises_count: exercises.length,
});
```

---

## 📚 REFERÊNCIAS

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [OpenAI API](https://platform.openai.com/docs)
- [Wger API](https://wger.de/en/software/api)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)

---

**Última atualização**: 29/12/2024  
**Mantido por**: Equipe YouMove
