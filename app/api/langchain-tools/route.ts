import { NextRequest, NextResponse } from "next/server";
import { databaseLookupTool } from "@/lib/agents/langchain/tools/databaseLookup";
import { clinicSummaryTool } from "@/lib/agents/langchain/tools/clinicSummary";

/**
 * Thin API wrapper exposing LangChain tools as a REST endpoint.
 * Called by CopilotKit frontend actions (useCopilotAction / useFrontendTool).
 */
export async function POST(req: NextRequest) {
  try {
    const { tool, args } = (await req.json()) as {
      tool: string;
      args: Record<string, unknown>;
    };

    if (!tool) {
      return NextResponse.json(
        { error: "Missing 'tool' field" },
        { status: 400 }
      );
    }

    let result: string;

    switch (tool) {
      case "database_lookup":
        result = String(await databaseLookupTool.invoke(args as Parameters<typeof databaseLookupTool.func>[0]));
        break;
      case "clinic_summary":
        result = String(await clinicSummaryTool.invoke(args as Parameters<typeof clinicSummaryTool.func>[0]));
        break;
      default:
        return NextResponse.json(
          { error: `Unknown tool: ${tool}` },
          { status: 400 }
        );
    }

    return NextResponse.json(JSON.parse(result));
  } catch (error) {
    console.error("langchain-tools error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
