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
    // NextAuth session check fail ho jaye to JWT pe fallback karenge
  }

  const sessionCookie = request.cookies.get("session")?.value;
  if (sessionCookie && process.env.JWT_SECRET) {
    try {
      const decoded = jwt.verify(sessionCookie, process.env.JWT_SECRET) as { userId: string };
      return decoded.userId;
    } catch {
      // Agar token invalid hai to ignore kar denge
    }
  }

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
