import { NextRequest } from "next/server";
import { noteRepo } from "@/lib/repositories";
import { getAuthenticatedUserId } from "@/lib/api-auth";

// Single note fetch karne wala API endpoint
// GET /api/notes/:id - Specific note ka data return karta hai
// Specific note fetch karne wala API endpoint
// GET /api/notes/:id - Ek specific note ka data return karta hai
export async function GET(
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

    // Step 3: Database se note fetch kar rahe hai
    const note = await noteRepo.findById(id);

    if (!note) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    // Step 4: Check kar rahe hai ki note isi user ka hai
    if (note.userId !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    return Response.json({ note }, { status: 200 });
  } catch (error) {
    console.error("GET_NOTE_ERROR:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Note update karne wala API endpoint
// PATCH /api/notes/:id - Note ka title ya content update karta hai
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Step 1: User ko authenticate kar rahe hai
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Step 2: URL se note ID aur body se update data nikal rahe hai
    const { id } = await params;
    const body = await request.json();

    // Step 3: Pehle note exist karta hai ya nahi check kar rahe hai
    const existingNote = await noteRepo.findById(id);
    if (!existingNote) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    // Step 4: Check kar rahe hai ki note isi user ka hai
    if (existingNote.userId !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Step 5: Note update kar rahe hai database mein
    const note = await noteRepo.update(id, body);

    return Response.json({ note }, { status: 200 });
  } catch (error) {
    console.error("UPDATE_NOTE_ERROR:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Note delete karne wala API endpoint
// DELETE /api/notes/:id - Note ko permanently delete karta hai
export async function DELETE(
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

    // Step 3: Pehle note exist karta hai ya nahi check kar rahe hai
    const existingNote = await noteRepo.findById(id);
    if (!existingNote) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    // Step 4: Check kar rahe hai ki note isi user ka hai
    if (existingNote.userId !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Step 5: Note ko database se delete kar rahe hai
    await noteRepo.delete(id);

    return Response.json({ message: "Note deleted" }, { status: 200 });
  } catch (error) {
    console.error("DELETE_NOTE_ERROR:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

