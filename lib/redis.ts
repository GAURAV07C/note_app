// Redis client singleton
// Upstash Redis ke saath interact karne ke liye helper function
import Redis from "ioredis";

// Redis instance ko cache kar rahe hai taaki har baar naya connection na banaye
let redis: Redis | null = null;

// Redis client return karta hai, pehle se exist karta hai to wahi return karega
// Nahi to naya instance banake store kar lega
export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.UPSTASH_REDIS_URL!);
  }
  return redis;
}
