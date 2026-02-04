import { NextRequest } from "next/server";
import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  OpenAIAdapter,
} from "@copilotkit/runtime";
import { BuiltInAgent } from "@copilotkit/runtime/v2";

// Create OpenAI service adapter
const serviceAdapter = new OpenAIAdapter({
  model: "gpt-4o",
});

// Create a simple agent
const agent = new BuiltInAgent({
  model: "openai/gpt-4o",
  prompt: `You are a helpful assistant that can generate UI components and interact with tools.

AVAILABLE FRONTEND TOOLS:
- get_weather: Get current weather information for a location (use when users ask about weather)
- open_calculator: Open a calculator widget for performing calculations
- create_todo_list: Create a todo list widget (can include initial items)
- open_note_pad: Open a note pad widget for taking notes

When users ask for these tools or widgets, use them appropriately. For example:
- "What's the weather in San Francisco?" → use get_weather tool
- "Open a calculator" → use open_calculator tool
- "Create a todo list" → use create_todo_list tool
- "Open a note pad" → use open_note_pad tool`,
});

// Create the runtime
const runtime = new CopilotRuntime({
  agents: {
    default: agent,
  },
});

// Create the endpoint handler (handles both GET and POST)
const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
  runtime,
  serviceAdapter,
  endpoint: "/api/copilotkit",
});

// Export GET handler for /info endpoint
export const GET = async (req: NextRequest) => {
  return handleRequest(req);
};

// Export POST handler for chat requests
export const POST = async (req: NextRequest) => {
  return handleRequest(req);
};
