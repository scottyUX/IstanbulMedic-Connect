import { NextRequest, NextResponse } from "next/server";
import { LangchainAgent } from "@/lib/agents/langchain/agent";
import type { LangchainMessage } from "@/types/langchain";

export async function POST(req: NextRequest) {
  try {
    const { messages } = (await req.json()) as { messages: LangchainMessage[] };

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Separate history from the latest user message
    const history = messages.slice(0, -1);
    const latestMessage = messages[messages.length - 1];

    // Create agent with conversation history
    const agent = new LangchainAgent({ messages: history });

    // Stream response using TransformStream
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    agent
      .handleMessageStream(latestMessage, (chunk) => {
        writer.write(encoder.encode(chunk));
      })
      .then(() => writer.close())
      .catch((err) => {
        console.error("Streaming error:", err);
        writer.abort(err);
      });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Langchain agent error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
