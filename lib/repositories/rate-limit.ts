import { getRedis } from "@/lib/redis";

export type RateLimitConfig = {
  limit: number
  window: number
  keyPrefix?: string
}

const DEFAULT_KEY_PREFIX = "noteapp:ratelimit"
const DEFAULT_LIMIT = 10
const DEFAULT_WINDOW = 60

export async function checkRateLimit(identifier: string, config?: RateLimitConfig) {
  const client = getRedis()
  const keyPrefix = config?.keyPrefix ?? DEFAULT_KEY_PREFIX
  const limit = config?.limit ?? DEFAULT_LIMIT
  const window = config?.window ?? DEFAULT_WINDOW

  const key = `${keyPrefix}:${identifier}`
  const now = Math.floor(Date.now() / 1000)
  const windowStart = now - window

  const multi = client.multi()
  multi.zremrangebyscore(key, 0, windowStart)
  multi.zadd(key, now, now.toString())
  multi.zcard(key)
  multi.expire(key, window)

  const results = (await multi.exec()) as unknown as [number, number, number, number]

  const count = results[2] ?? 0
  const ttl = results[3] ?? window
  const remaining = Math.max(0, limit - count)

  return {
    success: count <= limit,
    limit,
    remaining,
    reset: now + ttl,
  }
}

export async function enforceRateLimit(
  identifier: string,
  config?: RateLimitConfig
): Promise<void> {
  const result = await checkRateLimit(identifier, config)

  if (!result.success) {
    throw new RateLimitError(result.reset)
  }
}

export class RateLimitError extends Error {
  retryAfter: number

  constructor(retryAfter: number) {
    super("Too many requests")
    this.name = "RateLimitError"
    this.retryAfter = Math.max(1, retryAfter)
  }
}
