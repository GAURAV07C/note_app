import { registerSchema } from "@/lib/schema";
import { userRepo } from "@/lib/repositories/user";
import bcrypt from "bcrypt";

// Naya user banane wala API endpoint
// POST /api/auth/register - Naye user ka account create karta hai
export async function POST(request: Request) {
  try {
    // Step 1: Request body se email aur password nikal rahe hai
    const body = await request.json();

    const result = registerSchema.safeParse(body);

    if (!result.success) {
      // Agar validation fail ho jaye to error return kar denge
      const flattened = result.error.flatten();
      const fieldErrors = Object.values(flattened.fieldErrors).flat().filter(Boolean);
      const message = fieldErrors.length > 0 ? fieldErrors.join(", ") : flattened.formErrors.join(", ") || "Invalid input";
      return Response.json(
        {
          error: message,
        },
        { status: 400 },
      );
    }

    const email = result.data.email.trim().toLowerCase();
    const password = result.data.password;

    // Step 2: Pehle se hi email exist karta hai ya nahi check kar rahe hai
    const existingUser = await userRepo.findByEmail(email);

    if (existingUser) {
      return Response.json({ error: "Email already exists" }, { status: 409 });
    }

    // Step 3: Password hash kar rahe hai
    const hashedPassword = await bcrypt.hash(password, 10);

    // Step 4: Naya user database mein create kar rahe hai
    const user = await userRepo.create({
      email,
      password: hashedPassword,
    });

    // Step 5: User data return kar rahe hai
    return Response.json(
      {
        user: {
          id: user.id,
          email: user.email,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("REGISTER_ERROR:", error);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
