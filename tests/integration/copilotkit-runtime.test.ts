/**
 * Integration tests for the CopilotKit runtime route (/api/copilotkit-langchain).
 * Verifies the runtime is correctly wired to the LangchainAgentAdapter.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  capturedAdapterCtor,
  capturedOpenAIAdapter,
  capturedCopilotRuntime,
  mockHandleRequest,
} = vi.hoisted(() => ({
  capturedAdapterCtor: vi.fn(),
  capturedOpenAIAdapter: vi.fn(),
  capturedCopilotRuntime: vi.fn(),
  mockHandleRequest: vi.fn(),
}));

vi.mock("@copilotkit/runtime", () => {
  function OpenAIAdapter(this: unknown, ...args: unknown[]) {
    capturedOpenAIAdapter(...args);
  }
  function CopilotRuntime(this: unknown, ...args: unknown[]) {
    capturedCopilotRuntime(...args);
  }
  return {
    CopilotRuntime,
    copilotRuntimeNextJSAppRouterEndpoint: vi.fn().mockReturnValue({
      handleRequest: (...args: unknown[]) => mockHandleRequest(...args),
    }),
    OpenAIAdapter,
  };
});

vi.mock("@/lib/agents/langchain/adapter", () => {
  class LangchainAgentAdapter {
    agentId?: string;
    constructor(config: { agentId?: string }) {
      capturedAdapterCtor(config);
      this.agentId = config?.agentId;
    }
    run() {
      return { subscribe: () => undefined };
    }
  }
  return { LangchainAgentAdapter };
});

import { GET, POST } from "@/app/api/copilotkit-langchain/route";

describe("CopilotKit LangChain runtime (/api/copilotkit-langchain)", () => {
  beforeEach(() => {
    mockHandleRequest.mockResolvedValue(new Response("ok", { status: 200 }));
  });

  it("GET handler delegates to CopilotKit handleRequest", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/copilotkit-langchain",
      { method: "GET" }
    );

    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(mockHandleRequest).toHaveBeenCalledWith(req);
  });

  it("POST handler delegates to CopilotKit handleRequest", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/copilotkit-langchain",
      {
        method: "POST",
        body: JSON.stringify({ messages: [] }),
        headers: { "Content-Type": "application/json" },
      }
    );

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockHandleRequest).toHaveBeenCalledWith(req);
  });

  it("LangchainAgentAdapter is constructed with an agentId", () => {
    expect(capturedAdapterCtor).toHaveBeenCalledWith(
      expect.objectContaining({
        agentId: expect.any(String),
      })
    );
  });

  it("OpenAIAdapter is configured with gpt-4o-mini", () => {
    expect(capturedOpenAIAdapter).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-4o-mini",
      })
    );
  });

  it("CopilotRuntime receives a default agent backed by LangchainAgentAdapter", () => {
    const runtimeConfig = capturedCopilotRuntime.mock.calls[0][0];
    expect(runtimeConfig.agents).toBeDefined();
    expect(runtimeConfig.agents.default).toBeDefined();
    // The default agent should be our adapter instance
    expect(runtimeConfig.agents.default.agentId).toBeDefined();
  });
});
