import { NextRequest } from "next/server";
import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  OpenAIAdapter,
} from "@copilotkit/runtime";
import { BuiltInAgent } from "@copilotkit/runtime/v2";
import type { AbstractAgent } from "@ag-ui/client";
import { LEILA_SYSTEM_PROMPT } from "@/lib/agents/langchain/prompts/leila-system-prompt";

/**
 * CopilotKit runtime powered by the LangChain agent's system prompt and tools.
 *
 * Architecture:
 * - BuiltInAgent uses the versioned Leila system prompt (guardrails included)
 * - Tools (database_lookup, clinic_summary) are registered client-side via
 *   LangchainGenUI and routed through /api/langchain-tools
 * - OpenAI gpt-4o-mini matches the LangChain agent's model config
 */

const serviceAdapter = new OpenAIAdapter({
  model: "gpt-4o-mini",
});

const agent = new BuiltInAgent({
  model: "openai/gpt-4o-mini",
  prompt: LEILA_SYSTEM_PROMPT,
});

const agents = {
  default: agent as unknown as AbstractAgent,
} as unknown as Record<string, AbstractAgent> &
  PromiseLike<Record<string, AbstractAgent>>;

const runtime = new CopilotRuntime({
  agents,
});

const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
  runtime,
  serviceAdapter,
  endpoint: "/api/copilotkit-langchain",
});

export const GET = async (req: NextRequest) => {
  return handleRequest(req);
};

export const POST = async (req: NextRequest) => {
  return handleRequest(req);
};
