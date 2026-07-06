import { NextRequest } from "next/server";
import { auth } from "./auth";
import jwt from "jsonwebtoken";

export async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  try {
    const session = await auth();
    if (session?.user?.id) {
      return session.user.id;
    }
  } catch {
    // NextAuth session check failed, fall back to JWT
  }

  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    if (process.env.JWT_SECRET) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
        return decoded.userId;
      } catch {
        // invalid JWT
      }
    }
  }

  return null;
}

export function getIpAddress(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")

  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }

  if (realIp) {
    return realIp
  }

  return "unknown"
}
