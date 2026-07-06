import { NextRequest } from "next/server";
import { noteRepo } from "@/lib/repositories";
import { getAuthenticatedUserId } from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const note = await noteRepo.findById(id);

    if (!note) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    if (note.userId !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    return Response.json({ note }, { status: 200 });
  } catch (error) {
    console.error("GET_NOTE_ERROR:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
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

    const existingNote = await noteRepo.findById(id);
    if (!existingNote) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    if (existingNote.userId !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const note = await noteRepo.update(id, body);

    return Response.json({ note }, { status: 200 });
  } catch (error) {
    console.error("UPDATE_NOTE_ERROR:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existingNote = await noteRepo.findById(id);
    if (!existingNote) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    if (existingNote.userId !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await noteRepo.delete(id);

    return Response.json({ message: "Note deleted" }, { status: 200 });
  } catch (error) {
    console.error("DELETE_NOTE_ERROR:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
