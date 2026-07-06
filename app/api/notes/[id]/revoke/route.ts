import { NextRequest } from "next/server";
import { shareRepo } from "@/lib/repositories";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isRevoked } = body;

    const share = await shareRepo.update(id, { isRevoked });

    return Response.json({ share }, { status: 200 });
  } catch (error) {
    console.error("REVOKE_SHARE_ERROR:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
