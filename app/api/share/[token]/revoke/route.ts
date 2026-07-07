import { NextRequest } from "next/server";
import { shareRepo, noteRepo } from "@/lib/repositories";
import { getAuthenticatedUserId } from "@/lib/api-auth";

// Share link ko revoke karne wala API endpoint
// POST /api/share/:token/revoke - Active share link ko invalid kar deta hai
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    // Step 1: User ko authenticate kar rahe hai
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Step 2: URL se share token nikal rahe hai
    const { token } = await params;

    // Step 3: Database se share data fetch kar rahe hai
    const share = await shareRepo.findByToken(token);

    if (!share) {
      return Response.json({ error: "Invalid share link" }, { status: 404 });
    }

    // Step 4: Note fetch kar rahe hai taaki check kar sake ki share isi user ka hai
    const note = await noteRepo.findById(share.noteId);

    if (!note || note.userId !== userId) {
      return Response.json({ error: "Unauthorized to revoke this share link" }, { status: 403 });
    }

    // Step 5: Pehle se revoke hai ya nahi check kar rahe hai
    if (share.isRevoked) {
      return Response.json({ error: "Share link is already revoked" }, { status: 400 });
    }

    // Step 6: Share link ko revoke kar rahe hai
    await shareRepo.update(share.id, { isRevoked: true });

    return Response.json({ message: "Share link successfully revoked" }, { status: 200 });
  } catch (error) {
    console.error("REVOKE_SHARE_ERROR:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
