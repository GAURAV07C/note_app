// Zod validation schemas
// Saare API endpoints ke liye input validation rules yahan define kiye gaye hai
import { z } from "zod";

// User registration ke liye schema
// Email valid hona chahiye, password minimum 8 characters ka hona chahiye
export const registerSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(8).max(128),
});

// User login ke liye schema
// Email valid hona chahiye, password minimum 8 characters ka hona chahiye
export const loginSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(8),
});

// Naya note create karne ke liye schema
// Title aur content required hai, baaki optional share settings
export const createNoteSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  userId: z.string().cuid().optional(),
  shareType: z.enum(["ONE_TIME", "TIME_BASED"]).optional(),
  accessType: z.enum(["PUBLIC", "PASSWORD"]).optional(),
  password: z.string().optional(),
  expiresAt: z.string().optional(),
});

// Existing note update karne ke liye schema
// Title aur content dono optional hai, user sirf jo update karna chahta hai wo bhej sakta hai
export const updateNoteSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  userId: z.string().cuid().optional(),
});

// Share link create karne ke liye schema
export const createShareSchema = z.object({
  noteId: z.string().cuid().optional(),
  shareType: z.enum(["ONE_TIME", "TIME_BASED"]),
  accessType: z.enum(["PUBLIC", "PASSWORD"]),
  password: z.string().optional(),
  expiresAt: z.string().optional(),
});

// Existing share update karne ke liye schema
export const updateShareSchema = z.object({
  shareType: z.enum(["ONE_TIME", "TIME_BASED"]).optional(),
  accessType: z.enum(["PUBLIC", "PASSWORD"]).optional(),
  passwordHash: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  isRevoked: z.boolean().optional(),
  isUsed: z.boolean().optional(),
  viewCount: z.number().int().nonnegative().optional(),
});
