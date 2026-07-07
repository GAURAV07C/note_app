import { NextRequest } from "next/server";
import { auth } from "./auth";
import jwt from "jsonwebtoken";

// Request se authenticated user ID nikalne wala helper function
// Agar session ya JWT token valid hai to user ID return karta hai, warna null
export async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  try {
    // Pehle NextAuth session check kar rahe hai
    const session = await auth();
    if (session?.user?.id) {
      return session.user.id;
    }
  } catch {
    // NextAuth session check fail ho jaye to JWT pe fallback karenge
  }

  // Request header se Bearer token nikal rahe hai
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    if (process.env.JWT_SECRET) {
      try {
        // JWT token verify kar rahe hai
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
        return decoded.userId;
      } catch {
        // Agar token invalid hai to ignore kar denge
      }
    }
  }

  // Koi bhi valid authentication nahi mila
  return null;
}

// Request se client ka IP address nikalne wala helper function
// x-forwarded-for ya x-real-ip header se real IP return karta hai
export function getIpAddress(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")

  if (forwarded) {
    // Multiple IPs ho sakte hai, pehla wala real client hota hai
    return forwarded.split(",")[0].trim()
  }

  if (realIp) {
    return realIp
  }

  return "unknown"
}
