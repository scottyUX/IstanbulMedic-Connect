import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIMessage } from '@langchain/core/messages';

// Mock the database lookup tool before importing agent
vi.mock('@/lib/agents/langchain/tools/databaseLookup', () => ({
  databaseLookupTool: {
    name: 'database_lookup',
    description: 'Mock database lookup tool',
    invoke: vi.fn().mockResolvedValue(
      JSON.stringify({ results: [{ id: 1, name: 'Test Clinic' }], metadata: { table: 'clinics', count: 1 } })
    ),
  },
}));

// Mock ChatOpenAI
const mockInvoke = vi.fn();
const mockStream = vi.fn();
const mockBindTools = vi.fn();

vi.mock('@langchain/openai', () => {
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

import { LangchainAgent } from '@/lib/agents/langchain/agent';

describe('Agent guardrail integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const defaultResponse = new AIMessage({ content: 'Hello! How can I help you today?' });
    mockInvoke.mockResolvedValue(defaultResponse);
    mockBindTools.mockReturnValue({
      invoke: mockInvoke,
      stream: mockStream,
    });
  });

  // ---------------------------------------------------------------------------
  // Input guardrails bypass the LLM entirely
  // ---------------------------------------------------------------------------

  describe('handleMessage input guardrails', () => {
    it('returns safe response for medical advice without calling LLM', async () => {
      const agent = new LangchainAgent();
      const reply = await agent.handleMessage({
        role: 'user',
        text: 'Should I get a hair transplant?',
      });

      expect(reply.role).toBe('assistant');
      expect(reply.text).toContain('qualified');
      expect(reply.metadata?.guardrail).toBe('medical_advice');
      // LLM should never be called
      expect(mockInvoke).not.toHaveBeenCalled();
      expect(mockBindTools).not.toHaveBeenCalled();
    });

    it('returns safe response for ranking request without calling LLM', async () => {
      const agent = new LangchainAgent();
      const reply = await agent.handleMessage({
        role: 'user',
        text: 'Which clinic has the best surgeon?',
      });

      expect(reply.text).toContain('compare');
      expect(reply.metadata?.guardrail).toBe('ranking_request');
      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it('returns safe response for out-of-domain without calling LLM', async () => {
      const agent = new LangchainAgent();
      const reply = await agent.handleMessage({
        role: 'user',
        text: 'What stocks should I invest in?',
      });

      expect(reply.text).toContain('hair restoration');
      expect(reply.metadata?.guardrail).toBe('out_of_domain');
      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it('still adds both user and guarded messages to history', async () => {
      const agent = new LangchainAgent();
      await agent.handleMessage({
        role: 'user',
        text: 'Is this surgery safe for me?',
      });

      const messages = agent.getMessages();
      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe('user');
      expect(messages[1].role).toBe('assistant');
      expect(messages[1].metadata?.guardrail).toBe('medical_advice');
    });

    it('lets legitimate questions through to the LLM', async () => {
      const agent = new LangchainAgent();
      const reply = await agent.handleMessage({
        role: 'user',
        text: 'What is FUE hair transplant?',
      });

      expect(reply.text).toBe('Hello! How can I help you today?');
      expect(reply.metadata).toBeUndefined();
      expect(mockBindTools).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Output guardrails catch unsafe LLM responses
  // ---------------------------------------------------------------------------

  describe('handleMessage output guardrails', () => {
    it('replaces LLM response that recommends a specific treatment', async () => {
      const unsafeResponse = new AIMessage({
        content: 'Based on your photos, you should get a FUE transplant right away.',
      });
      mockInvoke.mockResolvedValueOnce(unsafeResponse);

      const agent = new LangchainAgent();
      const reply = await agent.handleMessage({
        role: 'user',
        text: 'What are my options?',
      });

      // Should be the safe medical_advice response, not the unsafe one
      expect(reply.text).not.toContain('you should get a FUE');
      expect(reply.text).toContain('qualified');
      expect(reply.metadata?.guardrail).toBe('medical_advice');
    });

    it('replaces LLM response that declares a best clinic', async () => {
      const unsafeResponse = new AIMessage({
        content: 'The best clinic in Istanbul is HairMax — they are the top choice.',
      });
      mockInvoke.mockResolvedValueOnce(unsafeResponse);

      const agent = new LangchainAgent();
      const reply = await agent.handleMessage({
        role: 'user',
        text: 'Tell me about clinics',
      });

      expect(reply.text).not.toContain('best clinic');
      expect(reply.metadata?.guardrail).toBe('ranking_request');
    });

    it('passes through safe LLM responses unchanged', async () => {
      const safeResponse = new AIMessage({
        content: 'FUE is a minimally invasive technique. Here are the clinic scores from our database.',
      });
      mockInvoke.mockResolvedValueOnce(safeResponse);

      const agent = new LangchainAgent();
      const reply = await agent.handleMessage({
        role: 'user',
        text: 'Tell me about FUE',
      });

      expect(reply.text).toBe(
        'FUE is a minimally invasive technique. Here are the clinic scores from our database.'
      );
      expect(reply.metadata).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Streaming + guardrails
  // ---------------------------------------------------------------------------

  describe('handleMessageStream input guardrails', () => {
    beforeEach(() => {
      async function* mockStreamGenerator() {
        yield new AIMessage({ content: 'Hello' });
        yield new AIMessage({ content: ' world!' });
      }
      mockStream.mockReturnValue(mockStreamGenerator());
    });

    it('short-circuits streaming for blocked input', async () => {
      const agent = new LangchainAgent();
      const chunks: string[] = [];

      const reply = await agent.handleMessageStream(
        { role: 'user', text: 'Should I undergo FUE surgery?' },
        (chunk) => chunks.push(chunk)
      );

      // Should get exactly one chunk — the safe response
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toContain('qualified');
      expect(reply.metadata?.guardrail).toBe('medical_advice');
      // LLM should never be called
      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it('streams normally for legitimate input', async () => {
      const agent = new LangchainAgent();
      const chunks: string[] = [];

      await agent.handleMessageStream(
        { role: 'user', text: 'Tell me about FUE' },
        (chunk) => chunks.push(chunk)
      );

      expect(chunks).toEqual(['Hello', ' world!']);
    });
  });

  // ---------------------------------------------------------------------------
  // Edge case: guardrail after multi-turn conversation
  // ---------------------------------------------------------------------------

  describe('multi-turn guardrail enforcement', () => {
    it('enforces guardrails even after prior valid exchanges', async () => {
      const agent = new LangchainAgent();

      // First turn: legitimate
      await agent.handleMessage({ role: 'user', text: 'Hi Leila' });
      expect(mockInvoke).toHaveBeenCalledTimes(1);

      // Second turn: guardrail trigger
      mockInvoke.mockClear();
      const reply = await agent.handleMessage({
        role: 'user',
        text: 'Am I a good candidate for FUE?',
      });

      expect(reply.metadata?.guardrail).toBe('medical_advice');
      expect(mockInvoke).not.toHaveBeenCalled();
      // History should have 4 messages (2 turns x 2 messages)
      expect(agent.getMessages()).toHaveLength(4);
    });
  });
});
