import { NextRequest } from "next/server";
import { shareRepo, noteRepo } from "@/lib/repositories";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const share = await shareRepo.findByToken(token);

    if (!share) {
      return Response.json({ error: "Invalid share link" }, { status: 404 });
    }

    const note = await noteRepo.findById(share.noteId);

    if (!note || note.userId !== userId) {
      return Response.json({ error: "Unauthorized to revoke this share link" }, { status: 403 });
    }

    if (share.isRevoked) {
      return Response.json({ error: "Share link is already revoked" }, { status: 400 });
    }

    await shareRepo.update(share.id, { isRevoked: true });

    return Response.json({ message: "Share link successfully revoked" }, { status: 200 });
  } catch (error) {
    console.error("REVOKE_SHARE_ERROR:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
