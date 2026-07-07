import { NextRequest } from "next/server";
import { noteRepo } from "@/lib/repositories";
import { getAuthenticatedUserId } from "@/lib/api-auth";
import prisma from "@/lib/prisma";
import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";

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
    const note = await noteRepo.findById(id);

    if (!note) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    if (note.userId !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!note.content || note.content.trim().length < 20) {
      return Response.json(
        { error: "Content is too short to summarize" },
        { status: 400 }
      );
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return Response.json(
        { error: "AI service is not configured" },
        { status: 500 }
      );
    }

    const model = new ChatGroq({
      apiKey: groqApiKey,
      model: "llama-3.3-70b-versatile",
      temperature: 0,
    });

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
