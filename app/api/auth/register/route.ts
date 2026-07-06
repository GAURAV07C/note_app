import { registerSchema } from "@/lib/schema";
import { userRepo } from "@/lib/repositories/user";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = registerSchema.safeParse(body);

    if (!result.success) {
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

    const existingUser = await userRepo.findByEmail(email);

    if (existingUser) {
      return Response.json({ error: "Email already exists" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userRepo.create({
      email,
      password: hashedPassword,
    });

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
