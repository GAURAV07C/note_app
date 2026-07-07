import { NextRequest } from "next/server";
import { shareRepo, noteRepo } from "@/lib/repositories";
import prisma from "@/lib/prisma";
import { enforceRateLimit, RateLimitError } from "@/lib/repositories/rate-limit";
import { getIpAddress } from "@/lib/api-auth";

// Share link ke through note access karne wala API endpoint
// GET /api/share/:token - Share link ke through note view karta hai
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    // Step 1: URL se share token nikal rahe hai
    const { token } = await params;
    const ip = getIpAddress(request);

    // Step 2: Rate limit check kar rahe hai - 30 requests per minute
    try {
      await enforceRateLimit(`share:access:${token}:${ip}`, { limit: 10, window: 60, keyPrefix: "noteapp:ratelimit:share" });
    } catch (error) {
      if (error instanceof RateLimitError) {
        return Response.json(
          { error: `Too many requests. Try again in ${error.retryAfter} seconds.` },
          { status: 429 }
        );
      }
      throw error;
    }

    // Step 3: Database se share data fetch kar rahe hai token se
    const share = await shareRepo.findByToken(token);

    if (!share) {
      return Response.json({ error: "Invalid share link" }, { status: 404 });
    }

    // Step 4: Share link revoked hai ya nahi check kar rahe hai
    if (share.isRevoked) {
      return Response.json({ error: "Share link has been revoked" }, { status: 403 });
    }

    // Step 5: Share link expire ho gaya hai ya nahi check kar rahe hai
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return Response.json({ error: "Share link has expired" }, { status: 410 });
    }

    // Step 6: Share link pehle se use ho chuka hai ya nahi check kar rahe hai
    if (share.isUsed) {
      return Response.json({ error: "Share link has already been used" }, { status: 403 });
    }

    // Step 7: Password protected share hai to password required response denge
    if (share.accessType === "PASSWORD") {
      return Response.json(
        {
          requiresPassword: true,
          noteId: share.noteId,
        },
        { status: 200 }
      );
    }

    // Step 8: Note fetch kar rahe hai
    const note = await noteRepo.findById(share.noteId);

    if (!note) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    // Step 9: Share type ke according view count update kar rahe hai
    if (share.shareType === "ONE_TIME") {
      const updateResult = await prisma.share.updateMany({
        where: { id: share.id, isUsed: false },
        data: {
          isUsed: true,
          viewCount: { increment: 1 },
        },
      });

      if (updateResult.count === 0) {
        return Response.json({ error: "Share link has already been used" }, { status: 403 });
      }
    } else if (share.shareType === "TIME_BASED") {
      await prisma.share.update({
        where: { id: share.id },
        data: {
          viewCount: { increment: 1 },
        },
      });
    }

    const updatedShare = await shareRepo.findById(share.id);

    if (!updatedShare) {
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }

    // Step 10: Note data return kar rahe hai
    return Response.json(
      {
        note,
        shareType: share.shareType,
        accessType: share.accessType,
        viewCount: updatedShare.viewCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET_SHARE_ERROR:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
