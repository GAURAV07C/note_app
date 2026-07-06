import { NextRequest } from "next/server";
import { shareRepo, noteRepo } from "@/lib/repositories";
import { getAuthenticatedUserId } from "@/lib/api-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { isRevoked } = body;

    const share = await shareRepo.findById(id);

    if (!share) {
      return Response.json({ error: "Share not found" }, { status: 404 });
    }

    const note = await noteRepo.findById(share.noteId);

    if (!note || note.userId !== userId) {
      return Response.json({ error: "Unauthorized to revoke this share link" }, { status: 403 });
    }

    if (share.isRevoked) {
      return Response.json({ error: "Share link is already revoked" }, { status: 400 });
    }

    const updated = await shareRepo.update(share.id, { isRevoked });

    return Response.json({ share: updated }, { status: 200 });
  } catch (error) {
    console.error("REVOKE_SHARE_ERROR:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
