import { NextRequest } from "next/server";
import { noteRepo } from "@/lib/repositories";
import { createNoteSchema } from "@/lib/schema";
import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import bcrypt from "bcrypt";
import { getAuthenticatedUserId } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = createNoteSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        { error: result.error.flatten() },
        { status: 400 }
      );
    }

    const { title, content, shareType, accessType, password, expiresAt } =
      result.data;

    let plainPassword: string | null = null;
    let shareData: Prisma.ShareCreateWithoutNoteInput | undefined = undefined;

    if (shareType && accessType) {
      shareData = {
        shareType,
        accessType,
      };

      if (expiresAt) {
        shareData.expiresAt = new Date(expiresAt);
      }

      if (accessType === "PASSWORD") {
        plainPassword = password || Math.random().toString(36).slice(-12);
        shareData.passwordHash = await bcrypt.hash(plainPassword, 10);
      }
    }

    const note = await prisma.note.create({
      data: {
        title,
        content,
        userId: userId,
        shares: shareData
          ? {
              create: shareData,
            }
          : undefined,
      },
      include: {
        shares: true,
      },
    });

    const share = note.shares?.[0] || null;

    const shareLink = share
      ? `${request.nextUrl.origin}/share/${share.token}`
      : null;

    return Response.json(
      {
        note,
        share: share ? { ...share } : null,
        shareLink,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE_NOTE_ERROR:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notes = await noteRepo.findByUserId(userId);

    return Response.json({ notes }, { status: 200 });
  } catch (error) {
    console.error("GET_NOTES_ERROR:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
