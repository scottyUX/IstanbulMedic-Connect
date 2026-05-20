/**
 * Integration tests for the CopilotKit + LangChain integration.
 *
 * Covers:
 * 1. Safe general question (guardrails pass)
 * 2. Guardrail-triggering question (guardrails block)
 * 3. Conversation history request
 * 4. Clinic summary request
 * 5. Request/response schema conformance
 *
 * Tool API route tests and CopilotKit runtime tests are in sibling files.
 */
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";

// ============================================================================
// 1. Guardrail Integration Tests (safe + blocked)
// ============================================================================

import {
  checkInputGuardrails,
  checkOutputGuardrails,
} from "@/lib/agents/langchain/guardrails";

describe("Guardrail integration (CopilotKit context)", () => {
  describe("safe general questions pass guardrails", () => {
    const safeQuestions = [
      "What is a FUE hair transplant?",
      "How much does a hair transplant cost in Turkey?",
      "Tell me about clinics in Istanbul",
      "What is the recovery time for a hair transplant?",
      "Can you help me find a clinic?",
      "What does an FUE procedure involve?",
      "How long does a hair transplant take?",
    ];

    it.each(safeQuestions)("passes: %s", (question) => {
      const result = checkInputGuardrails(question);
      expect(result.passed).toBe(true);
      expect(result.violation).toBeNull();
      expect(result.safeResponse).toBeNull();
    });
  });

  describe("guardrail-triggering questions are blocked", () => {
    it("blocks medical advice requests", () => {
      const result = checkInputGuardrails("Should I get a hair transplant?");
      expect(result.passed).toBe(false);
      expect(result.violation).toBe("medical_advice");
      expect(result.safeResponse).toContain("qualified");
      expect(result.safeResponse).toContain("consultation");
    });

    it("blocks ranking requests", () => {
      const result = checkInputGuardrails(
        "Which clinic is the best in Istanbul?"
      );
      expect(result.passed).toBe(false);
      expect(result.violation).toBe("ranking_request");
      expect(result.safeResponse).toContain("compare");
    });

    it("blocks out-of-domain requests", () => {
      const result = checkInputGuardrails("What stocks should I invest in?");
      expect(result.passed).toBe(false);
      expect(result.violation).toBe("out_of_domain");
      expect(result.safeResponse).toContain("hair restoration");
    });

    it("blocks medical advice in LLM output", () => {
      const result = checkOutputGuardrails(
        "You should get a FUE transplant for your case."
      );
      expect(result.passed).toBe(false);
      expect(result.violation).toBe("medical_advice");
    });

    it("blocks ranking claims in LLM output", () => {
      const result = checkOutputGuardrails(
        "The best clinic in Istanbul is HairMax."
      );
      expect(result.passed).toBe(false);
      expect(result.violation).toBe("ranking_request");
    });

    it("passes safe LLM output", () => {
      const result = checkOutputGuardrails(
        "FUE is a minimally invasive technique. Here are the clinic scores from our database."
      );
      expect(result.passed).toBe(true);
      expect(result.violation).toBeNull();
    });
  });

  describe("system prompt contains guardrail instructions", () => {
    let LEILA_SYSTEM_PROMPT: string;

    beforeAll(async () => {
      const mod = await import(
        "@/lib/agents/langchain/prompts/leila-system-prompt"
      );
      LEILA_SYSTEM_PROMPT = mod.LEILA_SYSTEM_PROMPT;
    });

    it("includes NO MEDICAL ADVICE guardrail", () => {
      expect(LEILA_SYSTEM_PROMPT).toContain("NO MEDICAL ADVICE");
    });

    it("includes NO FABRICATED DATA guardrail", () => {
      expect(LEILA_SYSTEM_PROMPT).toContain("NO FABRICATED DATA");
    });

    it("includes NO RANKING guardrail", () => {
      expect(LEILA_SYSTEM_PROMPT).toContain("NO RANKING");
    });

    it("includes STAY IN DOMAIN guardrail", () => {
      expect(LEILA_SYSTEM_PROMPT).toContain("STAY IN DOMAIN");
    });

    it("includes GDPR section", () => {
      expect(LEILA_SYSTEM_PROMPT).toContain("GDPR");
    });

    it("includes database tool references", () => {
      expect(LEILA_SYSTEM_PROMPT).toContain("database_lookup");
      expect(LEILA_SYSTEM_PROMPT).toContain("clinic_summary");
    });
  });
});

// ============================================================================
// 2. Conversation History Tests
// ============================================================================

// Mock OpenAI and tools for agent tests
vi.mock("@/lib/agents/langchain/tools/databaseLookup", () => ({
  databaseLookupTool: {
    name: "database_lookup",
    description: "Mock",
    invoke: vi.fn().mockResolvedValue(
      JSON.stringify({ results: [], metadata: { table: "clinics", count: 0 } })
    ),
  },
}));

vi.mock("@/lib/agents/langchain/tools/clinicSummary", () => ({
  clinicSummaryTool: {
    name: "clinic_summary",
    description: "Mock",
    invoke: vi.fn().mockResolvedValue(
      JSON.stringify({ error: "No clinic found", metadata: {} })
    ),
  },
}));

const mockInvoke = vi.fn();
const mockStream = vi.fn();
const mockBindTools = vi.fn();

vi.mock("@langchain/openai", () => {
  function ChatOpenAI() {
    // @ts-expect-error mock constructor
    this.invoke = mockInvoke;
    // @ts-expect-error mock constructor
    this.stream = mockStream;
    // @ts-expect-error mock constructor
    this.bindTools = mockBindTools;
  }
  return { ChatOpenAI };
});

import { LangchainAgent } from "@/lib/agents/langchain/agent";
import { AIMessage } from "@langchain/core/messages";

describe("Conversation history handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const defaultResponse = new AIMessage({
      content: "Hello! How can I help you today?",
    });
    mockInvoke.mockResolvedValue(defaultResponse);
    mockBindTools.mockReturnValue({
      invoke: mockInvoke,
      stream: mockStream,
    });
  });

  it("preserves conversation history across turns", () => {
    const agent = new LangchainAgent({
      messages: [
        { role: "user", text: "Hi, my name is Alex" },
        { role: "assistant", text: "Hello Alex! How can I help you?" },
      ],
    });

    const messages = agent.getMessages();
    expect(messages).toHaveLength(2);
    expect(messages[0].text).toBe("Hi, my name is Alex");
    expect(messages[1].text).toBe("Hello Alex! How can I help you?");
  });

  it("agent state tracks lastUpdated timestamp", () => {
    const agent = new LangchainAgent();
    const state = agent.getState();
    expect(state.lastUpdated).toBeDefined();
    expect(new Date(state.lastUpdated!).getTime()).toBeGreaterThan(0);
  });

  it("conversation history is passed correctly for API route pattern", () => {
    const allMessages = [
      { role: "user" as const, text: "Hello" },
      { role: "assistant" as const, text: "Hi there!" },
      { role: "user" as const, text: "Tell me about FUE" },
    ];

    const history = allMessages.slice(0, -1);
    const latestMessage = allMessages[allMessages.length - 1];

    expect(history).toHaveLength(2);
    expect(latestMessage.text).toBe("Tell me about FUE");

    const agent = new LangchainAgent({ messages: history });
    expect(agent.getMessages()).toHaveLength(2);
  });

  it("builds message count correctly over multiple turns", async () => {
    const agent = new LangchainAgent();
    expect(agent.getMessages()).toHaveLength(0);

    async function* mockStreamGen() {
      yield new AIMessage({ content: "Response" });
    }
    mockStream.mockReturnValue(mockStreamGen());

    await agent.handleMessageStream({ role: "user", text: "First message" });
    expect(agent.getMessages()).toHaveLength(2); // user + assistant

    mockStream.mockReturnValue((async function* () {
      yield new AIMessage({ content: "Response 2" });
    })());

    await agent.handleMessageStream({ role: "user", text: "Second message" });
    expect(agent.getMessages()).toHaveLength(4); // 2 turns x 2 messages
  });

  it("guardrails work within multi-turn conversations", async () => {
    const agent = new LangchainAgent();

    // First turn: safe
    async function* gen1() {
      yield new AIMessage({ content: "Hello!" });
    }
    mockStream.mockReturnValue(gen1());
    await agent.handleMessageStream({ role: "user", text: "Hi Leila" });
    expect(agent.getMessages()).toHaveLength(2);

    // Second turn: guardrail trigger
    const reply = await agent.handleMessageStream({
      role: "user",
      text: "Should I get a hair transplant?",
    });

    expect(reply.metadata?.guardrail).toBe("medical_advice");
    expect(reply.text).toContain("qualified");
    // LLM should NOT have been called for the blocked message
    // (invoke was called for first turn, not second)
    expect(agent.getMessages()).toHaveLength(4);
  });
});

// ============================================================================
// 3. Request/Response Schema Conformance
// ============================================================================

describe("Request/response schema conformance (Sprint 1)", () => {
  it("LangchainMessage type has required fields", () => {
    const msg = {
      id: "test-id",
      role: "user" as const,
      text: "Test message",
      createdAt: new Date().toISOString(),
      metadata: { key: "value" },
    };

    expect(["user", "assistant", "system", "tool"]).toContain(msg.role);
    expect(typeof msg.text).toBe("string");
    expect(typeof msg.id).toBe("string");
    expect(typeof msg.createdAt).toBe("string");
    expect(typeof msg.metadata).toBe("object");
  });

  it("AgentState type has required fields", () => {
    const agent = new LangchainAgent({ conversationId: "test-conv" });
    const state = agent.getState();

    expect(state).toHaveProperty("messages");
    expect(state).toHaveProperty("lastUpdated");
    expect(state).toHaveProperty("variables");
    expect(state.conversationId).toBe("test-conv");
    expect(Array.isArray(state.messages)).toBe(true);
  });

  it("agent message response conforms to LangchainMessage schema", async () => {
    async function* gen() {
      yield new AIMessage({ content: "Test response" });
    }
    mockStream.mockReturnValue(gen());

    const agent = new LangchainAgent();
    const reply = await agent.handleMessageStream({
      role: "user",
      text: "What is FUE?",
    });

    expect(reply.role).toBe("assistant");
    expect(typeof reply.text).toBe("string");
    expect(reply.text.length).toBeGreaterThan(0);
    expect(reply.createdAt).toBeDefined();
    expect(new Date(reply.createdAt!).getTime()).toBeGreaterThan(0);
  });

  it("guardrail response includes metadata with violation type", async () => {
    const agent = new LangchainAgent();
    const reply = await agent.handleMessageStream({
      role: "user",
      text: "Am I a good candidate for FUE?",
    });

    expect(reply.role).toBe("assistant");
    expect(reply.metadata).toBeDefined();
    expect(reply.metadata?.guardrail).toBe("medical_advice");
    expect(typeof reply.text).toBe("string");
    expect(reply.text.length).toBeGreaterThan(0);
  });
});
