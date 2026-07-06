import Redis from "ioredis";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.UPSTASH_REDIS_URL!);
  }
  return redis;
}
