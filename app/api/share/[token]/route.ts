import { NextRequest } from "next/server";
import { shareRepo, noteRepo } from "@/lib/repositories";
import prisma from "@/lib/prisma";
import { enforceRateLimit, RateLimitError } from "@/lib/repositories/rate-limit";
import { getIpAddress } from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const ip = getIpAddress(request);

    try {
      await enforceRateLimit(`share:access:${token}:${ip}`, { limit: 30, window: 60, keyPrefix: "noteapp:ratelimit:share" });
    } catch (error) {
      if (error instanceof RateLimitError) {
        return Response.json(
          { error: `Too many requests. Try again in ${error.retryAfter} seconds.` },
          { status: 429 }
        );
      }
      throw error;
    }

    const share = await shareRepo.findByToken(token);

    if (!share) {
      return Response.json({ error: "Invalid share link" }, { status: 404 });
    }

    if (share.isRevoked) {
      return Response.json({ error: "Share link has been revoked" }, { status: 403 });
    }

    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return Response.json({ error: "Share link has expired" }, { status: 410 });
    }

    if (share.isUsed) {
      return Response.json({ error: "Share link has already been used" }, { status: 403 });
    }

    if (share.accessType === "PASSWORD") {
      return Response.json(
        {
          requiresPassword: true,
          noteId: share.noteId,
        },
        { status: 200 }
      );
    }

    const note = await noteRepo.findById(share.noteId);

    if (!note) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

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
