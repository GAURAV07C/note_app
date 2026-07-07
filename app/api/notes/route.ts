import { NextRequest } from "next/server";
import { noteRepo } from "@/lib/repositories";
import { createNoteSchema } from "@/lib/schema";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import { getAuthenticatedUserId } from "@/lib/api-auth";

// Naye note banane wala API endpoint
// POST /api/notes - Login user ke liye nayi note create karta hai
export async function POST(request: NextRequest) {
  try {
    // Step 1: Request se user ID nikalna hai
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Step 2: Request body se data parse kar rahe hai
    const body = await request.json();
    const result = createNoteSchema.safeParse(body);

    if (!result.success) {
      // Agar validation fail ho jaye to error return kar denge
      const flattened = result.error.flatten();
      const fieldErrors = Object.values(flattened.fieldErrors).flat().filter(Boolean);
      const message = fieldErrors.length > 0 ? fieldErrors.join(", ") : flattened.formErrors.join(", ") || "Invalid input";
      return Response.json(
        { error: message },
        { status: 400 }
      );
    }

    const { title, content, shareType, accessType, password, expiresAt } =
      result.data;

    // Step 3: Share settings ke liye variables initialize kar rahe hai
    let plainPassword: string | null = null;
    let shareData: Prisma.ShareCreateWithoutNoteInput | undefined = undefined;

    // Agar share settings di gayi hai to process karenge
    const resolvedShareType = shareType || (accessType ? "TIME_BASED" : undefined);

    if (resolvedShareType && accessType) {
      shareData = {
        shareType: resolvedShareType,
        accessType,
      };

      // Expiry date parse kar rahe hai
      if (expiresAt) {
        const normalized = expiresAt.replace(" ", "T");
        const formats = [normalized];
        const ddMmYyyy = normalized.match(/^(\d{2})-(\d{2})-(\d{4})/);
        if (ddMmYyyy) {
          const [, dd, mm, yyyy] = ddMmYyyy;
          formats.push(`${yyyy}-${mm}-${dd}${normalized.slice(10)}`);
        }

        const parsed = formats.map((value) => {
          const date = new Date(value);
          return Number.isNaN(date.getTime()) ? null : date;
        }).find((date) => date !== null) ?? null;

        if (!parsed) {
          return Response.json(
            { error: "Invalid datetime format. Use YYYY-MM-DDTHH:MM" },
            { status: 400 }
          );
        }
        shareData.expiresAt = parsed;
      }

      // Password type share ke liye hash generate kar rahe hai
      if (accessType === "PASSWORD") {
        plainPassword = password || Math.random().toString(36).slice(-12);
        shareData.passwordHash = await bcrypt.hash(plainPassword, 10);
      }
    }

    // Step 4: Note database mein create kar rahe hai
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

    const share = (note as { shares?: Array<{ token: string }> }).shares?.[0] || null;

    // Step 5: Share link generate kar rahe hai
    const shareLink = share
      ? `${request.nextUrl.origin}/share/${share.token}`
      : null;

    return Response.json(
      {
        note,
        share: share ? { ...share } : null,
        shareLink,
        plainPassword: plainPassword || undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE_NOTE_ERROR:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// User ke saare notes fetch karne wala API endpoint
// GET /api/notes - Login user ki saari notes return karta hai
export async function GET(request: NextRequest) {
  try {
    // Step 1: User ID verify kar rahe hai
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Step 2: Database se user ki saari notes fetch kar rahe hai
    const notes = await noteRepo.findByUserId(userId);

    return Response.json({ notes }, { status: 200 });
  } catch (error) {
    console.error("GET_NOTES_ERROR:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
