import { NextRequest } from "next/server";
import { noteRepo, shareRepo } from "@/lib/repositories";
import { createShareSchema } from "@/lib/schema";
import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import bcrypt from "bcrypt";
import { getAuthenticatedUserId } from "@/lib/api-auth";

export async function POST(
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
    const result = createShareSchema.safeParse(body);

    if (!result.success) {
      const flattened = result.error.flatten();
      const fieldErrors = Object.values(flattened.fieldErrors).flat().filter(Boolean);
      const message =
        fieldErrors.length > 0
          ? fieldErrors.join(", ")
          : flattened.formErrors.join(", ") || "Invalid input";
      return Response.json({ error: message }, { status: 400 });
    }

    const { shareType, accessType, password, expiresAt } = result.data;

    const existingNote = await noteRepo.findById(id);
    if (!existingNote) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    if (existingNote.userId !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const existingShares = await shareRepo.findByNoteId(id);
    const activeShare = existingShares.find(
      (s) => !s.isRevoked && (!s.expiresAt || new Date(s.expiresAt) > new Date())
    );
    if (activeShare) {
      return Response.json(
        { error: "Note already has an active share link. Revoke it first to create a new one." },
        { status: 400 }
      );
    }

    let plainPassword: string | null = null;
    const shareInput: Prisma.ShareCreateWithoutNoteInput = {
      shareType,
      accessType,
    };

    if (expiresAt) {
      const normalized = expiresAt.replace(" ", "T");
      const formats = [normalized];
      const ddMmYyyy = normalized.match(/^(\d{2})-(\d{2})-(\d{4})/);
      if (ddMmYyyy) {
        const [, dd, mm, yyyy] = ddMmYyyy;
        formats.push(`${yyyy}-${mm}-${dd}${normalized.slice(10)}`);
      }

      const parsed = formats
        .map((value) => {
          const date = new Date(value);
          return Number.isNaN(date.getTime()) ? null : date;
        })
        .find((date) => date !== null) ?? null;

      if (!parsed) {
        return Response.json(
          { error: "Invalid datetime format. Use YYYY-MM-DDTHH:MM" },
          { status: 400 }
        );
      }
      shareInput.expiresAt = parsed;
    }

    if (accessType === "PASSWORD") {
      plainPassword = password || Math.random().toString(36).slice(-12);
      shareInput.passwordHash = await bcrypt.hash(plainPassword, 10);
    }

    const share = await prisma.note.update({
      where: { id },
      data: {
        shares: {
          create: shareInput,
        },
      },
      include: {
        shares: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const newShare = share.shares[0];

    const shareLink = `${request.nextUrl.origin}/share/${newShare.token}`;

    return Response.json(
      {
        note: existingNote,
        share: { ...newShare, plainPassword: plainPassword || undefined },
        shareLink,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE_SHARE_ERROR:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
