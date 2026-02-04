import { NextRequest, NextResponse } from "next/server";

// OpenAI Vector Store ID
const VECTOR_STORE_ID = "vs_692cf26be204819194c1d04a94ffbb1b";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query parameter is required and must be a string" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    // Use OpenAI's Responses API with file_search tool
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: query,
        model: "gpt-4o-mini",
        tools: [
          {
            type: "file_search",
            vector_store_ids: [VECTOR_STORE_ID],
            max_num_results: 5,
          },
        ],
        tool_choice: "required", // Force file_search to be used
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      return NextResponse.json(
        { error: `OpenAI API error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract the response text from the output
    // The response structure: output[0] is the file_search call, output[1] is the final response
    if (data.output && data.output.length > 1) {
      const finalResponse = data.output[1];
      if (finalResponse.content && finalResponse.content.length > 0) {
        const text = finalResponse.content[0].text;
        return NextResponse.json({ result: text });
      }
    }

    // Fallback: return raw response if structure is different
    return NextResponse.json({
      result: JSON.stringify(data, null, 2),
    });
  } catch (error) {
    console.error("Error searching knowledge base:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
