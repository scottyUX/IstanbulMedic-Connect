import { NextRequest } from "next/server";
import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  OpenAIAdapter,
} from "@copilotkit/runtime";
import type { AbstractAgent } from "@ag-ui/client";
import { LangchainAgentAdapter } from "@/lib/agents/langchain/adapter";

/**
 * CopilotKit runtime powered by the real server-side LangchainAgent.
 *
 * Architecture:
 * - LangchainAgentAdapter bridges ag-ui's AbstractAgent interface to
 *   LangchainAgent.handleMessageStream(), so the LLM tool-calling loop
 *   (clinic_summary, database_lookup, …) runs server-side against Supabase.
 * - OpenAIAdapter remains as the service adapter for legacy callers; the
 *   adapter above takes over once an agent is selected from the `agents` map.
 */

const serviceAdapter = new OpenAIAdapter({
  model: "gpt-4o-mini",
});

const langchainAdapter = new LangchainAgentAdapter({
  agentId: "langchain-default",
});

const agents = {
  default: langchainAdapter as unknown as AbstractAgent,
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
