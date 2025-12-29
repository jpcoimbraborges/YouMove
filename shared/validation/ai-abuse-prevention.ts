/**
 * YOUMOVE - AI Abuse Prevention
 * 
 * Protects against AI abuse and ensures fair usage.
 * Implements rate limiting, content filtering, and cost controls.
 */

// ============================================
// TYPES
// ============================================

export interface AbuseCheckResult {
    allowed: boolean;
    reason?: string;
    wait_seconds?: number;
    violation_type?: ViolationType;
}

export type ViolationType =
    | 'rate_limit'
    | 'budget_exceeded'
    | 'content_violation'
    | 'suspicious_pattern'
    | 'account_flagged';

export interface UserAIHistory {
    user_id: string;
    requests_today: number;
    requests_this_hour: number;
    total_tokens_today: number;
    cost_today_usd: number;
    cost_this_month_usd: number;
    last_request_at: number;
    consecutive_failures: number;
    flagged_until: number | null;
    violations: UserViolation[];
}

export interface UserViolation {
    timestamp: number;
    type: ViolationType;
    details: string;
}

// ============================================
// LIMITS
// ============================================

export const AI_LIMITS = {
    // Rate limits
    MAX_REQUESTS_PER_HOUR: 30,
    MAX_REQUESTS_PER_DAY: 100,
    MIN_INTERVAL_MS: 1000, // 1 second between requests

    // Budget limits
    MAX_TOKENS_PER_DAY: 50000,
    MAX_COST_PER_DAY_USD: 0.50,
    MAX_COST_PER_MONTH_USD: 5.00,

    // Content limits
    MAX_INPUT_LENGTH: 5000,
    MAX_PROMPT_INJECTION_SCORE: 3,

    // Failure limits
    MAX_CONSECUTIVE_FAILURES: 5,
    FAILURE_COOLDOWN_MINUTES: 5,

    // Flagging
    FLAG_DURATION_HOURS: 24,
    VIOLATIONS_THRESHOLD: 5,
} as const;

// ============================================
// USER HISTORY STORAGE
// ============================================

const userHistories: Map<string, UserAIHistory> = new Map();

function getUserHistory(userId: string): UserAIHistory {
    const existing = userHistories.get(userId);

    if (existing) {
        // Reset daily counters if new day
        const now = Date.now();
        const lastRequest = new Date(existing.last_request_at);
        const today = new Date(now);

        if (lastRequest.toDateString() !== today.toDateString()) {
            existing.requests_today = 0;
            existing.total_tokens_today = 0;
            existing.cost_today_usd = 0;
            existing.consecutive_failures = 0;
        }

        // Reset hourly counter if new hour
        if (Math.floor(now / 3600000) !== Math.floor(existing.last_request_at / 3600000)) {
            existing.requests_this_hour = 0;
        }

        // Reset monthly cost if new month
        if (lastRequest.getMonth() !== today.getMonth()) {
            existing.cost_this_month_usd = 0;
        }

        return existing;
    }

    const newHistory: UserAIHistory = {
        user_id: userId,
        requests_today: 0,
        requests_this_hour: 0,
        total_tokens_today: 0,
        cost_today_usd: 0,
        cost_this_month_usd: 0,
        last_request_at: 0,
        consecutive_failures: 0,
        flagged_until: null,
        violations: [],
    };

    userHistories.set(userId, newHistory);
    return newHistory;
}

function updateUserHistory(userId: string, update: Partial<UserAIHistory>): void {
    const history = getUserHistory(userId);
    Object.assign(history, update);
    userHistories.set(userId, history);
}

// ============================================
// ABUSE CHECKS
// ============================================

/**
 * Main abuse check before AI request
 */
export function checkAIAbuse(
    userId: string,
    input: string,
    requestType: string
): AbuseCheckResult {
    const history = getUserHistory(userId);
    const now = Date.now();

    // Check if user is flagged
    if (history.flagged_until && now < history.flagged_until) {
        const waitSeconds = Math.ceil((history.flagged_until - now) / 1000);
        return {
            allowed: false,
            reason: 'Conta temporariamente suspensa devido a violações',
            wait_seconds: waitSeconds,
            violation_type: 'account_flagged',
        };
    }

    // Check rate limits
    const rateCheck = checkRateLimit(history, now);
    if (!rateCheck.allowed) return rateCheck;

    // Check budget
    const budgetCheck = checkBudget(history);
    if (!budgetCheck.allowed) return budgetCheck;

    // Check content
    const contentCheck = checkContent(input);
    if (!contentCheck.allowed) {
        recordViolation(userId, 'content_violation', 'Conteúdo suspeito detectado');
        return contentCheck;
    }

    // Check for suspicious patterns
    const patternCheck = checkPatterns(history, requestType);
    if (!patternCheck.allowed) {
        recordViolation(userId, 'suspicious_pattern', 'Padrão de uso suspeito');
        return patternCheck;
    }

    return { allowed: true };
}

/**
 * Check rate limits
 */
function checkRateLimit(history: UserAIHistory, now: number): AbuseCheckResult {
    // Check minimum interval
    if (now - history.last_request_at < AI_LIMITS.MIN_INTERVAL_MS) {
        return {
            allowed: false,
            reason: 'Aguarde um momento entre requisições',
            wait_seconds: 1,
            violation_type: 'rate_limit',
        };
    }

    // Check hourly limit
    if (history.requests_this_hour >= AI_LIMITS.MAX_REQUESTS_PER_HOUR) {
        const waitSeconds = 3600 - (now % 3600000) / 1000;
        return {
            allowed: false,
            reason: `Limite de ${AI_LIMITS.MAX_REQUESTS_PER_HOUR} requisições por hora atingido`,
            wait_seconds: Math.ceil(waitSeconds),
            violation_type: 'rate_limit',
        };
    }

    // Check daily limit
    if (history.requests_today >= AI_LIMITS.MAX_REQUESTS_PER_DAY) {
        return {
            allowed: false,
            reason: `Limite de ${AI_LIMITS.MAX_REQUESTS_PER_DAY} requisições por dia atingido`,
            violation_type: 'rate_limit',
        };
    }

    // Check consecutive failures
    if (history.consecutive_failures >= AI_LIMITS.MAX_CONSECUTIVE_FAILURES) {
        return {
            allowed: false,
            reason: 'Muitas falhas consecutivas. Aguarde alguns minutos.',
            wait_seconds: AI_LIMITS.FAILURE_COOLDOWN_MINUTES * 60,
            violation_type: 'rate_limit',
        };
    }

    return { allowed: true };
}

/**
 * Check budget limits
 */
function checkBudget(history: UserAIHistory): AbuseCheckResult {
    if (history.cost_today_usd >= AI_LIMITS.MAX_COST_PER_DAY_USD) {
        return {
            allowed: false,
            reason: 'Limite de uso diário atingido. Tente novamente amanhã.',
            violation_type: 'budget_exceeded',
        };
    }

    if (history.cost_this_month_usd >= AI_LIMITS.MAX_COST_PER_MONTH_USD) {
        return {
            allowed: false,
            reason: 'Limite de uso mensal atingido.',
            violation_type: 'budget_exceeded',
        };
    }

    if (history.total_tokens_today >= AI_LIMITS.MAX_TOKENS_PER_DAY) {
        return {
            allowed: false,
            reason: 'Limite de tokens diário atingido.',
            violation_type: 'budget_exceeded',
        };
    }

    return { allowed: true };
}

/**
 * Check content for prompt injection and abuse
 */
function checkContent(input: string): AbuseCheckResult {
    // Check length
    if (input.length > AI_LIMITS.MAX_INPUT_LENGTH) {
        return {
            allowed: false,
            reason: 'Entrada muito longa',
            violation_type: 'content_violation',
        };
    }

    // Check for prompt injection patterns
    const injectionScore = detectPromptInjection(input);
    if (injectionScore >= AI_LIMITS.MAX_PROMPT_INJECTION_SCORE) {
        return {
            allowed: false,
            reason: 'Conteúdo não permitido detectado',
            violation_type: 'content_violation',
        };
    }

    return { allowed: true };
}

/**
 * Detect prompt injection attempts
 */
function detectPromptInjection(input: string): number {
    let score = 0;
    const lower = input.toLowerCase();

    // Common injection patterns
    const patterns = [
        /ignore\s+(previous|all|the)\s+(instructions|prompts)/i,
        /you\s+are\s+(now|no\s+longer)/i,
        /forget\s+(everything|what|your)/i,
        /new\s+instructions/i,
        /disregard\s+(the|all|previous)/i,
        /override\s+(the|your)/i,
        /pretend\s+(to\s+be|you\s+are)/i,
        /act\s+as\s+(if|a)/i,
        /system\s*:\s*/i,
        /\[system\]/i,
        /<\/?system>/i,
        /jailbreak/i,
        /DAN\s+mode/i,
    ];

    for (const pattern of patterns) {
        if (pattern.test(input)) {
            score += 2;
        }
    }

    // Check for excessive special characters
    const specialChars = (input.match(/[{}[\]<>|\\`]/g) || []).length;
    if (specialChars > input.length * 0.1) {
        score += 1;
    }

    // Check for very long words (potential obfuscation)
    const words = input.split(/\s+/);
    const longWords = words.filter(w => w.length > 50).length;
    if (longWords > 0) {
        score += 1;
    }

    return score;
}

/**
 * Check for suspicious usage patterns
 */
function checkPatterns(history: UserAIHistory, requestType: string): AbuseCheckResult {
    // Check for too many violations
    const recentViolations = history.violations.filter(
        v => Date.now() - v.timestamp < 24 * 60 * 60 * 1000
    ).length;

    if (recentViolations >= AI_LIMITS.VIOLATIONS_THRESHOLD) {
        return {
            allowed: false,
            reason: 'Muitas violações recentes. Conta temporariamente limitada.',
            violation_type: 'suspicious_pattern',
        };
    }

    return { allowed: true };
}

// ============================================
// RECORDING
// ============================================

/**
 * Record a successful request
 */
export function recordAIRequest(
    userId: string,
    tokens: number,
    costUsd: number
): void {
    const history = getUserHistory(userId);

    updateUserHistory(userId, {
        requests_today: history.requests_today + 1,
        requests_this_hour: history.requests_this_hour + 1,
        total_tokens_today: history.total_tokens_today + tokens,
        cost_today_usd: history.cost_today_usd + costUsd,
        cost_this_month_usd: history.cost_this_month_usd + costUsd,
        last_request_at: Date.now(),
        consecutive_failures: 0,
    });
}

/**
 * Record a failed request
 */
export function recordAIFailure(userId: string): void {
    const history = getUserHistory(userId);

    updateUserHistory(userId, {
        consecutive_failures: history.consecutive_failures + 1,
        last_request_at: Date.now(),
    });
}

/**
 * Record a violation
 */
export function recordViolation(
    userId: string,
    type: ViolationType,
    details: string
): void {
    const history = getUserHistory(userId);

    history.violations.push({
        timestamp: Date.now(),
        type,
        details,
    });

    // Flag account if too many violations
    const recentViolations = history.violations.filter(
        v => Date.now() - v.timestamp < 24 * 60 * 60 * 1000
    ).length;

    if (recentViolations >= AI_LIMITS.VIOLATIONS_THRESHOLD) {
        history.flagged_until = Date.now() + AI_LIMITS.FLAG_DURATION_HOURS * 60 * 60 * 1000;
    }

    userHistories.set(userId, history);
}

// ============================================
// USER LIMITS INFO
// ============================================

export function getUserAILimits(userId: string): {
    requests_remaining_today: number;
    requests_remaining_hour: number;
    tokens_remaining_today: number;
    budget_remaining_today_usd: number;
    budget_remaining_month_usd: number;
    is_flagged: boolean;
    can_make_request: boolean;
} {
    const history = getUserHistory(userId);
    const now = Date.now();

    return {
        requests_remaining_today: Math.max(0, AI_LIMITS.MAX_REQUESTS_PER_DAY - history.requests_today),
        requests_remaining_hour: Math.max(0, AI_LIMITS.MAX_REQUESTS_PER_HOUR - history.requests_this_hour),
        tokens_remaining_today: Math.max(0, AI_LIMITS.MAX_TOKENS_PER_DAY - history.total_tokens_today),
        budget_remaining_today_usd: Math.max(0, AI_LIMITS.MAX_COST_PER_DAY_USD - history.cost_today_usd),
        budget_remaining_month_usd: Math.max(0, AI_LIMITS.MAX_COST_PER_MONTH_USD - history.cost_this_month_usd),
        is_flagged: history.flagged_until !== null && now < history.flagged_until,
        can_make_request: checkAIAbuse(userId, '', 'check').allowed,
    };
}

// ============================================
// EXPORT
// ============================================

export {
    AI_LIMITS,
    checkAIAbuse,
    recordAIRequest,
    recordAIFailure,
    recordViolation,
    getUserAILimits,
};
