# YOUMOVE - AI Cost Optimization Strategy

## Overview

This document describes the strategies implemented to reduce OpenAI API costs while maintaining quality user experience.

## Cost Estimates

### Model Pricing (GPT-4o-mini)
- Input: $0.15 / 1M tokens
- Output: $0.60 / 1M tokens

### Estimated Per-Request Costs
| Request Type | Input Tokens | Output Tokens | Cost/Request |
|--------------|--------------|---------------|--------------|
| Workout Generation | ~600 | ~1200 | ~$0.0008 |
| Log Analysis | ~900 | ~1000 | ~$0.0008 |
| Weekly Report | ~800 | ~1000 | ~$0.0007 |
| Suggestions | ~500 | ~600 | ~$0.0004 |
| Coach Chat | ~400 | ~500 | ~$0.0004 |

### Without Optimization (1000 users)
- Avg 5 AI calls/user/day = 5,000 calls/day
- Avg cost per call = $0.0006
- **Daily cost: ~$3.00**
- **Monthly cost: ~$90.00**

### With Optimization (target)
- **Monthly cost: ~$20-30**
- **Savings: ~70%**

---

## Optimization Strategies

### 1. Response Caching

**Implementation:** `responseCache` in `cost-optimization.ts`

| Request Type | Cache TTL | Rationale |
|--------------|-----------|-----------|
| Workout Plan | 7 days | Weekly generation, not daily |
| Log Analysis | 24 hours | Daily summary sufficient |
| Weekly Report | 7 days | Generated once per week |
| Suggestions | 12 hours | Semi-static recommendations |
| Coach Chat | 0 (no cache) | Real-time conversation |

**Cache Key Generation:**
```
SHA256(request_type + user_id + hash(input))
```

**Eviction Policy:**
- LRU (Least Recently Used) when at capacity
- Automatic expiration based on TTL
- Max 1000 entries in memory

**Expected Savings:** 40-50%

---

### 2. Token Limits

**Implementation:** `COST_CONFIG.TOKEN_LIMITS` + `compressInput()`

| Request Type | Max Input | Max Output |
|--------------|-----------|------------|
| Workout Generation | 800 | 1500 |
| Log Analysis | 1200 | 1200 |
| Weekly Report | 1000 | 1200 |
| Suggestions | 600 | 800 |
| Coach Chat | 500 | 600 |

**Input Compression Strategies:**
1. **Log Summarization:** Only last 7 days, aggregate stats
2. **Exercise Frequency:** Top 5 instead of all
3. **Truncation:** Keep 30% start, 30% end when needed

**Expected Savings:** 20-30%

---

### 3. Rate Limiting

**Implementation:** `rateLimiter` in `cost-optimization.ts`

| Request Type | Daily Limit/User | Rationale |
|--------------|-----------------|-----------|
| Workout Generation | 2 | Weekly plan, occasional adjustments |
| Log Analysis | 3 | End of workout + on-demand |
| Weekly Report | 1 | Once per week |
| Suggestions | 5 | Periodic check-ins |
| Coach Chat | 20 | Reasonable conversation |

**Rate Limit Reset:** Midnight UTC daily

**Enforcement:**
- Returns `RATE_LIMIT_EXCEEDED` error
- Falls back to deterministic engine
- Shows remaining quota to user

---

### 4. Weekly Generation (Not Daily)

**Key Decision:** Generate 7-day workout plans, not individual workouts.

**Benefits:**
- 1 AI call per week vs 3-6 per week
- Better workout coherence
- Predictable cost per user

**Implementation:**
```typescript
function shouldGenerateNewPlan(lastGenerated, planDays) {
  const daysSince = daysBetween(lastGenerated, now);
  return daysSince >= 7 || daysSince >= planDays;
}
```

**Workflow:**
1. Monday: Generate 7-day plan (AI)
2. Tue-Sun: Use cached plan
3. On-demand adjustments: Use deterministic engine

**Expected Savings:** 70-80% on workout generation

---

### 5. Smart Fallbacks

**Priority Order:**
1. **Cache** → Return cached response (free)
2. **Deterministic Engine** → Use rule-based generation (free)
3. **AI Call** → Only when necessary (paid)

**When to Use Deterministic:**
- Budget exceeded
- Rate limit exceeded
- Simple requests (standard workout)
- Offline mode

**When AI is Required:**
- First weekly plan generation
- Complex customization requests
- Log analysis and insights
- Coach chat conversations

---

### 6. Cost Tracking & Budgets

**Implementation:** `costTracker` in `cost-optimization.ts`

**Budget Thresholds:**
| Level | Limit | Action |
|-------|-------|--------|
| Daily/User | $0.10 | Switch to deterministic |
| Monthly/User | $2.00 | Switch to deterministic |
| Monthly/Total | $100 | Alert + throttle |

**Metrics Tracked:**
- Cost per user (daily/monthly)
- Cost per request type
- Total monthly spend
- Top users by cost

**Alerts:**
- Dashboard for admins
- Slack/email at 80% threshold
- Auto-throttle at 100%

---

## Implementation Files

| File | Purpose |
|------|---------|
| `ia/engines/cost-optimization.ts` | Cache, rate limiter, cost tracker |
| `ia/engines/openai-client.ts` | Integrated optimization in API calls |

---

## Monitoring Dashboard (Future)

```
┌─────────────────────────────────────────────────────────────┐
│                    AI COST DASHBOARD                        │
├─────────────────────────────────────────────────────────────┤
│  TODAY          THIS MONTH        BUDGET                    │
│  $1.23          $18.45            ████████░░ 18%            │
├─────────────────────────────────────────────────────────────┤
│  CACHE STATS                                                │
│  Entries: 456    Hits: 2,341    Tokens Saved: 1.2M         │
│  Estimated Savings: $0.90                                   │
├─────────────────────────────────────────────────────────────┤
│  BY REQUEST TYPE                                            │
│  workout_generation  ████████░░░░ $8.20                    │
│  log_analysis        ██████░░░░░░ $5.40                    │
│  suggestions         ███░░░░░░░░░ $2.80                    │
│  coach_chat          ██░░░░░░░░░░ $2.05                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Future Optimizations

1. **Semantic Cache:** Cache similar (not exact) requests
2. **Batch Processing:** Group multiple users' analyses
3. **Model Switching:** Use cheaper models for simple tasks
4. **Prompt Compression:** Use abbreviations in system prompts
5. **Response Streaming:** For chat, reduce perceived latency

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2024-12-20 | Weekly generation | 70% cost reduction |
| 2024-12-20 | 7-day workout cache | Reduces redundant calls |
| 2024-12-20 | gpt-4o-mini default | Best cost/quality ratio |
| 2024-12-20 | $0.10/user/day limit | Predictable costs |
| 2024-12-20 | Deterministic fallback | Zero-cost alternative |
