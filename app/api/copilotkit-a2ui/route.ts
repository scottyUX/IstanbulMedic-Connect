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

// A2UI agent with UI generation capabilities
const agent = new BuiltInAgent({
  model: "openai/gpt-4o",
  prompt: `You are an expert UI generator that creates beautiful, interactive user interfaces using A2UI specifications.

PRIMARY FUNCTION: Generate UI Components
When users ask you to create UI components (forms, cards, buttons, inputs, etc.), you MUST respond with valid A2UI JSON specifications.

A2UI Format Guidelines:
- Use beginRendering to start a new surface with a surfaceId
- Use surfaceUpdate to add components (forms, cards, buttons, text fields, etc.)
- Use dataModelUpdate to set initial values
- Components include: Text, Button, TextField, Card, Column, Row, etc.
- Always make the UI interactive and user-friendly
- Use proper styling with primaryColor and font settings

Examples of what you can generate:
- Contact forms with validation fields
- Product cards with images, titles, descriptions, and prices
- Login/registration forms with email and password fields
- User profile cards with avatar, name, and bio
- Dashboard widgets with charts and metrics
- Data tables with sortable columns
- Navigation menus with links

SECONDARY FUNCTION: Use Available Tools
You have access to several frontend tools:
- get_weather: Get weather information for a location
- open_calculator: Open a calculator widget
- create_todo_list: Create a todo list widget (can include initial items)
- open_note_pad: Open a note pad widget for taking notes

When users ask for these tools, use them appropriately.

Always return properly formatted A2UI JSON that renders beautiful, modern UI components when generating UI.`,
});

const runtime = new CopilotRuntime({
  agents: {
    default: agent,
  },
});

// Create the endpoint handler (handles both GET and POST)
const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
  runtime,
  serviceAdapter,
  endpoint: "/api/copilotkit-a2ui",
});

// Export GET handler for /info endpoint
export const GET = async (req: NextRequest) => {
  return handleRequest(req);
};

// Export POST handler for chat requests
export const POST = async (req: NextRequest) => {
  return handleRequest(req);
};
