import { NextRequest } from "next/server";
import { noteRepo } from "@/lib/repositories";
import { getAuthenticatedUserId } from "@/lib/api-auth";
import prisma from "@/lib/prisma";
import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";

// Note ka summary generate karne wala API endpoint
// POST /api/notes/:id/summarize - Groq AI ka use karke note ka summary banata hai
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
    const note = await noteRepo.findById(id);

    // Step 3: Note exist karta hai ya nahi check kar rahe hai
    if (!note) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    // Step 4: Check kar rahe hai ki note isi user ka hai
    if (note.userId !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Step 5: Note ka content chota hai to summary generate nahi karenge
    if (!note.content || note.content.trim().length < 20) {
      return Response.json(
        { error: "Content is too short to summarize" },
        { status: 400 }
      );
    }

    // Step 6: Groq API key check kar rahe hai
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return Response.json(
        { error: "AI service is not configured" },
        { status: 500 }
      );
    }

    // Step 7: Groq AI model initialize kar rahe hai
    const model = new ChatGroq({
      apiKey: groqApiKey,
      model: "llama-3.3-70b-versatile",
      temperature: 0,
    });

    // Step 8: Prompt banake AI se summary manga rahe hai
    const prompt = ChatPromptTemplate.fromMessages([
      {
        role: "system",
        content:
          "You are a helpful assistant. Summarize the following note content concisely. Return only the summary, no extra text.",
      },
      { role: "user", content: note.content },
    ]);

    const chain = prompt.pipe(model);
    const result = await chain.invoke({});
    const summary = typeof result.content === "string" ? result.content : "";

    // Step 9: Summary ko database mein save kar rahe hai
    await prisma.note.update({
      where: { id },
      data: { constentSummary: summary },
    });

    return Response.json({ summary }, { status: 200 });
  } catch {
    return Response.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
