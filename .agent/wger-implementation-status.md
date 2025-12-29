# 🏋️ Wger API Integration - Status & Implementation Plan

## 📊 Status Atual da Implementação

### ✅ Componentes Implementados

#### 1. **Serviços Core** (`/frontend/src/`)
- ✅ `/services/wger.ts` - Serviço principal com cache de 24h
- ✅ `/lib/wger.ts` - Biblioteca auxiliar com normalização e fallbacks
- ✅ `/lib/local-exercises.ts` - Exercícios locais como fallback
- ✅ `/lib/unsplash.ts` - Integração Unsplash para imagens

#### 2. **Hooks React**
- ✅ `/hooks/useWgerExercises.ts` - Hook customizado com debounce e filtros
- ✅ `useWgerExerciseById()` - Hook para buscar exercício específico

#### 3. **API Routes**
- ✅ `/app/api/exercises/route.ts` - GET /api/exercises (lista)
- ✅ `/app/api/exercises/[id]/route.ts` - GET /api/exercises/:id (detalhes)
- ✅ Cache de 24h configurado
- ✅ Graceful degradation

#### 4. **Componentes UI**
- ✅ `/components/wger/ExerciseComponents.tsx` - Componentes completos
  - ExerciseCard
  - ExerciseGrid
  - ExerciseSearch
  - ExerciseBrowser
  - ExerciseModal
- ✅ `/components/ExerciseImage.tsx` - Componente de imagem com fallback

#### 5. **Páginas de Exemplo**
- ✅ `/app/(app)/exercises/library/page.tsx` - Biblioteca completa
- ✅ `/services/wger.examples.tsx` - Exemplos de uso

#### 6. **Documentação**
- ✅ `/docs/WGER_INTEGRATION.md` - Documentação completa (518 linhas)

---

## 🎯 Análise da Implementação Atual

### Pontos Fortes
1. **Arquitetura Robusta**: Separação clara entre serviços, hooks e componentes
2. **Cache Agressivo**: 24h de cache com ISR do Next.js
3. **Validação com Zod**: Type-safe e validação em runtime
4. **Graceful Degradation**: Sistema de fallback em múltiplas camadas
5. **TypeScript**: Totalmente tipado
6. **Documentação**: Excelente documentação com exemplos

### Sistema de Fallback (Prioridades)
```
1. Local Images (local-exercises.ts)
   ↓
2. Wger Direct ID Mapping (EXERCISE_ID_MAP)
   ↓
3. Wger Search API
   ↓
4. Unsplash API
   ↓
5. Icon Fallback (UI)
```

---

## 🔍 Problemas Identificados

### 1. **Endpoint Inconsistente**
**Problema**: Dois serviços diferentes usando endpoints diferentes:
- `/services/wger.ts` usa `/exerciseinfo/` (correto, retorna dados localizados)
- `/lib/wger.ts` usa `/exercise/` (antigo, não retorna name/description localizados)

**Impacto**: Confusão e possível duplicação de código

**Solução**: Consolidar em um único serviço

### 2. **Duplicação de Código**
**Problema**: Lógica duplicada entre:
- `getWgerExercises()` em `/services/wger.ts`
- `searchExercisesByName()` em `/lib/wger.ts`
- `getExerciseInfo()` em `/lib/wger.ts`

**Solução**: Refatorar para usar um único serviço centralizado

### 3. **Mapeamento de IDs Hardcoded**
**Problema**: `EXERCISE_ID_MAP` em `/lib/wger.ts` tem IDs hardcoded que podem estar desatualizados

**Exemplo**:
```typescript
'Pull-up': 73,  // Usando bench press como temp!
'Lat Pulldown': 73, // Mesmo ID para exercícios diferentes
```

**Solução**: Criar sistema dinâmico de mapeamento ou atualizar IDs

### 4. **Falta de Sincronização com Supabase**
**Problema**: Exercícios Wger não estão sendo sincronizados com a tabela `exercises` do Supabase

**Impacto**: 
- Dados duplicados
- Falta de consistência
- Não aproveita RLS do Supabase

**Solução**: Implementar sincronização automática

### 5. **Limite de Resultados**
**Problema**: API retorna apenas 100 exercícios (`limit: 100`)

**Solução**: Implementar paginação ou aumentar limite

---

## 🚀 Plano de Implementação

### Fase 1: Consolidação e Limpeza ⚡ (Prioridade Alta)

#### 1.1 Unificar Serviços
- [ ] Consolidar `/services/wger.ts` e `/lib/wger.ts` em um único serviço
- [ ] Manter apenas `/services/wger.ts` como fonte única de verdade
- [ ] Migrar funções úteis de `/lib/wger.ts` para o serviço principal
- [ ] Atualizar imports em todos os arquivos

#### 1.2 Atualizar Mapeamento de IDs
- [ ] Pesquisar IDs corretos na API Wger para exercícios comuns
- [ ] Criar script para validar IDs automaticamente
- [ ] Documentar IDs verificados
- [ ] Implementar cache de IDs

#### 1.3 Melhorar Sistema de Cache
- [ ] Implementar cache em memória para IDs de exercícios
- [ ] Adicionar IndexedDB para cache offline
- [ ] Implementar estratégia de cache-first

### Fase 2: Sincronização com Supabase 🔄 (Prioridade Alta)

#### 2.1 Criar Tabela de Sincronização
```sql
CREATE TABLE wger_exercises (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  name_pt TEXT,
  description TEXT,
  image_url TEXT,
  category INTEGER,
  muscles INTEGER[],
  equipment INTEGER[],
  last_synced TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2.2 Implementar Serviço de Sincronização
- [ ] Criar `/services/wger-sync.ts`
- [ ] Implementar função `syncWgerToSupabase()`
- [ ] Criar cron job ou API route para sincronização periódica
- [ ] Implementar merge inteligente (não sobrescrever customizações)

#### 2.3 Atualizar API Routes
- [ ] Modificar `/api/exercises/route.ts` para buscar do Supabase primeiro
- [ ] Fallback para Wger se não encontrar no Supabase
- [ ] Implementar estratégia híbrida

### Fase 3: Melhorias de Performance 🚀 (Prioridade Média)

#### 3.1 Paginação
- [ ] Implementar paginação infinita no frontend
- [ ] Criar endpoint `/api/exercises/paginated`
- [ ] Otimizar queries no Supabase

#### 3.2 Busca Avançada
- [ ] Implementar busca full-text no Supabase
- [ ] Adicionar filtros por:
  - Grupo muscular
  - Equipamento
  - Dificuldade
  - Tipo de movimento

#### 3.3 Imagens
- [ ] Implementar lazy loading de imagens
- [ ] Adicionar placeholder blur
- [ ] Otimizar com Next.js Image
- [ ] Criar sistema de upload de imagens customizadas

### Fase 4: Features Avançadas 🎨 (Prioridade Baixa)

#### 4.1 Favoritos
- [ ] Criar tabela `user_favorite_exercises`
- [ ] Implementar toggle de favoritos
- [ ] Filtro "Meus Favoritos"

#### 4.2 Exercícios Customizados
- [ ] Permitir usuários criarem exercícios próprios
- [ ] Merge com exercícios Wger
- [ ] Sistema de aprovação/moderação

#### 4.3 Analytics
- [ ] Rastrear exercícios mais usados
- [ ] Sugerir exercícios baseado em histórico
- [ ] Insights de progresso

---

## 📋 Checklist de Implementação Imediata

### Próximos Passos (Hoje)

1. **Consolidar Serviços**
   - [ ] Revisar `/services/wger.ts` e `/lib/wger.ts`
   - [ ] Decidir qual manter como principal
   - [ ] Criar `/services/wger-unified.ts` com melhor de ambos
   - [ ] Atualizar todos os imports

2. **Testar API Atual**
   - [ ] Testar `/api/exercises` no navegador
   - [ ] Verificar cache funcionando
   - [ ] Testar filtros e busca
   - [ ] Validar imagens carregando

3. **Criar Script de Sincronização**
   - [ ] Criar `/scripts/sync-wger.ts`
   - [ ] Implementar lógica de sincronização
   - [ ] Testar com dados reais
   - [ ] Documentar processo

4. **Atualizar Documentação**
   - [ ] Atualizar `/docs/WGER_INTEGRATION.md`
   - [ ] Adicionar troubleshooting
   - [ ] Documentar decisões arquiteturais

---

## 🧪 Testes Necessários

### Testes Unitários
- [ ] Testar `getWgerExercises()`
- [ ] Testar `getWgerExerciseById()`
- [ ] Testar normalização de nomes
- [ ] Testar sistema de fallback

### Testes de Integração
- [ ] Testar API routes
- [ ] Testar hooks React
- [ ] Testar componentes UI
- [ ] Testar sincronização Supabase

### Testes E2E
- [ ] Testar fluxo completo de busca
- [ ] Testar seleção de exercício
- [ ] Testar adição ao treino
- [ ] Testar offline/online

---

## 📊 Métricas de Sucesso

- ✅ 100% dos exercícios com imagens válidas
- ✅ Tempo de resposta < 100ms (cache hit)
- ✅ Sincronização automática funcionando
- ✅ Zero erros em produção
- ✅ Cobertura de testes > 80%

---

## 🔗 Recursos

- [Wger API Docs](https://wger.de/en/software/api)
- [Next.js Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [Supabase Docs](https://supabase.com/docs)
- [Zod Documentation](https://zod.dev/)

---

**Última Atualização**: 2025-12-27
**Status**: 🟡 Em Implementação
**Prioridade**: 🔥 Alta
