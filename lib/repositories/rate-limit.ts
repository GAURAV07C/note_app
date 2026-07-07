// Rate limiting utility
// Redis ke through API requests par rate limit enforce karta hai
import { getRedis } from "@/lib/redis";

// Rate limit configuration ka type
export type RateLimitConfig = {
  limit: number;
  window: number;
  keyPrefix?: string;
};

// Default rate limit values
const DEFAULT_KEY_PREFIX = "noteapp:ratelimit";
const DEFAULT_LIMIT = 5;
const DEFAULT_WINDOW = 60;

// Rate limit reset karne wala function
// Kisi bhi identifier ke liye stored rate limit clear kar deta hai
export async function resetRateLimit(
  identifier: string,
  config?: RateLimitConfig,
): Promise<void> {
  try {
    const client = getRedis();
    const keyPrefix = config?.keyPrefix ?? DEFAULT_KEY_PREFIX;
    const key = `${keyPrefix}:${identifier}`;
    await client.del(key);
  } catch {
    // ignore
  }
}

// Rate limit check karne wala function
// Request allowed hai ya nahi yeh batata hai
export async function checkRateLimit(
  identifier: string,
  config?: RateLimitConfig,
) {
  try {
    const client = getRedis();
    const keyPrefix = config?.keyPrefix ?? DEFAULT_KEY_PREFIX;
    const limit = config?.limit ?? DEFAULT_LIMIT;
    const window = config?.window ?? DEFAULT_WINDOW;

    const key = `${keyPrefix}:${identifier}`;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - window;
    const uniqueMemberId = `${Date.now()}-${Math.random()}`;

    // Redis sorted set use karke sliding window implement kar rahe hai
    const multi = client.multi();
    multi.zremrangebyscore(key, 0, windowStart);
    multi.zadd(key, now, uniqueMemberId);
    multi.zcard(key);
    multi.expire(key, window);

    const rawResults = await multi.exec();

    if (!rawResults || rawResults.length < 4) {
      throw new Error("Rate limit check failed");
    }

    const results = rawResults.map((r) => {
      if (r[0]) throw r[0];
      return Number(r[1]) || 0;
    }) as number[];

    const count = results[2] || 0;

    const ttl = results[3] || window;
    const remaining = Math.max(0, limit - count);

    return {
      success: count <= limit,
      limit,
      remaining,
      reset: now + (ttl > 0 ? ttl : window),
    };
  } catch (error) {
    console.error("DEBUG Rate limiter error:", error);
    return {
      success: true,
      limit: config?.limit ?? DEFAULT_LIMIT,
      remaining: config?.limit ?? DEFAULT_LIMIT,
      reset: Math.floor(Date.now() / 1000) + (config?.window ?? DEFAULT_WINDOW),
    };
  }
}

// Rate limit enforce karne wala function
// Agar limit cross ho jaye to error throw karta hai
export async function enforceRateLimit(
  identifier: string,
  config?: RateLimitConfig,
): Promise<void> {
  const result = await checkRateLimit(identifier, config);

  if (!result.success) {
    throw new RateLimitError(
      Math.max(1, result.reset - Math.floor(Date.now() / 1000)),
    );
  }
}

// Rate limit exceed ho jane par throw hone wala custom error class
export class RateLimitError extends Error {
  retryAfter: number;

  constructor(retryAfter: number) {
    const safeRetryAfter = Number.isFinite(retryAfter)
      ? Math.max(1, Math.floor(retryAfter))
      : 60;
    super(`Too many requests. Try again in ${safeRetryAfter} seconds.`);
    this.name = "RateLimitError";
    this.retryAfter = safeRetryAfter;
  }
}
