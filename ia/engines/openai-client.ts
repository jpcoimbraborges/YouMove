/**
 * YOUMOVE - OpenAI Client (with Cost Optimization)
 * 
 * Centralized OpenAI API client with:
 * - Error handling and logging
 * - Response caching
 * - Rate limiting
 * - Cost tracking
 */

import OpenAI from 'openai';
import {
    responseCache,
    rateLimiter,
    costTracker,
    COST_CONFIG,
    getCacheTTL,
    shouldUseAI,
    compressInput,
} from './cost-optimization';

// ============================================
// CONFIGURATION
// ============================================

const OPENAI_CONFIG = {
    MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    MAX_TOKENS: 2000,
    TEMPERATURE: 0.7,
    TIMEOUT_MS: 30000,
};

// ============================================
// CLIENT INITIALIZATION
// ============================================

let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
    if (!openaiClient) {
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            throw new Error('OPENAI_API_KEY not configured');
        }

        openaiClient = new OpenAI({
            apiKey,
            timeout: OPENAI_CONFIG.TIMEOUT_MS,
        });
    }

    return openaiClient;
}

// ============================================
// TYPES
// ============================================

export interface AIRequest {
    system_prompt: string;
    user_message: string;
    temperature?: number;
    max_tokens?: number;
    user_id?: string;
    request_type: string;
    skip_cache?: boolean;
}

export interface AIResponse<T> {
    success: boolean;
    data: T | null;
    error: AIError | null;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    } | null;
    latency_ms: number;
    request_id: string;
    from_cache?: boolean;
    cost_usd?: number;
}

export interface AIError {
    code: string;
    message: string;
    details?: unknown;
}

export interface AuditLog {
    request_id: string;
    timestamp: string;
    user_id: string | null;
    request_type: string;
    model: string;
    prompt_tokens: number;
    completion_tokens: number;
    latency_ms: number;
    success: boolean;
    error_code: string | null;
    input_summary: string;
    output_summary: string;
    from_cache: boolean;
    cost_usd: number;
}

// ============================================
// AUDIT LOGGING
// ============================================

const auditLogs: AuditLog[] = [];
const MAX_AUDIT_LOGS = 1000;

export function logAudit(log: AuditLog): void {
    auditLogs.push(log);

    // Keep only last N logs in memory
    if (auditLogs.length > MAX_AUDIT_LOGS) {
        auditLogs.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
        console.log('[AI Audit]', JSON.stringify(log, null, 2));
    }

    // TODO: Send to persistent storage (Supabase, analytics, etc.)
}

export function getAuditLogs(limit = 100): AuditLog[] {
    return auditLogs.slice(-limit);
}

// ============================================
// MAIN API CALL FUNCTION (with optimizations)
// ============================================

export async function callOpenAI<T>(request: AIRequest): Promise<AIResponse<T>> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const startTime = Date.now();
    const userId = request.user_id || 'anonymous';

    // === CHECK RATE LIMIT ===
    if (!rateLimiter.canMakeRequest(userId, request.request_type)) {
        return {
            success: false,
            data: null,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: `Limite de requisições excedido para ${request.request_type}. Tente novamente amanhã.`,
            },
            usage: null,
            latency_ms: 0,
            request_id: requestId,
        };
    }

    // === CHECK BUDGET ===
    const budget = costTracker.isWithinBudget(userId);
    if (!budget.daily || !budget.monthly) {
        return {
            success: false,
            data: null,
            error: {
                code: 'BUDGET_EXCEEDED',
                message: 'Limite de uso de IA atingido. O sistema usará geração determinística.',
            },
            usage: null,
            latency_ms: 0,
            request_id: requestId,
        };
    }

    // === CHECK CACHE ===
    if (!request.skip_cache) {
        const cacheKey = responseCache.generateKey({
            request_type: request.request_type,
            user_id: userId,
            input_hash: responseCache.hashInput(request.user_message),
        });

        const cached = responseCache.get<T>(cacheKey);
        if (cached) {
            const latency = Date.now() - startTime;

            logAudit({
                request_id: requestId,
                timestamp: new Date().toISOString(),
                user_id: request.user_id || null,
                request_type: request.request_type,
                model: 'cache',
                prompt_tokens: 0,
                completion_tokens: 0,
                latency_ms: latency,
                success: true,
                error_code: null,
                input_summary: '[CACHE HIT]',
                output_summary: summarizeOutput(cached),
                from_cache: true,
                cost_usd: 0,
            });

            return {
                success: true,
                data: cached,
                error: null,
                usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
                latency_ms: latency,
                request_id: requestId,
                from_cache: true,
                cost_usd: 0,
            };
        }
    }

    // === COMPRESS INPUT IF NEEDED ===
    const tokenLimits = COST_CONFIG.TOKEN_LIMITS[request.request_type as keyof typeof COST_CONFIG.TOKEN_LIMITS];
    let userMessage = request.user_message;

    if (tokenLimits) {
        userMessage = compressInput(request.user_message, tokenLimits.max_input);
    }

    // === MAKE API CALL ===
    try {
        const client = getOpenAIClient();

        const completion = await client.chat.completions.create({
            model: OPENAI_CONFIG.MODEL,
            messages: [
                { role: 'system', content: request.system_prompt },
                { role: 'user', content: userMessage },
            ],
            temperature: request.temperature ?? OPENAI_CONFIG.TEMPERATURE,
            max_tokens: tokenLimits?.max_output ?? request.max_tokens ?? OPENAI_CONFIG.MAX_TOKENS,
            response_format: { type: 'json_object' },
        });

        const latency = Date.now() - startTime;
        const content = completion.choices[0]?.message?.content || '{}';

        // Parse JSON response
        let parsed: T;
        try {
            parsed = JSON.parse(content);
        } catch (parseError) {
            throw new Error(`Invalid JSON response: ${content.substring(0, 200)}`);
        }

        // Calculate cost
        const promptTokens = completion.usage?.prompt_tokens || 0;
        const completionTokens = completion.usage?.completion_tokens || 0;
        const costs = COST_CONFIG.MODEL_COSTS['gpt-4o-mini'];
        const costUsd =
            (promptTokens / 1_000_000) * costs.input +
            (completionTokens / 1_000_000) * costs.output;

        // Record cost
        costTracker.recordCost({
            timestamp: Date.now(),
            userId,
            requestType: request.request_type,
            inputTokens: promptTokens,
            outputTokens: completionTokens,
        });

        // Record rate limit usage
        rateLimiter.recordRequest(userId, request.request_type);

        // Cache response
        const ttl = getCacheTTL(request.request_type);
        if (ttl > 0) {
            const cacheKey = responseCache.generateKey({
                request_type: request.request_type,
                user_id: userId,
                input_hash: responseCache.hashInput(request.user_message),
            });
            responseCache.set(cacheKey, parsed, ttl, promptTokens + completionTokens);
        }

        // Create audit log
        logAudit({
            request_id: requestId,
            timestamp: new Date().toISOString(),
            user_id: request.user_id || null,
            request_type: request.request_type,
            model: OPENAI_CONFIG.MODEL,
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            latency_ms: latency,
            success: true,
            error_code: null,
            input_summary: summarizeInput(userMessage),
            output_summary: summarizeOutput(parsed),
            from_cache: false,
            cost_usd: costUsd,
        });

        return {
            success: true,
            data: parsed,
            error: null,
            usage: completion.usage ? {
                prompt_tokens: completion.usage.prompt_tokens,
                completion_tokens: completion.usage.completion_tokens,
                total_tokens: completion.usage.total_tokens,
            } : null,
            latency_ms: latency,
            request_id: requestId,
            from_cache: false,
            cost_usd: costUsd,
        };

    } catch (error) {
        const latency = Date.now() - startTime;
        const aiError = parseError(error);

        // Log error
        logAudit({
            request_id: requestId,
            timestamp: new Date().toISOString(),
            user_id: request.user_id || null,
            request_type: request.request_type,
            model: OPENAI_CONFIG.MODEL,
            prompt_tokens: 0,
            completion_tokens: 0,
            latency_ms: latency,
            success: false,
            error_code: aiError.code,
            input_summary: summarizeInput(request.user_message),
            output_summary: '',
            from_cache: false,
            cost_usd: 0,
        });

        return {
            success: false,
            data: null,
            error: aiError,
            usage: null,
            latency_ms: latency,
            request_id: requestId,
        };
    }
}

// ============================================
// ERROR HANDLING
// ============================================

function parseError(error: unknown): AIError {
    if (error instanceof OpenAI.APIError) {
        return {
            code: error.code || 'API_ERROR',
            message: error.message,
            details: {
                status: error.status,
                type: error.type,
            },
        };
    }

    if (error instanceof Error) {
        if (error.message.includes('timeout')) {
            return {
                code: 'TIMEOUT',
                message: 'A requisição excedeu o tempo limite',
            };
        }

        if (error.message.includes('Invalid JSON')) {
            return {
                code: 'INVALID_RESPONSE',
                message: 'A IA retornou uma resposta inválida',
                details: error.message,
            };
        }

        return {
            code: 'UNKNOWN_ERROR',
            message: error.message,
        };
    }

    return {
        code: 'UNKNOWN_ERROR',
        message: 'Erro desconhecido ao chamar a IA',
    };
}

// ============================================
// HELPERS
// ============================================

function summarizeInput(input: string): string {
    const maxLength = 200;
    if (input.length <= maxLength) return input;
    return input.substring(0, maxLength) + '...';
}

function summarizeOutput(output: unknown): string {
    if (!output) return '';

    try {
        const str = JSON.stringify(output);
        const maxLength = 200;
        if (str.length <= maxLength) return str;
        return str.substring(0, maxLength) + '...';
    } catch {
        return '[Unable to summarize]';
    }
}

// ============================================
// RETRY WRAPPER
// ============================================

export async function callOpenAIWithRetry<T>(
    request: AIRequest,
    maxRetries = 2
): Promise<AIResponse<T>> {
    let lastError: AIResponse<T> | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const response = await callOpenAI<T>(request);

        if (response.success) {
            return response;
        }

        lastError = response;

        // Don't retry on certain errors
        if (
            response.error?.code === 'INVALID_RESPONSE' ||
            response.error?.code === 'RATE_LIMIT_EXCEEDED' ||
            response.error?.code === 'BUDGET_EXCEEDED'
        ) {
            break;
        }

        // Exponential backoff
        if (attempt < maxRetries) {
            await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
        }
    }

    return lastError!;
}

// ============================================
// COST & USAGE EXPORTS
// ============================================

export function getUserAIUsage(userId: string) {
    return {
        limits: rateLimiter.getUserLimits(userId),
        costs: {
            today: costTracker.getUserDailyCost(userId),
            thisMonth: costTracker.getUserMonthlyCost(userId),
        },
        budget: costTracker.isWithinBudget(userId),
        cache: responseCache.getStats(),
    };
}

export function getSystemAIStats() {
    return {
        costs: costTracker.getSummary(),
        cache: responseCache.getStats(),
    };
}
