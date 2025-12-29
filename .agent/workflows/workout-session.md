---
description: Como executar a tela de treino (Workout Session) no YouMove
---

# Executar Treino - Workflow

## Fluxo do Usuário

1. **Acessar lista de treinos**
   - Navegar para `/workout`
   - Selecionar entre modo IA ou Manual

2. **Visualizar detalhes do treino**
   - Clicar em um treino existente
   - Será redirecionado para `/workout/[id]`
   - Ver lista de exercícios, tempo estimado, músculos alvo

3. **Iniciar sessão de treino**
   - Clicar no botão "Iniciar Sessão"
   - Será redirecionado para `/workout/session/[id]`

4. **Durante a execução**
   - Visualizar GIF animado do exercício atual
   - Receber micro-dicas da IA Coach
   - Informar repetições e carga realizadas
   - Clicar "Concluir Série" após cada série
   - Timer de descanso automático entre séries

5. **Finalizar treino**
   - Após a última série, modal de conclusão aparece
   - Clicar "Finalizar e Salvar"
   - Dados são salvos no Supabase
   - Redirecionado para Dashboard

## Arquivos Principais

### Frontend
- `src/app/(app)/workout/session/[id]/page.tsx` - Página principal de execução
- `src/components/workout/AICoachTip.tsx` - Componente de dicas da IA
- `src/components/workout/ExerciseGif.tsx` - Display de GIF do exercício
- `src/components/workout/RestTimer.tsx` - Timer circular de descanso
- `src/hooks/useAICoach.ts` - Hook para gerenciar dicas da IA

### APIs
- `src/app/api/workout/coach/route.ts` - Geração de micro-dicas via GPT-4o-mini
- `src/app/api/exercises/route.ts` - Busca exercícios da biblioteca local
- `src/app/api/exercises/sync/route.ts` - Sincroniza ExerciseDB → Supabase

### Banco de Dados
- `backend/supabase/migrations/007_exercise_library_external.sql` - Tabelas para biblioteca de exercícios, dicas de IA, e cache

## Variáveis de Ambiente Necessárias

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
RAPIDAPI_KEY= (opcional, para sincronizar ExerciseDB)
```

## Comandos

### 1. Executar Migração no Supabase
Execute o SQL do arquivo `backend/supabase/migrations/007_exercise_library_external.sql` no SQL Editor do Supabase.

### 2. Iniciar o servidor de desenvolvimento
// turbo
```bash
cd frontend && npm run dev
```

### 3. Sincronizar exercícios do ExerciseDB (primeira vez)
Execute esses comandos para popular a biblioteca de exercícios:

```bash
# Peito
curl -X POST http://localhost:3000/api/exercises/sync \
  -H "Content-Type: application/json" \
  -d '{"bodyPart": "chest", "limit": 50}'

# Costas
curl -X POST http://localhost:3000/api/exercises/sync \
  -H "Content-Type: application/json" \
  -d '{"bodyPart": "back", "limit": 50}'

# Pernas
curl -X POST http://localhost:3000/api/exercises/sync \
  -H "Content-Type: application/json" \
  -d '{"bodyPart": "upper legs", "limit": 50}'

# Ombros
curl -X POST http://localhost:3000/api/exercises/sync \
  -H "Content-Type: application/json" \
  -d '{"bodyPart": "shoulders", "limit": 50}'

# Braços
curl -X POST http://localhost:3000/api/exercises/sync \
  -H "Content-Type: application/json" \
  -d '{"bodyPart": "upper arms", "limit": 50}'
```

### 4. Verificar status da biblioteca
```bash
curl http://localhost:3000/api/exercises/sync
```

## Notas

- A tela funciona em modo foco (sem navegação principal)
- GIFs são preloaded para evitar delays
- Dicas da IA são limitadas a 1 linha para não atrapalhar
- Suporte a vibração háptica em dispositivos compatíveis
- Timer de descanso com notificação sonora/vibração
