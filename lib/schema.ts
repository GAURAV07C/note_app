import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(8),
});

export const createNoteSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  userId: z.string().cuid().optional(),
  shareType: z.enum(["ONE_TIME", "TIME_BASED"]).optional(),
  accessType: z.enum(["PUBLIC", "PASSWORD"]).optional(),
  password: z.string().optional(),
  expiresAt: z.string().optional(),
});

export const updateNoteSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  userId: z.string().cuid().optional(),
});

export const createShareSchema = z.object({
  noteId: z.string().cuid().optional(),
  shareType: z.enum(["ONE_TIME", "TIME_BASED"]),
  accessType: z.enum(["PUBLIC", "PASSWORD"]),
  password: z.string().optional(),
  expiresAt: z.string().optional(),
});

export const updateShareSchema = z.object({
  shareType: z.enum(["ONE_TIME", "TIME_BASED"]).optional(),
  accessType: z.enum(["PUBLIC", "PASSWORD"]).optional(),
  passwordHash: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  isRevoked: z.boolean().optional(),
  isUsed: z.boolean().optional(),
  viewCount: z.number().int().nonnegative().optional(),
});
