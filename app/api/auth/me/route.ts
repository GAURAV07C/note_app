import jwt from "jsonwebtoken";
import { userRepo } from "@/lib/repositories/user";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET missing");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };

    const user = await userRepo.findById(decoded.userId);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
}
