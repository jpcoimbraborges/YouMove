/**
 * YOUMOVE - AI Cost Optimization
 * 
 * Strategies to reduce OpenAI API costs:
 * 1. Response caching (avoid duplicate calls)
 * 2. Token limiting (compress inputs/outputs)
 * 3. Context reuse (batch similar requests)
 * 4. Weekly generation (not daily)
 * 5. Smart fallbacks (use deterministic when possible)
 */

import { createHash } from 'crypto';

// ============================================
// CONFIGURATION
// ============================================

export const COST_CONFIG = {
    // Cache settings
    CACHE: {
        WORKOUT_TTL_HOURS: 168,      // 7 days for workout plans
        ANALYSIS_TTL_HOURS: 24,     // 24 hours for log analysis
        SUGGESTIONS_TTL_HOURS: 12,  // 12 hours for suggestions
        REPORT_TTL_HOURS: 168,      // 7 days for weekly reports
        CHAT_TTL_HOURS: 0,          // No cache for chat (real-time)
        MAX_CACHE_SIZE: 1000,       // Max entries in cache
    },

    // Token limits by request type
    TOKEN_LIMITS: {
        workout_generation: { max_input: 800, max_output: 1500 },
        log_analysis: { max_input: 1200, max_output: 1200 },
        weekly_report: { max_input: 1000, max_output: 1200 },
        suggestions: { max_input: 600, max_output: 800 },
        coach_chat: { max_input: 500, max_output: 600 },
    },

    // Rate limits (per user per day)
    RATE_LIMITS: {
        workout_generation: 2,    // Max 2 new workouts per day
        log_analysis: 3,          // Max 3 analyses per day
        weekly_report: 1,         // Max 1 report per day
        suggestions: 5,           // Max 5 suggestion requests per day
        coach_chat: 20,           // Max 20 chat messages per day
    },

    // Cost thresholds (USD)
    COST_THRESHOLDS: {
        DAILY_USER_LIMIT: 0.10,   // $0.10 per user per day
        MONTHLY_USER_LIMIT: 2.00, // $2.00 per user per month
        MONTHLY_TOTAL_LIMIT: 100, // $100 total per month
    },

    // Model costs (per 1M tokens)
    MODEL_COSTS: {
        'gpt-4o-mini': { input: 0.15, output: 0.60 },
        'gpt-4o': { input: 2.50, output: 10.00 },
        'gpt-4-turbo': { input: 10.00, output: 30.00 },
    },
} as const;

// ============================================
// CACHE IMPLEMENTATION
// ============================================

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
    hitCount: number;
    tokensSaved: number;
}

class ResponseCache {
    private cache: Map<string, CacheEntry<unknown>> = new Map();
    private maxSize: number;

    constructor(maxSize = COST_CONFIG.CACHE.MAX_CACHE_SIZE) {
        this.maxSize = maxSize;
    }

    /**
     * Generate cache key from request parameters
     */
    generateKey(params: {
        request_type: string;
        user_id: string;
        input_hash: string;
    }): string {
        const data = `${params.request_type}:${params.user_id}:${params.input_hash}`;
        return createHash('sha256').update(data).digest('hex').substring(0, 16);
    }

    /**
     * Hash input content for cache key
     */
    hashInput(input: unknown): string {
        const str = JSON.stringify(input);
        return createHash('md5').update(str).digest('hex');
    }

    /**
     * Get cached response if valid
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) return null;

        // Check expiration
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        // Update hit count
        entry.hitCount++;

        return entry.data as T;
    }

    /**
     * Store response in cache
     */
    set<T>(
        key: string,
        data: T,
        ttlHours: number,
        tokensUsed: number
    ): void {
        // Evict if at capacity
        if (this.cache.size >= this.maxSize) {
            this.evictLeastUsed();
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            expiresAt: Date.now() + (ttlHours * 60 * 60 * 1000),
            hitCount: 0,
            tokensSaved: tokensUsed,
        });
    }

    /**
     * Evict least used entries
     */
    private evictLeastUsed(): void {
        // Remove 10% of entries with lowest hit count
        const entries = Array.from(this.cache.entries())
            .sort((a, b) => a[1].hitCount - b[1].hitCount);

        const toRemove = Math.ceil(this.maxSize * 0.1);
        entries.slice(0, toRemove).forEach(([key]) => this.cache.delete(key));
    }

    /**
     * Get cache stats
     */
    getStats(): {
        entries: number;
        totalHits: number;
        totalTokensSaved: number;
        estimatedSavings: number;
    } {
        let totalHits = 0;
        let totalTokensSaved = 0;

        this.cache.forEach(entry => {
            totalHits += entry.hitCount;
            totalTokensSaved += entry.tokensSaved * entry.hitCount;
        });

        // Estimate savings using gpt-4o-mini costs
        const costs = COST_CONFIG.MODEL_COSTS['gpt-4o-mini'];
        const estimatedSavings = (totalTokensSaved / 1_000_000) * (costs.input + costs.output);

        return {
            entries: this.cache.size,
            totalHits,
            totalTokensSaved,
            estimatedSavings,
        };
    }

    /**
     * Clear expired entries
     */
    cleanup(): number {
        const now = Date.now();
        let removed = 0;

        this.cache.forEach((entry, key) => {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
                removed++;
            }
        });

        return removed;
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.cache.clear();
    }
}

// Singleton instance
export const responseCache = new ResponseCache();

// ============================================
// RATE LIMITER
// ============================================

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

class RateLimiter {
    private limits: Map<string, RateLimitEntry> = new Map();

    /**
     * Check if user can make request
     */
    canMakeRequest(userId: string, requestType: string): boolean {
        const key = `${userId}:${requestType}`;
        const limit = COST_CONFIG.RATE_LIMITS[requestType as keyof typeof COST_CONFIG.RATE_LIMITS] || 10;

        const entry = this.limits.get(key);
        const now = Date.now();

        // Reset if new day
        if (!entry || now > entry.resetAt) {
            this.limits.set(key, {
                count: 0,
                resetAt: this.getEndOfDay(),
            });
            return true;
        }

        return entry.count < limit;
    }

    /**
     * Record a request
     */
    recordRequest(userId: string, requestType: string): void {
        const key = `${userId}:${requestType}`;
        const entry = this.limits.get(key);

        if (entry) {
            entry.count++;
        } else {
            this.limits.set(key, {
                count: 1,
                resetAt: this.getEndOfDay(),
            });
        }
    }

    /**
     * Get remaining requests for user
     */
    getRemainingRequests(userId: string, requestType: string): number {
        const key = `${userId}:${requestType}`;
        const limit = COST_CONFIG.RATE_LIMITS[requestType as keyof typeof COST_CONFIG.RATE_LIMITS] || 10;
        const entry = this.limits.get(key);

        if (!entry || Date.now() > entry.resetAt) {
            return limit;
        }

        return Math.max(0, limit - entry.count);
    }

    /**
     * Get end of current day (midnight UTC)
     */
    private getEndOfDay(): number {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        tomorrow.setUTCHours(0, 0, 0, 0);
        return tomorrow.getTime();
    }

    /**
     * Get all user limits
     */
    getUserLimits(userId: string): Record<string, { used: number; limit: number; remaining: number }> {
        const result: Record<string, { used: number; limit: number; remaining: number }> = {};

        Object.entries(COST_CONFIG.RATE_LIMITS).forEach(([type, limit]) => {
            const key = `${userId}:${type}`;
            const entry = this.limits.get(key);
            const used = (entry && Date.now() <= entry.resetAt) ? entry.count : 0;

            result[type] = {
                used,
                limit,
                remaining: limit - used,
            };
        });

        return result;
    }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// ============================================
// COST TRACKER
// ============================================

interface CostEntry {
    timestamp: number;
    userId: string;
    requestType: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
}

class CostTracker {
    private costs: CostEntry[] = [];
    private maxEntries = 10000;

    /**
     * Record API cost
     */
    recordCost(entry: Omit<CostEntry, 'cost'>): void {
        const model = 'gpt-4o-mini';
        const costs = COST_CONFIG.MODEL_COSTS[model];

        const cost =
            (entry.inputTokens / 1_000_000) * costs.input +
            (entry.outputTokens / 1_000_000) * costs.output;

        this.costs.push({ ...entry, cost });

        // Keep only recent entries
        if (this.costs.length > this.maxEntries) {
            this.costs = this.costs.slice(-this.maxEntries);
        }
    }

    /**
     * Get user's daily cost
     */
    getUserDailyCost(userId: string): number {
        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);

        return this.costs
            .filter(c => c.userId === userId && c.timestamp >= startOfDay.getTime())
            .reduce((acc, c) => acc + c.cost, 0);
    }

    /**
     * Get user's monthly cost
     */
    getUserMonthlyCost(userId: string): number {
        const startOfMonth = new Date();
        startOfMonth.setUTCDate(1);
        startOfMonth.setUTCHours(0, 0, 0, 0);

        return this.costs
            .filter(c => c.userId === userId && c.timestamp >= startOfMonth.getTime())
            .reduce((acc, c) => acc + c.cost, 0);
    }

    /**
     * Get total monthly cost
     */
    getTotalMonthlyCost(): number {
        const startOfMonth = new Date();
        startOfMonth.setUTCDate(1);
        startOfMonth.setUTCHours(0, 0, 0, 0);

        return this.costs
            .filter(c => c.timestamp >= startOfMonth.getTime())
            .reduce((acc, c) => acc + c.cost, 0);
    }

    /**
     * Check if user is within budget
     */
    isWithinBudget(userId: string): { daily: boolean; monthly: boolean; total: boolean } {
        return {
            daily: this.getUserDailyCost(userId) < COST_CONFIG.COST_THRESHOLDS.DAILY_USER_LIMIT,
            monthly: this.getUserMonthlyCost(userId) < COST_CONFIG.COST_THRESHOLDS.MONTHLY_USER_LIMIT,
            total: this.getTotalMonthlyCost() < COST_CONFIG.COST_THRESHOLDS.MONTHLY_TOTAL_LIMIT,
        };
    }

    /**
     * Get cost summary
     */
    getSummary(): {
        today: number;
        thisMonth: number;
        topUsers: { userId: string; cost: number }[];
        byRequestType: Record<string, number>;
    } {
        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);

        const startOfMonth = new Date();
        startOfMonth.setUTCDate(1);
        startOfMonth.setUTCHours(0, 0, 0, 0);

        const monthCosts = this.costs.filter(c => c.timestamp >= startOfMonth.getTime());

        // By user
        const userCosts: Record<string, number> = {};
        monthCosts.forEach(c => {
            userCosts[c.userId] = (userCosts[c.userId] || 0) + c.cost;
        });

        const topUsers = Object.entries(userCosts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([userId, cost]) => ({ userId, cost }));

        // By request type
        const byRequestType: Record<string, number> = {};
        monthCosts.forEach(c => {
            byRequestType[c.requestType] = (byRequestType[c.requestType] || 0) + c.cost;
        });

        return {
            today: this.costs
                .filter(c => c.timestamp >= startOfDay.getTime())
                .reduce((acc, c) => acc + c.cost, 0),
            thisMonth: monthCosts.reduce((acc, c) => acc + c.cost, 0),
            topUsers,
            byRequestType,
        };
    }
}

// Singleton instance
export const costTracker = new CostTracker();

// ============================================
// INPUT COMPRESSION
// ============================================

/**
 * Compress input to fit within token limits
 */
export function compressInput(
    input: string,
    maxTokens: number,
    preserveStart = 0.3,  // Keep 30% of start
    preserveEnd = 0.3     // Keep 30% of end
): string {
    // Rough estimate: 1 token ≈ 4 characters
    const estimatedTokens = Math.ceil(input.length / 4);

    if (estimatedTokens <= maxTokens) {
        return input;
    }

    const maxChars = maxTokens * 4;
    const startChars = Math.floor(maxChars * preserveStart);
    const endChars = Math.floor(maxChars * preserveEnd);

    const start = input.substring(0, startChars);
    const end = input.substring(input.length - endChars);

    return `${start}\n\n[... conteúdo resumido para economia ...]\n\n${end}`;
}

/**
 * Summarize workout logs to reduce tokens
 */
export function summarizeLogsForAI(
    logs: Array<{
        date: string;
        workout_name: string;
        exercises: Array<{ name: string; sets: number; volume: number }>;
        duration: number;
        volume: number;
    }>,
    maxLogs = 7
): string {
    // Only keep last N logs
    const recentLogs = logs.slice(-maxLogs);

    // Aggregate stats instead of listing all details
    const totalVolume = recentLogs.reduce((acc, l) => acc + l.volume, 0);
    const avgDuration = recentLogs.reduce((acc, l) => acc + l.duration, 0) / recentLogs.length;

    // Count exercise frequency
    const exerciseFreq: Record<string, number> = {};
    recentLogs.forEach(log => {
        log.exercises.forEach(ex => {
            exerciseFreq[ex.name] = (exerciseFreq[ex.name] || 0) + 1;
        });
    });

    const topExercises = Object.entries(exerciseFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name]) => name);

    return `Últimos ${recentLogs.length} treinos:
- Volume total: ${Math.round(totalVolume)}kg
- Duração média: ${Math.round(avgDuration)}min
- Exercícios frequentes: ${topExercises.join(', ')}
- Último treino: ${recentLogs[recentLogs.length - 1]?.date || 'N/A'}`;
}

// ============================================
// WEEKLY GENERATION STRATEGY
// ============================================

/**
 * Check if new workout generation is needed
 * Returns false if cached plan is still valid
 */
export function shouldGenerateNewPlan(
    lastGeneratedAt: Date | null,
    planDays: number
): boolean {
    if (!lastGeneratedAt) return true;

    const now = new Date();
    const daysSinceGeneration = Math.floor(
        (now.getTime() - lastGeneratedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Only regenerate weekly (or when plan is exhausted)
    return daysSinceGeneration >= 7 || daysSinceGeneration >= planDays;
}

/**
 * Get TTL for cache based on request type
 */
export function getCacheTTL(requestType: string): number {
    switch (requestType) {
        case 'workout_generation':
            return COST_CONFIG.CACHE.WORKOUT_TTL_HOURS;
        case 'log_analysis':
            return COST_CONFIG.CACHE.ANALYSIS_TTL_HOURS;
        case 'suggestions':
            return COST_CONFIG.CACHE.SUGGESTIONS_TTL_HOURS;
        case 'weekly_report':
            return COST_CONFIG.CACHE.REPORT_TTL_HOURS;
        default:
            return 0; // No cache
    }
}

// ============================================
// SMART FALLBACKS
// ============================================

/**
 * Decide whether to use AI or deterministic generation
 */
export function shouldUseAI(params: {
    user_id: string;
    request_type: string;
    has_cached_response: boolean;
    is_within_budget: boolean;
    is_within_rate_limit: boolean;
}): { useAI: boolean; reason: string } {
    // Always use cache if available
    if (params.has_cached_response) {
        return { useAI: false, reason: 'Using cached response' };
    }

    // Check budget
    if (!params.is_within_budget) {
        return { useAI: false, reason: 'Budget limit reached' };
    }

    // Check rate limit
    if (!params.is_within_rate_limit) {
        return { useAI: false, reason: 'Rate limit reached' };
    }

    // For workout generation, prefer deterministic if no special requirements
    if (params.request_type === 'workout_generation') {
        return { useAI: true, reason: 'AI generation requested' };
    }

    return { useAI: true, reason: 'AI available' };
}

// ============================================
// EXPORTS
// ============================================

export {
    ResponseCache,
    RateLimiter,
    CostTracker,
};
