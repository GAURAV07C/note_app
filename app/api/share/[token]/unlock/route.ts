import { NextRequest } from "next/server";
import { shareRepo, noteRepo } from "@/lib/repositories";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import {
  enforceRateLimit,
  RateLimitError,
} from "@/lib/repositories/rate-limit";
import { getIpAddress } from "@/lib/api-auth";

// Password protected share link ko unlock karne wala API endpoint
// POST /api/share/:token/unlock - Password daalkar password protected note access karta hai
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    // Step 1: URL se share token nikal rahe hai
    const { token } = await params;
    const body = await request.json();
    const { password } = body;
    const ip = getIpAddress(request);

    // Step 2: Rate limit check kar rahe hai - 5 attempts per minute
    try {
      await enforceRateLimit(`share:unlock:${token}:${ip}`, {
        limit: 5,
        window: 60,
        keyPrefix: "noteapp:ratelimit:share",
      });
    } catch (error) {
      if (error instanceof RateLimitError) {
        return Response.json(
          {
            error: `Too many attempts. Try again in ${error.retryAfter} seconds.`,
          },
          { status: 429 },
        );
      }
      throw error;
    }

    // Step 3: Database se share data fetch kar rahe hai
    const share = await shareRepo.findByToken(token);

    if (!share) {
      return Response.json({ error: "Invalid share link" }, { status: 404 });
    }

    // Step 4: Share link revoked hai ya nahi check kar rahe hai
    if (share.isRevoked) {
      return Response.json(
        { error: "Share link has been revoked" },
        { status: 403 },
      );
    }

    // Step 5: Share link expire ho gaya hai ya nahi check kar rahe hai
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return Response.json(
        { error: "Share link has expired" },
        { status: 410 },
      );
    }

    // Step 6: Share link pehle se use ho chuka hai ya nahi check kar rahe hai
    if (share.isUsed) {
      return Response.json(
        { error: "Share link has already been used" },
        { status: 403 },
      );
    }

    // Step 7: Check kar rahe hai ki share link password protected hai
    if (share.accessType !== "PASSWORD") {
      return Response.json(
        { error: "This share link does not require a password" },
        { status: 400 },
      );
    }

    // Step 8: Password hash exist karta hai ya nahi check kar rahe hai
    if (!share.passwordHash) {
      return Response.json(
        { error: "Password not set for this share link" },
        { status: 500 },
      );
    }

    // Step 9: Password verify kar rahe hai
    const isPasswordValid = await bcrypt.compare(password, share.passwordHash);

    if (!isPasswordValid) {
      return Response.json({ error: "Invalid password" }, { status: 401 });
    }

    // Step 10: Share type ke according view count update kar rahe hai
    if (share.shareType === "ONE_TIME") {
      const updateResult = await prisma.share.updateMany({
        where: { id: share.id, isUsed: false },
        data: {
          isUsed: true,
          viewCount: { increment: 1 },
        },
      });

      if (updateResult.count === 0) {
        return Response.json(
          { error: "Share link has already been used" },
          { status: 403 },
        );
      }
    } else if (share.shareType === "TIME_BASED") {
      await prisma.share.update({
        where: { id: share.id },
        data: {
          viewCount: { increment: 1 },
        },
      });
    }

    // Step 11: Updated share data fetch kar rahe hai
    const updatedShare = await shareRepo.findById(share.id);

    if (!updatedShare) {
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }

    // Step 12: Note fetch kar rahe hai
    const note = await noteRepo.findById(updatedShare.noteId);

    if (!note) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    // Step 13: Note data return kar rahe hai with summary
    return Response.json(
      {
        note: {
          ...note,
          constentSummary: note.constentSummary,
        },
        shareType: share.shareType,
        accessType: share.accessType,
        viewCount: updatedShare.viewCount,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("UNLOCK_SHARE_ERROR:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
