import jwt from "jsonwebtoken";
import { userRepo } from "@/lib/repositories/user";

// Current logged in user ka data fetch karne wala API endpoint
// GET /api/auth/me - JWT token se current user ka information return karta hai
export async function GET(request: Request) {
  try {
    // Step 1: Request header se Authorization token nikal rahe hai
    const authHeader = request.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);

    // Step 2: JWT token verify kar rahe hai
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET missing");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };

    // Step 3: Database se user fetch kar rahe hai
    const user = await userRepo.findById(decoded.userId);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Step 4: User data return kar rahe hai
    return Response.json({
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
}
