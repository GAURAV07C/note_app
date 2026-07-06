import { NextRequest } from "next/server";
import { shareRepo, noteRepo } from "@/lib/repositories";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { password } = body;

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

    if (share.accessType !== "PASSWORD") {
      return Response.json({ error: "This share link does not require a password" }, { status: 400 });
    }

    if (!share.passwordHash) {
      return Response.json({ error: "Password not set for this share link" }, { status: 500 });
    }

    const isPasswordValid = await bcrypt.compare(password, share.passwordHash);

    if (!isPasswordValid) {
      return Response.json({ error: "Invalid password" }, { status: 401 });
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

    const note = await noteRepo.findById(updatedShare.noteId);

    if (!note) {
      return Response.json({ error: "Note not found" }, { status: 404 });
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
    console.error("UNLOCK_SHARE_ERROR:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
