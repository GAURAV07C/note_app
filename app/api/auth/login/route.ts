import { NextRequest } from "next/server";
import { loginSchema } from "@/lib/schema";
import { userRepo } from "@/lib/repositories/user";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { enforceRateLimit, RateLimitError } from "@/lib/repositories/rate-limit";
import { getIpAddress } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      const flattened = result.error.flatten();
      const fieldErrors = Object.values(flattened.fieldErrors).flat().filter(Boolean);
      const message = fieldErrors.length > 0 ? fieldErrors.join(", ") : flattened.formErrors.join(", ") || "Invalid input";
      return Response.json({ error: message }, { status: 400 });
    }

    const email = result.data.email.trim().toLowerCase();
    const password = result.data.password;
    const ip = getIpAddress(request)

    try {
      await enforceRateLimit(`login:${ip}`, { limit: 50, window: 60, keyPrefix: "noteapp:ratelimit:login" });
    } catch (error) {
      if (error instanceof RateLimitError) {
        return Response.json(
          { error: `Too many login attempts. Try again in ${error.retryAfter} seconds.` },
          { status: 429 }
        );
      }
      throw error;
    }



    const user = await userRepo.findByEmail(email);

    if (!user) {
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET missing");
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

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