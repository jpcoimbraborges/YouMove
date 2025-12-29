# 🍽️ Biblioteca de Alimentos e Edição - Implementado

## ✅ O que foi implementado:

### 1. **Banco de Dados - Tabela `food_library`**
Criada nova tabela para armazenar alimentos salvos:
- ✅ `id` - Identificador único
- ✅ `user_id` - Usuário dono do alimento
- ✅ `name` - Nome do alimento (único por usuário)
- ✅ `calories`, `protein_g`, `carbs_g`, `fats_g` - Informações nutricionais
- ✅ `serving_size` - Tamanho da porção (ex: "100g", "1 unidade")
- ✅ `category` - Categoria (proteína, carboidrato, fruta, etc.)
- ✅ `is_favorite` - Marcar favoritos
- ✅ `usage_count` - Contador de uso (para ordenar por mais usados)
- ✅ RLS Policies - Segurança por usuário

### 2. **Função SQL `increment_food_usage`**
- ✅ Incrementa contador de uso automaticamente
- ✅ Atualiza `updated_at`
- ✅ Permite ordenar alimentos por popularidade

### 3. **Frontend - Estados Adicionados**
```tsx
- editingLogId: number | null        // ID do item sendo editado
- saveToLibrary: boolean              // Checkbox para salvar na biblioteca
- foodLibrary: any[]                  // Lista de alimentos salvos
- searchQuery: string                 // Busca de alimentos
- filteredFoods: any[]                // Resultados da busca
- showDeleteConfirm: boolean          // Confirmação de exclusão
```

### 4. **Funções Implementadas**

#### `loadFoodLibrary()`
- Carrega todos os alimentos salvos do usuário
- Ordena por `usage_count` (mais usados primeiro)
- Atualiza estado `foodLibrary`

#### `openFoodModal(mealId, logItem?)`
- **Modo Adicionar**: Abre modal vazio para novo alimento
- **Modo Editar**: Pré-preenche com dados do item existente
- Define `editingLogId` quando editando

#### `quickAddFromLibrary(food)`
- Preenche formulário com dados do alimento salvo
- Desativa "Salvar na biblioteca" (já está salvo)
- Permite adicionar rapidamente alimentos frequentes

#### `handleSaveFood()`
- **Se editando**: Atualiza registro existente em `nutrition_logs`
- **Se adicionando**: Insere novo registro
- **Se `saveToLibrary` = true**: 
  - Salva/atualiza em `food_library`
  - Incrementa `usage_count`
  - Recarrega biblioteca

#### Busca em Tempo Real
```tsx
useEffect(() => {
    if (searchQuery.trim()) {
        const filtered = foodLibrary.filter(food =>
            food.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredFoods(filtered);
    } else {
        setFilteredFoods([]);
    }
}, [searchQuery, foodLibrary]);
```

## 📋 Como Usar:

### **Adicionar Alimento Novo**
1. Clique em "Adicionar" em qualquer refeição
2. Digite o nome do alimento
3. Preencha informações nutricionais
4. ✅ Deixe marcado "Salvar na biblioteca"
5. Clique em "Salvar"
→ Alimento é registrado E salvo para reutilização

### **Editar Alimento Existente**
1. Clique no ícone de editar (✏️) ao lado do alimento
2. Modifique os dados desejados
3. Clique em "Atualizar"
→ Registro é atualizado

### **Reutilizar Alimento Salvo**
1. Clique em "Adicionar" em qualquer refeição
2. Comece a digitar o nome do alimento
3. Selecione da lista de sugestões
→ Formulário é preenchido automaticamente

### **Alimentos Mais Usados**
- Alimentos aparecem ordenados por frequência de uso
- Quanto mais você usa, mais no topo aparece
- Facilita encontrar seus alimentos favoritos

## 🎨 UI Necessária (Próximo Passo):

### No Modal de Alimento:
```tsx
{/* Campo de busca com autocomplete */}
<input 
    type="text"
    placeholder="Buscar alimento salvo..."
    value={searchQuery}
    onChange={e => setSearchQuery(e.target.value)}
/>

{/* Lista de sugestões */}
{filteredFoods.length > 0 && (
    <div className="suggestions">
        {filteredFoods.map(food => (
            <button onClick={() => quickAddFromLibrary(food)}>
                {food.name} - {food.calories}kcal
            </button>
        ))}
    </div>
)}

{/* Checkbox para salvar */}
{!editingLogId && (
    <label>
        <input 
            type="checkbox"
            checked={saveToLibrary}
            onChange={e => setSaveToLibrary(e.target.checked)}
        />
        Salvar na minha biblioteca
    </label>
)}
```

### Nos Itens de Refeição:
```tsx
{/* Botão de editar */}
<button onClick={() => openFoodModal(meal.id, logItem)}>
    <Edit size={16} /> Editar
</button>

{/* Botão de deletar */}
<button onClick={() => {
    setItemToDelete(logItem.id);
    setShowDeleteConfirm(true);
}}>
    <Trash2 size={16} /> Remover
</button>
```

## 🔄 Fluxo Completo:

### Primeira Vez (Novo Alimento):
1. Usuário adiciona "Banana" com 105kcal, 27g carbs
2. ✅ "Salvar na biblioteca" está marcado
3. Salva em `nutrition_logs` (registro do dia)
4. Salva em `food_library` (para reutilização)
5. `usage_count` = 1

### Segunda Vez (Reutilizar):
1. Usuário digita "Ban..."
2. Aparece sugestão: "Banana - 105kcal"
3. Clica na sugestão
4. Formulário preenche automaticamente
5. Clica em "Salvar"
6. Salva em `nutrition_logs` (novo registro)
7. Incrementa `usage_count` em `food_library` (agora = 2)

### Editar:
1. Usuário clica em "Editar" no "Banana" de hoje
2. Modal abre com dados preenchidos
3. Altera para 110kcal
4. Clica em "Atualizar"
5. Atualiza apenas o registro em `nutrition_logs`
6. Não mexe na `food_library`

## 📊 Benefícios:

✅ **Economia de Tempo**: Não precisa digitar tudo novamente  
✅ **Consistência**: Mesmos valores nutricionais sempre  
✅ **Inteligente**: Alimentos mais usados aparecem primeiro  
✅ **Flexível**: Pode editar registros individuais sem afetar a biblioteca  
✅ **Opcional**: Pode escolher não salvar na biblioteca  

## 🚀 Próximos Passos:

1. ✅ Executar migration `003_food_library.sql` no Supabase
2. ⏳ Adicionar UI de busca/autocomplete no modal
3. ⏳ Adicionar botões de editar/deletar nos itens
4. ⏳ Adicionar modal de confirmação de exclusão
5. ⏳ Adicionar ícones de favoritos
6. ⏳ Adicionar categorização visual

## 📝 Arquivo de Migration:

**Localização**: `/backend/supabase/migrations/003_food_library.sql`

**Como aplicar**:
```bash
# No Supabase Dashboard
1. Vá em SQL Editor
2. Cole o conteúdo do arquivo
3. Execute
```

Ou via CLI:
```bash
supabase db push
```

---

**Status**: ✅ Backend completo | ⏳ Frontend parcial (falta UI)

**Próxima ação**: Adicionar componentes UI para busca e edição
