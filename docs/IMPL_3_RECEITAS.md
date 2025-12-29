# 🍎 IMPLEMENTAÇÃO 3: Receitas Saudáveis

**Status**: 🚧 Em andamento  
**Estimativa**: 6-8h  
**Prioridade**: Alta

---

## 📋 OBJETIVO

Criar uma biblioteca de receitas saudáveis com cálculo automático de macros, filtros por objetivo fitness e modo de preparo detalhado, facilitando a aderência à dieta do usuário.

---

## 🎯 FEATURES PRINCIPAIS

### 1. **Biblioteca de Receitas**
- 20-30 receitas pré-cadastradas
- Categorizadas por:
  - Tipo de refeição (café, almoço, jantar, lanche, pré-treino, pós-treino)
  - Objetivo (cutting, bulking, balanced)
  - Tempo de preparo (rápido <15min, médio 15-30min, demorado >30min)
  - Nível de dificuldade (fácil, médio, difícil)

### 2. **Informações por Receita**
- ✅ Nome e descrição
- ✅ Foto (placeholder ou gerada com IA)
- ✅ Macros totais (calorias, proteína, carbos, gorduras)
- ✅ Lista de ingredientes com quantidades
- ✅ Modo de preparo passo-a-passo
- ✅ Tempo de preparo
- ✅ Rendimento (porções)
- ✅ Tags (low-carb, high-protein, vegetariano, etc)

### 3. **Filtros e Busca**
- Busca por nome
- Filtro por tipo de refeição
- Filtro por objetivo
- Filtro por tempo de preparo
- Filtro por tags
- Ordenação (popularidade, calorias, proteína)

### 4. **Detalhes da Receita**
- Visualização completa
- Macros por porção
- Botão "Adicionar ao Diário"
- Botão "Favoritar"
- Contador de views

---

## 🗄️ SCHEMA DO BANCO DE DADOS

### Tabela: `recipes`
```sql
CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    
    -- Macros (por porção)
    calories_per_serving INT NOT NULL,
    protein_g_per_serving DECIMAL NOT NULL,
    carbs_g_per_serving DECIMAL NOT NULL,
    fats_g_per_serving DECIMAL NOT NULL,
    fiber_g_per_serving DECIMAL DEFAULT 0,
    
    -- Metadata
    servings INT NOT NULL DEFAULT 1,
    prep_time_minutes INT,
    difficulty TEXT, -- 'easy', 'medium', 'hard'
    meal_type TEXT[], -- ['breakfast', 'lunch', 'dinner', 'snack']
    goal_type TEXT[], -- ['cutting', 'bulking', 'balanced']
    tags TEXT[], -- ['high-protein', 'low-carb', 'vegetarian', 'quick']
    
    -- Conteúdo
    ingredients JSONB, -- [{ name, quantity, unit }]
    instructions TEXT[], -- Array de passos
    
    -- Stats
    views INT DEFAULT 0,
    favorites INT DEFAULT 0,
    
    -- Admin
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_recipes_meal_type ON recipes USING GIN (meal_type);
CREATE INDEX idx_recipes_goal_type ON recipes USING GIN (goal_type);
CREATE INDEX idx_recipes_tags ON recipes USING GIN (tags);
CREATE INDEX idx_recipes_calories ON recipes (calories_per_serving);
CREATE INDEX idx_recipes_protein ON recipes (protein_g_per_serving DESC);

-- RLS Policy (público para leitura)
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recipes readable by all"
ON recipes FOR SELECT
USING (is_active = true);

-- Admin only write (futuro)
CREATE POLICY "Recipes writable by admin"
ON recipes FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');
```

### Tabela: `recipe_favorites` (Opcional - Futuro)
```sql
CREATE TABLE recipe_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, recipe_id)
);
```

---

## 📊 DADOS INICIAIS

### Exemplo de Receita
```json
{
    "name": "Omelete de Claras com Espinafre",
    "description": "Proteína limpa e rápida, perfeita para qualquer refeição",
    "image_url": "/recipes/omelet-spinach.jpg",
    "calories_per_serving": 180,
    "protein_g_per_serving": 28,
    "carbs_g_per_serving": 5,
    "fats_g_per_serving": 6,
    "fiber_g_per_serving": 2,
    "servings": 1,
    "prep_time_minutes": 10,
    "difficulty": "easy",
    "meal_type": ["breakfast", "lunch", "snack"],
    "goal_type": ["cutting", "balanced"],
    "tags": ["high-protein", "low-carb", "quick", "vegetarian"],
    "ingredients": [
        { "name": "Claras de ovo", "quantity": 4, "unit": "unidades" },
        { "name": "Espinafre fresco", "quantity": 1, "unit": "xícara" },
        { "name": "Cebola picada", "quantity": 2, "unit": "colheres de sopa" },
        { "name": "Azeite", "quantity": 1, "unit": "colher de chá" },
        { "name": "Sal e pimenta", "quantity": null, "unit": "a gosto" }
    ],
    "instructions": [
        "Bata as claras em uma tigela com sal e pimenta",
        "Aqueça uma frigideira antiaderente em fogo médio com o azeite",
        "Refogue a cebola até dourar",
        "Adicione o espinafre e cozinhe até murchar",
        "Despeje as claras batidas sobre os vegetais",
        "Deixe cozinhar por 3-4 minutos até firmar",
        "Dobre ao meio e sirva imediatamente"
    ]
}
```

---

## 🎨 UI/UX DESIGN

### Página: `/recipes` (Nova)

#### Layout Desktop
```
┌─────────────────────────────────────────────────┐
│  Receitas Saudáveis                [🔍] [Filtros]
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│  │ 🍳      │  │ 🥗      │  │ 🍗      │         │
│  │ Omelete │  │ Salada  │  │ Frango │         │
│  │ Proteico│  │ Caesar  │  │ Grelhado│         │
│  │         │  │         │  │         │         │
│  │ 180 kcal│  │ 320 kcal│  │ 280 kcal│         │
│  │ 28g P   │  │ 18g P   │  │ 45g P   │         │
│  │         │  │         │  │         │         │
│  │ ⏱ 10min │  │ ⏱ 15min │  │ ⏱ 20min │         │
│  │ [Ver]   │  │ [Ver]   │  │ [Ver]   │         │
│  └─────────┘  └─────────┘  └─────────┘         │
│                                                 │
│  ... mais receitas ...                          │
└─────────────────────────────────────────────────┘
```

#### Detalhe da Receita (Modal ou Página)
```
┌─────────────────────────────────────────────────┐
│  ← Voltar        Omelete de Claras              │
│                                                 │
│  ┌─────────────────────────────────┐           │
│  │         [Imagem da Receita]     │           │
│  └─────────────────────────────────┘           │
│                                                 │
│  Proteína limpa e rápida, perfeita para        │
│  qualquer refeição                              │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ MACROS (1 porção)                        │  │
│  │ ▓▓▓ 180 kcal | 28g P | 5g C | 6g G      │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ⏱ 10 min | 🍴 1 porção | 😊 Fácil             │
│                                                 │
│  [Alta Proteína] [Low Carb] [Rápido]           │
│                                                 │
│  ═══════════════════════════════════════════   │
│  INGREDIENTES                                   │
│  • 4 claras de ovo                              │
│  • 1 xícara de espinafre fresco                 │
│  • 2 colheres de sopa de cebola picada          │
│  • 1 colher de chá de azeite                    │
│  • Sal e pimenta a gosto                        │
│                                                 │
│  ═══════════════════════════════════════════   │
│  MODO DE PREPARO                                │
│  1. Bata as claras em uma tigela               │
│  2. Aqueça uma frigideira com azeite           │
│  3. ...                                          │
│                                                 │
│  [+ Adicionar ao Diário] [⭐ Favoritar]         │
└─────────────────────────────────────────────────┘
```

---

## 🛠️ ARQUITETURA TÉCNICA

### Componentes a Criar

#### 1. Página: `/recipes/page.tsx`
- Grid de receitas
- Barra de busca
- Filtros (sidebar ou modal)
- Loading states

#### 2. Component: `RecipeCard.tsx`
```typescript
interface RecipeCardProps {
    recipe: Recipe;
    onClick: (id: string) => void;
}
```

#### 3. Modal/Página: `RecipeDetailModal.tsx`
```typescript
interface RecipeDetailModalProps {
    recipeId: string;
    onClose: () => void;
    onAddToDiary: (recipe: Recipe) => void;
}
```

#### 4. Component: `RecipeFilters.tsx`
```typescript
interface RecipeFiltersProps {
    filters: RecipeFilters;
    onFilterChange: (filters: RecipeFilters) => void;
}

interface RecipeFilters {
    mealType?: string;
    goalType?: string;
    maxCalories?: number;
    minProtein?: number;
    maxPrepTime?: number;
    tags?: string[];
    searchQuery?: string;
}
```

#### 5. Utility: `recipeUtils.ts`
```typescript
// Calculate macros for custom servings
export function calculateMacrosForServings(recipe: Recipe, servings: number);

// Filter recipes
export function filterRecipes(recipes: Recipe[], filters: RecipeFilters);

// Sort recipes
export function sortRecipes(recipes: Recipe[], sortBy: 'calories' | 'protein' | 'prep_time');
```

---

## 🚀 PLANO DE EXECUÇÃO

### Fase 1: Database Setup (1h)
1. Criar migration SQL para tabela `recipes`
2. Executar no Supabase
3. Seed com 10 receitas iniciais

### Fase 2: Data & Types (1h)
4. Criar tipos TypeScript (`Recipe`, `RecipeFilters`, etc)
5. Criar função de seed com 20 receitas completas
6. Popular banco de dados

### Fase 3: Backend/API (1h)
7. Criar API route `/api/recipes` (GET com filtros)
8. Criar API route `/api/recipes/[id]` (GET detalhes)
9. Testar com Postman/Thunder Client

### Fase 4: UI Components (2h)
10. Criar `RecipeCard.tsx`
11. Criar `RecipeDetailModal.tsx`
12. Criar `RecipeFilters.tsx`
13. Criar utility functions

### Fase 5: Main Page (1h)
14. Criar `/recipes/page.tsx`
15. Integrar busca e filtros
16. Loading e empty states

### Fase 6: Integration (1h)
17. Botão "Adicionar ao Diário" → Insert em `nutrition_logs`
18. Link da página de nutrição para recipes
19. Widget no dashboard (sugestão de receita do dia)

### Revisão & Polish (1h)
20. Testar todos os fluxos
21. Ajustar responsividade
22. Deploy

---

## 📝 RECEITAS INICIAIS (Top 20)

### Café da Manhã
1. Omelete de Claras com Espinafre
2. Panqueca de Aveia e Banana
3. Iogurte Grego com Frutas Vermelhas
4. Tapioca com Queijo Cottage
5. Smoothie de Proteína Verde

### Almoço/Jantar
6. Frango Grelhado com Batata Doce
7. Salmão com Aspargos
8. Carne Moída Magra com Arroz Integral
9. Salada Caesar com Frango
10. Filé de Tilápia com Legumes

### Lanches
11. Pasta de Amendoim com Maçã
12. Ovos Cozidos
13. Queijo Cottage com Pepino
14. Protein Shake de Chocolate
15. Wrap de Peru e Vegetais

### Pré-Treino
16. Banana com Aveia
17. Rice Cakes com Pasta de Amendoim
18. Batata Doce Assada

### Pós-Treino
19. Frango com Arroz Branco
20. Shake de Whey com Banana

---

## ✅ CRITÉRIOS DE ACEITAÇÃO

- [ ] Banco de dados criado e populado com 20 receitas
- [ ] Página `/recipes` funcional com grid
- [ ] Busca por nome funcionando
- [ ] Filtros por tipo de refeição e objetivo
- [ ] Modal de detalhes exibindo todas as informações
- [ ] Botão "Adicionar ao Diário" integrado
- [ ] Macros calculados corretamente por porção
- [ ] Responsivo em mobile e desktop
- [ ] Loading states e empty states
- [ ] Imagens de receitas (placeholders ou geradas)

---

## 🎨 DESIGN TOKENS

### Cores por Objetivo
```css
.goal-cutting {
    color: #10B981; /* Green */
    background: rgba(16, 185, 129, 0.1);
}

.goal-bulking {
    color: #F59E0B; /* Orange */
    background: rgba(245, 158, 11, 0.1);
}

.goal-balanced {
    color: #3B82F6; /* Blue */
    background: rgba(59, 130, 246, 0.1);
}
```

### Macros Bar
```tsx
<div className="flex gap-2">
    <div className="flex-1 flex items-center gap-2">
        <Flame size={14} className="text-orange-400" />
        <span>{calories} kcal</span>
    </div>
    <div className="flex-1 flex items-center gap-2">
        <Beef size={14} className="text-red-400" />
        <span>{protein}g P</span>
    </div>
    <div className="flex-1 flex items-center gap-2">
        <Wheat size={14} className="text-yellow-400" />
        <span>{carbs}g C</span>
    </div>
    <div className="flex-1 flex items-center gap-2">
        <Droplet size={14} className="text-purple-400" />
        <span>{fats}g G</span>
    </div>
</div>
```

---

**Começar Fase 1: Database Setup?** Responda "sim" para criar a migration SQL.
