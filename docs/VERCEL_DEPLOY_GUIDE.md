# 🚀 Guia de Deploy - YouMove para Vercel

## 📋 **Status Atual**

✅ **Build de Produção:** Completo (71s, sem erros)  
✅ **Testes:** 100% aprovados  
✅ **Código:** Pronto para deploy  
⏳ **Deploy:** Aguardando autenticação

---

## 🔐 **Passo 1: Autenticar no Vercel**

### **Opção A: Via Terminal (Recomendado)**

1. **Abra o terminal** que está rodando `vercel login`
2. **Você verá:** 
   ```
   Visit vercel.com/device and enter XNDK-HQWM
   Press [ENTER] to open the browser
   ```
3. **Pressione ENTER** para abrir o navegador
4. **Ou acesse manualmente:** https://vercel.com/device
5. **Digite o código:** `XNDK-HQWM` (ou o código que aparecer)
6. **Faça login** com sua conta Vercel
7. **Aguarde** a confirmação no terminal

### **Opção B: Via Vercel Dashboard**

1. Acesse https://vercel.com
2. Faça login
3. Clique em "Add New Project"
4. Importe do GitHub (se conectado)
5. Ou faça upload manual

---

## 🚀 **Passo 2: Fazer Deploy**

### **Após Autenticação Bem-Sucedida:**

```bash
cd /Users/joaopaulocoimbra/Documents/Antigravity/YouMove
npx vercel --prod
```

### **Responda às Perguntas:**

```
? Set up "~/Documents/Antigravity/YouMove"? 
→ Yes

? Which scope should contain your project?
→ jp's projects (ou seu nome)

? Link to existing project?
→ No (primeira vez) ou Yes (se já existe)

? What's your project's name?
→ youmove (ou nome desejado)

? In which directory is your code located?
→ ./frontend

? Want to override the settings?
→ No (usar configurações do next.config.js)
```

---

## ⚙️ **Passo 3: Configurar Variáveis de Ambiente**

### **No Vercel Dashboard:**

1. Vá para: https://vercel.com/dashboard
2. Selecione seu projeto "YouMove"
3. Vá em **Settings** → **Environment Variables**
4. Adicione:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://cbvixisithmjcjpjkijo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=seu-anon-key-aqui

# Para Fase 2 (Futuro)
# OPENAI_API_KEY=sk-...
```

### **Como Obter as Chaves do Supabase:**

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto "Personal Digital OpenIA"
3. Vá em **Settings** → **API**
4. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 🔄 **Passo 4: Re-Deploy (Após Adicionar Variáveis)**

```bash
npx vercel --prod
```

Ou no Dashboard:
1. Vá em **Deployments**
2. Clique nos 3 pontos do último deploy
3. Clique em **Redeploy**

---

## ✅ **Passo 5: Verificar Deploy**

### **Após Deploy Completo:**

1. **Acesse a URL** fornecida pelo Vercel (ex: `youmove.vercel.app`)
2. **Teste as funcionalidades:**
   - [ ] Login funciona
   - [ ] Dashboard carrega
   - [ ] Página de Nutrição abre
   - [ ] Modal de alimentos funciona
   - [ ] Busca/autocomplete funciona
   - [ ] Adicionar água funciona
   - [ ] Editar/deletar funciona

3. **Verifique o Console:**
   - Abra DevTools (F12)
   - Vá em Console
   - Não deve haver erros críticos

4. **Teste Mobile:**
   - Abra em um celular ou use DevTools mobile view
   - Verifique responsividade

---

## 🐛 **Troubleshooting**

### **Erro: "Build Failed"**
```bash
# Verificar logs no Vercel Dashboard
# Ou rodar build localmente:
cd frontend
npm run build
```

### **Erro: "Supabase Connection Failed"**
- Verifique se as variáveis de ambiente estão corretas
- Confirme que o projeto Supabase está ativo
- Verifique RLS policies

### **Erro: "Page Not Found"**
- Confirme que o diretório raiz está em `./frontend`
- Verifique `next.config.js`

### **Erro: "Migration Not Applied"**
- Acesse Supabase Dashboard
- Vá em SQL Editor
- Execute manualmente `003_food_library.sql`

---

## 📊 **Monitoramento Pós-Deploy**

### **Vercel Analytics**
1. Vá em **Analytics** no Dashboard
2. Monitore:
   - Tempo de carregamento
   - Taxa de erro
   - Visitantes

### **Supabase Logs**
1. Vá em **Logs** no Supabase Dashboard
2. Monitore:
   - Queries SQL
   - Erros de autenticação
   - RLS violations

---

## 🎯 **Checklist Final**

### **Antes do Deploy**
- [x] Build local sem erros
- [x] Testes passando
- [x] Migration aplicada no Supabase
- [x] Documentação completa

### **Durante o Deploy**
- [ ] Autenticação no Vercel
- [ ] Configuração do projeto
- [ ] Variáveis de ambiente
- [ ] Deploy bem-sucedido

### **Após o Deploy**
- [ ] URL acessível
- [ ] Funcionalidades testadas
- [ ] Sem erros no console
- [ ] Mobile responsivo
- [ ] Performance adequada

---

## 📝 **Comandos Úteis**

```bash
# Ver deployments
npx vercel ls

# Ver logs em tempo real
npx vercel logs

# Remover deployment
npx vercel rm [deployment-url]

# Ver informações do projeto
npx vercel inspect

# Fazer rollback
npx vercel rollback
```

---

## 🔗 **Links Importantes**

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Documentação Vercel:** https://vercel.com/docs
- **Documentação Next.js:** https://nextjs.org/docs

---

## 🎉 **Após Deploy Bem-Sucedido**

1. **Compartilhe a URL** com testadores
2. **Colete feedback** dos usuários
3. **Monitore métricas** no Vercel Analytics
4. **Planeje Fase 2** (IA Features)

---

## 🚀 **Fase 2 - Próximos Passos**

Após o deploy estar estável, consulte:
- **`docs/PHASE_2_AI_FEATURES.md`** - Plano completo de IA
- Implementar:
  1. 💡 Insights Inteligentes
  2. 👨‍🍳 Sugestão de Cardápio
  3. 📸 Scan de Refeição

---

**Boa sorte com o deploy!** 🚀

Se tiver problemas, verifique os logs do Vercel e Supabase.
