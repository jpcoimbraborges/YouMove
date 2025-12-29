# 🤖 Fase 2 - Funcionalidades de IA para Nutrição

## 📋 **Visão Geral**

Esta fase adiciona recursos inteligentes ao módulo de Nutrição usando IA (OpenAI GPT-4 Vision ou Google Gemini).

---

## 🎯 **Funcionalidades a Implementar**

### **1. 📸 Scan de Refeição com Câmera**

**Descrição:** Usuário tira foto da refeição e a IA identifica automaticamente os alimentos e estima valores nutricionais.

#### **Fluxo do Usuário:**
1. Clica em "Escanear Refeição" 📷
2. Câmera abre (mobile) ou upload de imagem (desktop)
3. Tira foto ou seleciona imagem
4. IA processa a imagem
5. Lista de alimentos detectados aparece
6. Usuário confirma ou ajusta
7. Alimentos são adicionados ao diário

#### **Tecnologias:**
- **Frontend:** 
  - `react-webcam` para captura de câmera
  - `input type="file" accept="image/*"` para upload
- **Backend:**
  - OpenAI GPT-4 Vision API
  - Ou Google Gemini Vision API
- **Prompt Engineering:**
  ```
  Analise esta imagem de refeição e retorne um JSON com:
  - Lista de alimentos identificados
  - Quantidade estimada de cada alimento
  - Calorias estimadas
  - Proteínas, carboidratos e gorduras (em gramas)
  
  Formato de resposta:
  {
    "foods": [
      {
        "name": "Arroz Branco",
        "quantity": "150g",
        "calories": 195,
        "protein_g": 4,
        "carbs_g": 43,
        "fats_g": 0.3
      }
    ]
  }
  ```

#### **Implementação:**

**1. Criar API Route:**
```typescript
// frontend/src/app/api/nutrition/scan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json(); // base64 image
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analise esta imagem de refeição e retorne um JSON com lista de alimentos, quantidades e valores nutricionais."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000
    });
    
    const result = JSON.parse(response.choices[0].message.content);
    return NextResponse.json(result);
    
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao processar imagem' }, { status: 500 });
  }
}
```

**2. Adicionar UI no Frontend:**
```tsx
// Adicionar ao nutrition/page.tsx

const [showScanModal, setShowScanModal] = useState(false);
const [scanning, setScanning] = useState(false);
const webcamRef = useRef(null);

const handleScanMeal = async () => {
  setScanning(true);
  
  // Capturar imagem da webcam
  const imageSrc = webcamRef.current.getScreenshot();
  
  // Enviar para API
  const response = await fetch('/api/nutrition/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageSrc.split(',')[1] }) // Remove data:image prefix
  });
  
  const data = await response.json();
  
  // Preencher formulário com dados detectados
  // ...
  
  setScanning(false);
};
```

---

### **2. 👨‍🍳 Sugestão de Cardápio Personalizado**

**Descrição:** IA sugere um cardápio completo baseado nas metas nutricionais e preferências do usuário.

#### **Fluxo do Usuário:**
1. Clica em "Sugerir Cardápio" 🧠
2. IA analisa:
   - Metas diárias (calorias, macros)
   - Histórico alimentar
   - Preferências (se houver)
3. Gera sugestão de cardápio completo
4. Usuário pode:
   - Aceitar tudo
   - Aceitar parcialmente
   - Regenerar

#### **Prompt para IA:**
```
Você é um nutricionista especializado. Crie um cardápio diário para um usuário com as seguintes características:

Metas Diárias:
- Calorias: {caloriesGoal} kcal
- Proteínas: {proteinGoal}g
- Carboidratos: {carbsGoal}g
- Gorduras: {fatsGoal}g

Histórico Recente:
{recentFoods}

Crie um cardápio balanceado com:
- Café da Manhã
- Lanche da Manhã
- Almoço
- Lanche da Tarde
- Jantar

Para cada refeição, sugira alimentos específicos com quantidades e valores nutricionais.

Retorne em formato JSON:
{
  "meals": {
    "breakfast": [...],
    "morning_snack": [...],
    "lunch": [...],
    "afternoon_snack": [...],
    "dinner": [...]
  },
  "totals": {
    "calories": 0,
    "protein_g": 0,
    "carbs_g": 0,
    "fats_g": 0
  }
}
```

#### **Implementação:**

**API Route:**
```typescript
// frontend/src/app/api/nutrition/suggest-menu/route.ts
export async function POST(request: NextRequest) {
  const { userId, goals, recentFoods } = await request.json();
  
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: "Você é um nutricionista especializado em criar cardápios personalizados."
      },
      {
        role: "user",
        content: `Crie um cardápio para: Metas - ${JSON.stringify(goals)}, Histórico - ${JSON.stringify(recentFoods)}`
      }
    ],
    response_format: { type: "json_object" }
  });
  
  return NextResponse.json(JSON.parse(response.choices[0].message.content));
}
```

---

### **3. 💡 Insights Inteligentes**

**Descrição:** IA analisa padrões alimentares e fornece insights personalizados.

#### **Exemplos de Insights:**
- "Você está consumindo 30% menos proteína que sua meta nos últimos 3 dias"
- "Ótimo! Você manteve suas calorias dentro da meta por 5 dias seguidos"
- "Considere adicionar mais vegetais ao jantar para aumentar fibras"
- "Seu consumo de água está abaixo do ideal. Tente beber mais 500ml por dia"

#### **Prompt para IA:**
```
Analise os dados nutricionais dos últimos 7 dias e forneça 3 insights personalizados:

Dados:
{nutritionHistory}

Metas:
{goals}

Forneça insights sobre:
1. Padrões de consumo
2. Áreas de melhoria
3. Conquistas e progresso

Seja específico, motivador e prático.
```

#### **Implementação:**

**API Route:**
```typescript
// frontend/src/app/api/nutrition/insights/route.ts
export async function POST(request: NextRequest) {
  const { userId, history, goals } = await request.json();
  
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: "Você é um nutricionista que fornece insights motivadores e práticos."
      },
      {
        role: "user",
        content: `Analise: ${JSON.stringify({ history, goals })}`
      }
    ]
  });
  
  return NextResponse.json({
    insights: response.choices[0].message.content.split('\n').filter(i => i.trim())
  });
}
```

---

## 🛠️ **Setup Necessário**

### **1. Variáveis de Ambiente**

Adicionar ao `.env.local`:
```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Ou Google Gemini
GOOGLE_AI_API_KEY=...
```

### **2. Dependências**

```bash
npm install openai
# ou
npm install @google/generative-ai
```

### **3. Configuração do Supabase**

Criar tabela para armazenar histórico de scans:
```sql
CREATE TABLE nutrition_scans (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  image_url TEXT,
  detected_foods JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📊 **Estimativa de Custos (OpenAI)**

### **GPT-4 Vision (Scan de Refeição)**
- **Custo:** ~$0.01 - $0.03 por imagem
- **Uso estimado:** 10 scans/dia por usuário = $0.30/dia
- **Mensal (30 dias):** ~$9/usuário

### **GPT-4 Turbo (Sugestões e Insights)**
- **Custo:** ~$0.01 - $0.03 por requisição
- **Uso estimado:** 3 requisições/dia = $0.09/dia
- **Mensal (30 dias):** ~$2.70/usuário

### **Total Estimado:**
- **Por usuário/mês:** ~$12
- **100 usuários:** ~$1,200/mês
- **1000 usuários:** ~$12,000/mês

**Recomendação:** Implementar limites de uso e/ou plano premium.

---

## 🎨 **UI/UX Design**

### **Botões de IA (já existentes no código)**

```tsx
{/* Scan Button */}
<button className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-lg shadow-purple-500/30">
  <ScanLine size={20} />
  Escanear Refeição
</button>

{/* Suggest Menu Button */}
<button className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-lg shadow-blue-500/30">
  <ChefHat size={20} />
  Sugerir Cardápio
</button>
```

---

## 📝 **Checklist de Implementação**

### **Fase 2.1 - Scan de Refeição**
- [ ] Criar API route `/api/nutrition/scan`
- [ ] Integrar OpenAI Vision API
- [ ] Adicionar componente de câmera/upload
- [ ] Criar modal de scan
- [ ] Implementar processamento de imagem
- [ ] Adicionar preview de resultados
- [ ] Implementar confirmação/edição
- [ ] Salvar scan no histórico
- [ ] Adicionar loading states
- [ ] Implementar tratamento de erros

### **Fase 2.2 - Sugestão de Cardápio**
- [ ] Criar API route `/api/nutrition/suggest-menu`
- [ ] Integrar OpenAI GPT-4
- [ ] Criar modal de sugestão
- [ ] Implementar geração de cardápio
- [ ] Adicionar preview de cardápio
- [ ] Implementar aceitação parcial/total
- [ ] Adicionar opção de regenerar
- [ ] Salvar cardápios aceitos
- [ ] Implementar loading states
- [ ] Adicionar tratamento de erros

### **Fase 2.3 - Insights Inteligentes**
- [ ] Criar API route `/api/nutrition/insights`
- [ ] Integrar OpenAI GPT-4
- [ ] Implementar análise de histórico
- [ ] Criar componente de insights
- [ ] Adicionar atualização automática
- [ ] Implementar cache de insights
- [ ] Adicionar personalização
- [ ] Implementar notificações
- [ ] Adicionar métricas de engajamento

---

## 🚀 **Ordem de Implementação Recomendada**

1. **Primeiro:** Insights Inteligentes (mais simples, sem câmera)
2. **Segundo:** Sugestão de Cardápio (valor alto, complexidade média)
3. **Terceiro:** Scan de Refeição (mais complexo, requer câmera)

---

## 🎯 **Métricas de Sucesso**

- Taxa de uso de features de IA > 60%
- Satisfação do usuário com sugestões > 4/5
- Precisão do scan de refeição > 80%
- Tempo médio de uso < 30 segundos por feature

---

**Status:** 📋 Planejado  
**Prioridade:** Alta  
**Estimativa:** 2-3 semanas de desenvolvimento
