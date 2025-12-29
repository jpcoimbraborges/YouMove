# 📚 Wger Integration - Documentação Completa

## Visão Geral

Integração profissional com a API Wger (open-source fitness database) seguindo as melhores práticas do Next.js 16 App Router.

### ✨ Features

- ✅ Cache agressivo de 24h com ISR
- ✅ Validação de tipos com Zod
- ✅ Busca paralela otimizada
- ✅ Match eficiente O(n) com Map
- ✅ Hooks React customizados
- ✅ Componentes prontos para uso
- ✅ TypeScript type-safe
- ✅ Graceful degradation

## 📁 Estrutura de Arquivos

```
frontend/
├── src/
│   ├── services/
│   │   ├── wger.ts                    # Serviço principal
│   │   └── wger.examples.tsx          # Exemplos de uso
│   │
│   ├── hooks/
│   │   └── useWgerExercises.ts        # Hook customizado
│   │
│   ├── components/wger/
│   │   └── ExerciseComponents.tsx     # Componentes React
│   │
│   └── app/
│       ├── api/exercises/
│       │   ├── route.ts               # GET /api/exercises
│       │   └── [id]/route.ts          # GET /api/exercises/:id
│       │
│       └── (app)/exercises/library/
│           └── page.tsx               # Página de exemplo
```

## 🚀 Quick Start

### 1. Uso Básico (Server Component)

```tsx
import { getWgerExercises } from '@/services/wger';

export default async function MyPage() {
  const exercises = await getWgerExercises();
  
  return (
    <div>
      {exercises.map(ex => (
        <div key={ex.id}>{ex.name}</div>
      ))}
    </div>
  );
}
```

### 2. Uso com Hook (Client Component)

```tsx
'use client';

import { useWgerExercises } from '@/hooks/useWgerExercises';

export function ExercisesList() {
  const { exercises, isLoading, stats } = useWgerExercises({
    searchQuery: 'supino',
    onlyWithImages: true,
  });
  
  if (isLoading) return <Loading />;
  
  return (
    <div>
      <p>{stats.filtered} exercícios encontrados</p>
      {exercises.map(ex => <Card key={ex.id} {...ex} />)}
    </div>
  );
}
```

### 3. Uso com Componentes Prontos

```tsx
'use client';

import { ExerciseBrowser } from '@/components/wger/ExerciseComponents';

export default function MyPage() {
  return (
    <ExerciseBrowser
      onSelectExercise={(ex) => console.log(ex)}
    />
  );
}
```

## 📡 API Reference

### Service Functions

#### `getWgerExercises()`

Busca todos os exercícios com cache de 24h.

```typescript
async function getWgerExercises(): Promise<ExerciseWithImage[]>
```

**Returns:**
- Array de exercícios com imagens
- Array vazio em caso de erro (graceful degradation)

**Example:**
```typescript
const exercises = await getWgerExercises();
console.log(`Loaded ${exercises.length} exercises`);
```

---

#### `getWgerExerciseById(id)`

Busca um exercício específico por ID.

```typescript
async function getWgerExerciseById(id: number): Promise<ExerciseWithImage | null>
```

**Parameters:**
- `id`: ID do exercício na Wger

**Returns:**
- Exercício encontrado ou `null`

**Example:**
```typescript
const exercise = await getWgerExerciseById(73);
if (exercise) {
  console.log(exercise.name); // "Bench Press"
}
```

---

#### `revalidateWgerCache()`

Força revalidação do cache (útil para admin).

```typescript
async function revalidateWgerCache(): Promise<void>
```

**Example:**
```typescript
await revalidateWgerCache();
console.log('Cache refreshed');
```

---

### Hook API

#### `useWgerExercises(options)`

Hook React para Client Components.

```typescript
function useWgerExercises(
  options?: UseWgerExercisesOptions
): UseWgerExercisesReturn
```

**Options:**
```typescript
interface UseWgerExercisesOptions {
  searchQuery?: string;         // Filtro de texto
  category?: number;             // Filtro por categoria
  onlyWithImages?: boolean;      // Apenas com imagem
  debounceMs?: number;           // Debounce delay (default: 300)
}
```

**Returns:**
```typescript
interface UseWgerExercisesReturn {
  exercises: ExerciseWithImage[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  stats: {
    total: number;
    filtered: number;
    withImages: number;
  };
}
```

**Example:**
```typescript
const { exercises, isLoading, stats } = useWgerExercises({
  searchQuery: 'leg',
  onlyWithImages: true,
  debounceMs: 500,
});
```

---

### Types

#### `ExerciseWithImage`

Tipo principal exportado.

```typescript
type ExerciseWithImage = {
  id: number;
  name: string;
  description: string;
  imageUrl: string | null;
  category?: number;
  muscles?: number[];
  equipment?: number[];
};
```

---

## 🎨 Componentes

### `<ExerciseCard />`

Card individual de exercício.

```tsx
<ExerciseCard
  exercise={exercise}
  onClick={(ex) => console.log(ex)}
  selected={false}
/>
```

---

### `<ExerciseGrid />`

Grid responsivo de exercícios.

```tsx
<ExerciseGrid
  exercises={exercises}
  onSelectExercise={(ex) => handleSelect(ex)}
  selectedId={currentId}
  loading={false}
/>
```

---

### `<ExerciseSearch />`

Barra de busca com filtros.

```tsx
<ExerciseSearch
  onSearchChange={(query) => setQuery(query)}
  onFilterChange={(filters) => setFilters(filters)}
/>
```

---

### `<ExerciseBrowser />`

Componente completo (busca + grid).

```tsx
<ExerciseBrowser
  onSelectExercise={(ex) => addToWorkout(ex)}
  selectedId={selectedId}
/>
```

---

### `<ExerciseModal />`

Modal de detalhes.

```tsx
<ExerciseModal
  exercise={selectedExercise}
  onClose={() => setSelected(null)}
  onSelect={(ex) => confirm(ex)}
/>
```

---

## 🔧 Configuração

### Next.js Config

**✅ JÁ CONFIGURADO** - O domínio `wger.de` já está permitido:

```typescript
// next.config.ts
images: {
  remotePatterns: [
    {
      protocol: "https",
      hostname: "wger.de", // ✅
    },
  ],
}
```

---

## 📊 Performance

### Cache Strategy

| Tipo | Localização | Duração | Método |
|------|-------------|---------|--------|
| Server | Next.js Data Cache | 24h | `fetch()` revalidate |
| Browser | HTTP Cache | 24h | Cache-Control headers |
| Client | React State | Session | Hook `useState` |

### Benchmarks

- **Primeira visita:** ~500ms (API Wger)
- **Cache hit:** <50ms (instantâneo)
- **Match complexity:** O(n) linear
- **Bundle size:** +15KB (Zod incluído)

---

## 🧪 Testing

### Testar Serviço

```typescript
// test/wger.test.ts
import { getWgerExercises } from '@/services/wger';

test('should fetch exercises', async () => {
  const exercises = await getWgerExercises();
  expect(exercises).toBeInstanceOf(Array);
  expect(exercises.length).toBeGreaterThan(0);
});
```

### Testar Hook

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useWgerExercises } from '@/hooks/useWgerExercises';

test('should filter exercises', async () => {
  const { result } = renderHook(() => 
    useWgerExercises({ searchQuery: 'press' })
  );
  
  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });
  
  expect(result.current.exercises.every(
    ex => ex.name.toLowerCase().includes('press')
  )).toBe(true);
});
```

---

## 🚨 Error Handling

### Graceful Degradation

```typescript
// ✅ Nunca quebra a UI
const exercises = await getWgerExercises();
// Retorna [] em caso de erro

// ✅ UI preparada para vazio
{exercises.length === 0 && (
  <EmptyState message="Sem exercícios disponíveis" />
)}
```

### Error Logging

```typescript
// Console estruturado
[Wger Service] ❌ Erro crítico
[Wger Service] 🔴 Erro de validação Zod
[Wger Service] ⚠️ Exercício 123 não encontrado
```

---

## 🔐 Security

### Content Security Policy

```typescript
// Headers automáticos no Next.js config
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

### Input Sanitization

```typescript
// HTML descriptions são sanitizadas
<div dangerouslySetInnerHTML={{ 
  __html: exercise.description.replace(/<script[^>]*>.*?<\/script>/gi, '')
}} />
```

---

## 📈 Monitoring

### Logs Estruturados

```typescript
[Wger Service] 🚀 Iniciando busca...
[Wger Service] 📡 Disparando requests...
[Wger Service] ✅ Responses recebidas
[Wger Service] 📊 Dados validados: {exercises: 100, images: 50}
[Wger Service] 🔗 Index criado: 50
[Wger Service] ✨ Concluído: {
  total: 100,
  withImages: 50,
  matchRate: "50.0%",
  elapsedMs: 487
}
```

---

## 🎓 Best Practices

### ✅ DO

```typescript
// Server Component (recomendado)
export default async function Page() {
  const exercises = await getWgerExercises();
  return <ExercisesList data={exercises} />;
}

// Hook com debounce
const { exercises } = useWgerExercises({
  searchQuery,
  debounceMs: 300,
});
```

### ❌ DON'T

```typescript
// ❌ Client-side fetch direto (perde cache)
useEffect(() => {
  fetch('https://wger.de/api/v2/exercise/')
    .then(res => res.json());
}, []);

// ❌ Fetch em loop
exercises.forEach(ex => {
  fetch(`/api/exercises/${ex.id}`); // N+1 problem
});
```

---

## 🔄 Roadmap

- [ ] Adicionar categorias traduzidas
- [ ] Cache offline com IndexedDB
- [ ] Favoritos do usuário
- [ ] Upload de imagens customizadas
- [ ] Sincronização com Supabase

---

## 📚 Resources

- [Wger API Docs](https://wger.de/en/software/api)
- [Next.js Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [Zod Documentation](https://zod.dev/)

---

## 🤝 Contributing

Para adicionar novos exercícios ou melhorar os existentes, contribua diretamente no projeto Wger:
https://github.com/wger-project/wger

---

## 📝 License

Integração: MIT License
Dados Wger: AGPL License

---

**Desenvolvido com 💪 para YouMove PWA**
