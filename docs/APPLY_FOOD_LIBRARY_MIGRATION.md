# 🚀 Como Aplicar a Migration da Biblioteca de Alimentos

## Opção 1: Supabase Dashboard (Recomendado)

1. **Acesse o Supabase Dashboard**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto YouMove

2. **Abra o SQL Editor**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New Query"

3. **Cole o SQL**
   - Abra o arquivo: `backend/supabase/migrations/003_food_library.sql`
   - Copie TODO o conteúdo
   - Cole no editor SQL

4. **Execute**
   - Clique em "Run" ou pressione `Ctrl+Enter` (Windows/Linux) ou `Cmd+Enter` (Mac)
   - Aguarde a confirmação de sucesso

5. **Verifique**
   ```sql
   -- Execute esta query para verificar se a tabela foi criada:
   SELECT * FROM information_schema.tables 
   WHERE table_name = 'food_library';
   ```

## Opção 2: Supabase CLI

```bash
# 1. Certifique-se de estar na pasta do projeto
cd /Users/joaopaulocoimbra/Documents/Antigravity/YouMove

# 2. Link ao projeto (se ainda não fez)
supabase link --project-ref SEU_PROJECT_REF

# 3. Aplique a migration
supabase db push

# Ou aplique apenas este arquivo específico:
supabase db execute -f backend/supabase/migrations/003_food_library.sql
```

## ✅ Verificação Pós-Migration

Execute estas queries para confirmar que tudo está funcionando:

### 1. Verificar Tabela
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'food_library';
```

### 2. Verificar RLS
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename = 'food_library';
```

### 3. Verificar Função
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'increment_food_usage';
```

### 4. Teste Rápido
```sql
-- Inserir um alimento de teste
INSERT INTO food_library (user_id, name, calories, protein_g, carbs_g, fats_g)
VALUES (auth.uid(), 'Banana', 105, 1.3, 27, 0.3);

-- Verificar
SELECT * FROM food_library WHERE name = 'Banana';

-- Limpar teste
DELETE FROM food_library WHERE name = 'Banana';
```

## 🔧 Troubleshooting

### Erro: "relation already exists"
- A tabela já foi criada anteriormente
- Solução: Pule a criação da tabela ou use `CREATE TABLE IF NOT EXISTS`

### Erro: "permission denied"
- Você não tem permissões de admin
- Solução: Use o Supabase Dashboard como admin

### Erro: "function already exists"
- A função já foi criada
- Solução: Use `CREATE OR REPLACE FUNCTION` (já está no arquivo)

## 📋 Checklist

- [ ] Migration executada com sucesso
- [ ] Tabela `food_library` criada
- [ ] Coluna `food_library_id` adicionada em `nutrition_logs`
- [ ] RLS policies ativas
- [ ] Função `increment_food_usage` criada
- [ ] Índices criados
- [ ] Trigger `updated_at` funcionando

## 🎯 Próximo Passo

Após aplicar a migration, o backend está pronto! 

Agora você pode:
1. Testar a funcionalidade no app
2. Adicionar alimentos e ver se são salvos na biblioteca
3. Verificar se a busca funciona
4. Testar a edição de alimentos

---

**Dúvidas?** Verifique os logs de erro no Supabase Dashboard > Database > Logs
