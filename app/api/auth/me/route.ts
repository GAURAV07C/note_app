import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Response.json({
    user: {
      id: session.user.id,
      email: session.user.email,
    },
  });
}
