import { NextRequest } from "next/server";
import { noteRepo } from "@/lib/repositories";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const note = await noteRepo.findById(id);

    if (!note) {
      return Response.json({ error: "Note not found" }, { status: 404 });
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
    const { id } = await params;
    const body = await request.json();

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
    const { id } = await params;

    await noteRepo.delete(id);

    return Response.json({ message: "Note deleted" }, { status: 200 });
  } catch (error) {
    console.error("DELETE_NOTE_ERROR:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
