import { NextRequest } from "next/server";
import { noteRepo, shareRepo } from "@/lib/repositories";
import { createShareSchema } from "@/lib/schema";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import { getAuthenticatedUserId } from "@/lib/api-auth";
import { parseLocalDateTime } from "@/lib/utils";

// Note ke liye share link create karne wala API endpoint
// POST /api/notes/:id/share - Note ko share karne ka link banata hai
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Step 1: User ko authenticate kar rahe hai
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Step 2: URL se note ID nikal rahe hai
    const { id } = await params;
    const body = await request.json();
    const result = createShareSchema.safeParse(body);

    if (!result.success) {
      // Agar validation fail ho jaye to error return kar denge
      const flattened = result.error.flatten();
      const fieldErrors = Object.values(flattened.fieldErrors).flat().filter(Boolean);
      const message =
        fieldErrors.length > 0
          ? fieldErrors.join(", ")
          : flattened.formErrors.join(", ") || "Invalid input";
      console.error("DEBUG validation error:", message);
      return Response.json({ error: message }, { status: 400 });
    }

    const { shareType, accessType, password, expiresAt } = result.data;

    // Step 3: Note exist karta hai ya nahi check kar rahe hai
    const existingNote = await noteRepo.findById(id);
    if (!existingNote) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    // Step 4: Check kar rahe hai ki note isi user ka hai
    if (existingNote.userId !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Step 5: Pehle se active share link hai ya nahi check kar rahe hai
    const existingShares = await shareRepo.findByNoteId(id);
    const activeShare = existingShares.find(
      (s: { isRevoked: boolean; expiresAt: Date | null }) => !s.isRevoked && (!s.expiresAt || new Date(s.expiresAt) > new Date())
    );
    if (activeShare) {
      console.error("DEBUG activeShare error for noteId", id);
      return Response.json(
        { error: "Note already has an active share link. Revoke it first to create a new one." },
        { status: 400 }
      );
    }

    // Step 6: Share settings ke liye variables initialize kar rahe hai
    let plainPassword: string | null = null;
    const shareInput: Prisma.ShareCreateWithoutNoteInput = {
      shareType,
      accessType,
    };

    // Step 7: Expiry date parse kar rahe hai
    if (expiresAt) {
      const parsed = parseLocalDateTime(expiresAt);

      if (!parsed) {
        return Response.json(
          { error: "Invalid datetime format. Use YYYY-MM-DDTHH:MM" },
          { status: 400 }
        );
      }
      shareInput.expiresAt = parsed;
    }

    // Step 8: Password type share ke liye hash generate kar rahe hai
    if (accessType === "PASSWORD") {
      plainPassword = password || Math.random().toString(36).slice(-12);
      shareInput.passwordHash = await bcrypt.hash(plainPassword, 10);
    }

    // Step 9: Note ke saath share link create kar rahe hai
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

    // Step 10: Share link generate kar rahe hai
    const shareLink = `${request.nextUrl.origin}/share/${newShare.token}`;

    return Response.json(
      {
        note: existingNote,
        share: newShare,
        shareLink,
        plainPassword: plainPassword || undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE_SHARE_ERROR:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
