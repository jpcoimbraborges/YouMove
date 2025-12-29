# 🏋️ Wger API Integration - Quick Start Guide

## 🚀 Início Rápido

### 1. Executar Migration no Supabase

```bash
# 1. Acesse o Supabase Dashboard
# 2. Vá em SQL Editor
# 3. Execute o arquivo:
backend/supabase/migrations/004_wger_exercises.sql
```

### 2. Configurar Variáveis de Ambiente

Certifique-se de que o arquivo `.env.local` contém:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Instalar Dependências (se necessário)

```bash
cd frontend
npm install tsx --save-dev
```

### 4. Executar Primeira Sincronização

```bash
# Teste primeiro (não salva no banco)
npm run sync:wger -- --dry-run

# Se estiver OK, execute de verdade
npm run sync:wger
```

### 5. Testar a API

```bash
# Abra o navegador em:
http://localhost:3000/api/exercises

# Ou teste com curl:
curl http://localhost:3000/api/exercises | jq
```

---

## 📖 Exemplos de Uso

### Server Component

```tsx
import { getWgerExercises } from '@/services/wger-unified';

export default async function Page() {
  const exercises = await getWgerExercises();
  return <div>{exercises.length} exercícios</div>;
}
```

### Client Component

```tsx
'use client';
import { useWgerExercises } from '@/hooks/useWgerExercises';

export function List() {
  const { exercises, isLoading } = useWgerExercises({
    searchQuery: 'supino',
    onlyWithImages: true,
  });
  
  if (isLoading) return <div>Carregando...</div>;
  return <div>{exercises.map(ex => <div key={ex.id}>{ex.name}</div>)}</div>;
}
```

### API Calls

```bash
# Lista todos
GET /api/exercises

# Com busca
GET /api/exercises?search=bench

# Com filtros
GET /api/exercises?category=14&onlyWithImages=true&limit=50

# Por ID
GET /api/exercises/73
```

---

## 🔧 Scripts Disponíveis

```bash
# Sincronizar exercícios Wger → Supabase
npm run sync:wger

# Teste (dry-run)
npm run sync:wger -- --dry-run

# Desenvolvimento
npm run dev

# Build
npm run build
```

---

## 📊 Estrutura de Dados

### ExerciseWithImage

```typescript
{
  id: number;              // ID da Wger
  name: string;            // Nome (geralmente EN/ES)
  description: string;     // Descrição
  imageUrl: string | null; // URL da imagem
  category?: number;       // ID da categoria
  muscles?: number[];      // IDs dos músculos
  equipment?: number[];    // IDs dos equipamentos
}
```

### Categorias Wger

```
8  = Arms (Braços)
10 = Legs (Pernas)
11 = Abs (Abdômen)
12 = Back (Costas)
13 = Shoulders (Ombros)
14 = Chest (Peito)
15 = Calves (Panturrilhas)
```

---

## 🐛 Troubleshooting

### Erro: "Module not found: Can't resolve '@/services/wger-unified'"

**Solução**: Reinicie o servidor Next.js

```bash
# Pare o servidor (Ctrl+C)
npm run dev
```

### Erro: "SUPABASE_SERVICE_ROLE_KEY is not defined"

**Solução**: Adicione a chave no `.env.local`

```env
SUPABASE_SERVICE_ROLE_KEY=your_key_here
```

### Erro: "relation 'wger_exercises' does not exist"

**Solução**: Execute a migration no Supabase

```bash
# No Supabase Dashboard > SQL Editor
# Execute: backend/supabase/migrations/004_wger_exercises.sql
```

### Nenhum exercício retornado

**Solução**: Execute a sincronização

```bash
npm run sync:wger
```

---

## 📚 Documentação Completa

- **Implementação Completa**: `.agent/wger-implementation-complete.md`
- **Status e Planejamento**: `.agent/wger-implementation-status.md`
- **Documentação Original**: `docs/WGER_INTEGRATION.md`

---

## ✅ Checklist de Setup

- [ ] Migration executada no Supabase
- [ ] Variáveis de ambiente configuradas
- [ ] Dependências instaladas (`tsx`)
- [ ] Primeira sincronização executada
- [ ] API testada (`/api/exercises`)
- [ ] Página de exemplo testada (`/exercises/library`)

---

## 🎯 Próximos Passos

1. ✅ **Executar migration** no Supabase
2. ✅ **Executar sincronização** inicial
3. ✅ **Testar API** no navegador
4. ✅ **Testar página** `/exercises/library`
5. 🔄 **Agendar sincronização** periódica (opcional)

---

**Pronto para usar! 🚀**
