import { NextRequest } from "next/server";
import { loginSchema } from "@/lib/schema";
import { userRepo } from "@/lib/repositories/user";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { enforceRateLimit, RateLimitError } from "@/lib/repositories/rate-limit";
import { getIpAddress } from "@/lib/api-auth";

// User login karne wala API endpoint
// POST /api/auth/login - Email aur password se login karta hai
export async function POST(request: NextRequest) {
  try {
    // Step 1: Request body se email aur password nikal rahe hai
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      // Agar validation fail ho jaye to error return kar denge
      const flattened = result.error.flatten();
      const fieldErrors = Object.values(flattened.fieldErrors).flat().filter(Boolean);
      const message = fieldErrors.length > 0 ? fieldErrors.join(", ") : flattened.formErrors.join(", ") || "Invalid input";
      return Response.json({ error: message }, { status: 400 });
    }

    const email = result.data.email.trim().toLowerCase();
    const password = result.data.password;
    const ip = getIpAddress(request)

    // Step 2: Rate limit check kar rahe hai - 5 attempts per minute
    try {
      await enforceRateLimit(`login:${ip}`, { limit: 5, window: 60, keyPrefix: "noteapp:ratelimit:login" });
    } catch (error) {
      if (error instanceof RateLimitError) {
        return Response.json(
          { error: `Too many login attempts. Try again in ${error.retryAfter} seconds.` },
          { status: 429 }
        );
      }
      throw error;
    }

    // Step 3: Database se user fetch kar rahe hai email se
    const user = await userRepo.findByEmail(email);

    if (!user) {
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Step 4: Password verify kar rahe hai
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Step 5: JWT token generate kar rahe hai
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET missing");
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    // Step 6: User data aur token return kar rahe hai
    return Response.json(
      {
        user: {
          id: user.id,
          email: user.email,
        },
        token,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("LOGIN_ERROR:", error);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}