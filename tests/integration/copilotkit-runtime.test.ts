/**
 * Integration tests for the CopilotKit runtime route (/api/copilotkit-langchain).
 * Verifies the runtime is correctly configured with the LangChain system prompt.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// vi.hoisted ensures these are available when hoisted vi.mock factories execute
const {
  capturedBuiltInAgent,
  capturedOpenAIAdapter,
  capturedCopilotRuntime,
  mockHandleRequest,
} = vi.hoisted(() => ({
  capturedBuiltInAgent: vi.fn(),
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

vi.mock("@copilotkit/runtime/v2", () => {
  function BuiltInAgent(this: unknown, config: Record<string, unknown>) {
    capturedBuiltInAgent(config);
    Object.assign(this as object, {
      model: config.model,
      prompt: config.prompt,
    });
  }
  return { BuiltInAgent };
});

vi.mock("@ag-ui/client", () => ({}));

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

  it("BuiltInAgent is configured with gpt-4o-mini", () => {
    expect(capturedBuiltInAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "openai/gpt-4o-mini",
      })
    );
  });

  it("BuiltInAgent uses the versioned Leila system prompt", () => {
    const config = capturedBuiltInAgent.mock.calls[0][0];
    expect(config.prompt).toContain("Leila");
    expect(config.prompt).toContain("hair restoration");
    expect(config.prompt).toContain("SAFETY GUARDRAILS");
    expect(config.prompt).toContain("database_lookup");
    expect(config.prompt).toContain("clinic_summary");
  });

  it("OpenAIAdapter is configured with gpt-4o-mini", () => {
    expect(capturedOpenAIAdapter).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-4o-mini",
      })
    );
  });

  it("CopilotRuntime receives a default agent", () => {
    const runtimeConfig = capturedCopilotRuntime.mock.calls[0][0];
    expect(runtimeConfig.agents).toBeDefined();
    expect(runtimeConfig.agents.default).toBeDefined();
  });
});
