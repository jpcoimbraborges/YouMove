# YOUMOVE - Guia de Deploy para Produção

Este documento descreve o processo completo de deploy do YOUMOVE para produção.

## 📋 Checklist Pré-Deploy

### 1. Código
- [ ] Todos os testes passando (`npm test`)
- [ ] Build local funcionando (`npm run build`)
- [ ] Sem erros de TypeScript
- [ ] Sem console.logs desnecessários
- [ ] Variáveis hardcoded removidas

### 2. Supabase
- [ ] Projeto de produção criado (separado do dev)
- [ ] Migrations aplicadas
- [ ] RLS policies ativas
- [ ] Backups configurados
- [ ] Auth providers configurados

### 3. Stripe
- [ ] Conta verificada
- [ ] Produtos e preços criados
- [ ] Webhook endpoint configurado
- [ ] Chaves LIVE obtidas (não test)

### 4. OpenAI
- [ ] Chave de API com limites de uso
- [ ] Billing configurado
- [ ] Rate limits adequados

---

## 🚀 Opção 1: Deploy na Vercel (Recomendado)

### Passo 1: Conectar Repositório

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Conectar projeto
cd frontend
vercel
```

### Passo 2: Configurar Variáveis de Ambiente

No dashboard da Vercel (vercel.com/[projeto]/settings/environment-variables):

| Variável | Valor | Ambiente |
|----------|-------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Production |
| `OPENAI_API_KEY` | `sk-...` | Production |
| `OPENAI_MODEL` | `gpt-4o-mini` | Production |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Production |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Production |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Production |

### Passo 3: Deploy

```bash
# Deploy para produção
vercel --prod
```

### Passo 4: Configurar Domínio

1. Vá em Settings > Domains
2. Adicione `youmove.app` (ou seu domínio)
3. Configure DNS conforme instruções

---

## 🐳 Opção 2: Deploy com Docker

### Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### Build e Run

```bash
# Build imagem
docker build -t youmove:latest ./frontend

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=xxx \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx \
  -e OPENAI_API_KEY=xxx \
  youmove:latest
```

---

## 🛤️ Opção 3: Deploy no Railway

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Criar projeto
railway init

# Deploy
railway up
```

Configure as variáveis no dashboard do Railway.

---

## ⚙️ Configuração Next.js para Produção

### next.config.ts

```typescript
import type { NextConfig } from 'next';

const config: NextConfig = {
  output: 'standalone', // Para Docker
  
  // Otimizações de produção
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Headers de segurança
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
  
  // Cache de imagens
  images: {
    remotePatterns: [
      { hostname: 'cbvixisithmjcjpjkijo.supabase.co' },
    ],
  },
};

export default config;
```

---

## 🔒 Segurança em Produção

### 1. Headers HTTP

Os headers de segurança são configurados automaticamente no `next.config.ts`.

### 2. Content Security Policy (CSP)

Adicione em `middleware.ts`:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  response.headers.set(
    'Content-Security-Policy',
    `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval';
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com;
      img-src 'self' data: blob: https:;
      connect-src 'self' https://*.supabase.co https://api.openai.com;
    `.replace(/\s+/g, ' ').trim()
  );
  
  return response;
}
```

### 3. Rate Limiting (API Routes)

```typescript
// lib/rate-limit.ts
const rateLimit = new Map();

export function checkRateLimit(
  ip: string,
  limit = 100,
  windowMs = 60000
): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  const requests = rateLimit.get(ip) || [];
  const recentRequests = requests.filter((t: number) => t > windowStart);
  
  if (recentRequests.length >= limit) {
    return false; // Rate limited
  }
  
  recentRequests.push(now);
  rateLimit.set(ip, recentRequests);
  return true;
}
```

---

## 📊 Monitoramento e Logs

### 1. Sentry (Error Tracking)

```bash
# Instalar Sentry
npm install @sentry/nextjs

# Configurar
npx @sentry/wizard@latest -i nextjs
```

### 2. Vercel Analytics (se usar Vercel)

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### 3. Logs Estruturados

```typescript
// lib/logger.ts
export const logger = {
  info: (message: string, data?: object) => {
    if (process.env.NODE_ENV === 'production') {
      // Send to logging service
      console.log(JSON.stringify({ level: 'info', message, ...data, timestamp: new Date().toISOString() }));
    } else {
      console.log(`ℹ️ ${message}`, data);
    }
  },
  
  error: (message: string, error?: Error, data?: object) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error?.message,
      stack: error?.stack,
      ...data,
      timestamp: new Date().toISOString(),
    }));
  },
  
  warn: (message: string, data?: object) => {
    console.warn(JSON.stringify({ level: 'warn', message, ...data, timestamp: new Date().toISOString() }));
  },
};
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions

Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: cd frontend && npm ci
      
      - name: Run tests
        run: cd frontend && npm test
      
      - name: Build
        run: cd frontend && npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 📱 PWA em Produção
tar 
### Checklist PWA
- [ ] `manifest.json` com ícones corretos
- [ ] Service Worker registrado
- [ ] HTTPS configurado (obrigatório)
- [ ] Testado em dispositivos reais

### Teste PWA

Use o Lighthouse no Chrome DevTools:
1. Abra DevTools (F12)
2. Vá em "Lighthouse"
3. Selecione "Progressive Web App"
4. Clique "Analyze"

---

## 🗄️ Backup e Recuperação

### Supabase Backups

O Supabase Pro inclui backups automáticos. Para o plano free:

```bash
# Backup manual
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql
```

### Restore

```bash
psql -h db.xxx.supabase.co -U postgres -d postgres < backup.sql
```

---

## 📋 Comandos de Deploy

```bash
# Build de produção
cd frontend
npm run build

# Preview local do build
npm run start

# Deploy Vercel
vercel --prod

# Deploy Railway
railway up

# Build Docker
docker build -t youmove . && docker push youmove
```

---

## ✅ Checklist Final

- [ ] Build passando sem erros
- [ ] Todas variáveis de ambiente configuradas
- [ ] HTTPS ativo
- [ ] Headers de segurança configurados
- [ ] Sentry ou similar configurado
- [ ] Analytics configurado
- [ ] PWA testado
- [ ] Backup automático configurado
- [ ] Domínio configurado
- [ ] SSL/TLS válido

---

## 📞 Suporte

Em caso de problemas:
1. Verifique logs no dashboard do hosting
2. Verifique Sentry para erros
3. Verifique Supabase logs
4. Teste localmente com variáveis de produção
