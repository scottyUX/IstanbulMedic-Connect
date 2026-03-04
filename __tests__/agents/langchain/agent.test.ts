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

import { LangchainAgent, createAgent, BASE_PROMPT } from '@/lib/agents/langchain/agent';

describe('LangchainAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock: model returns text response (no tool calls)
    const defaultResponse = new AIMessage({ content: 'Hello! How can I help you today?' });
    mockInvoke.mockResolvedValue(defaultResponse);
    mockBindTools.mockReturnValue({
      invoke: mockInvoke,
      stream: mockStream,
    });
  });

  // ===========================================================================
  // Initialization
  // ===========================================================================

  describe('initialization', () => {
    it('creates with default state', () => {
      const agent = new LangchainAgent();
      const state = agent.getState();

      expect(state.messages).toEqual([]);
      expect(state.conversationId).toBeUndefined();
      expect(state.variables).toEqual({});
      expect(state.lastUpdated).toBeDefined();
    });

    it('accepts a conversationId', () => {
      const agent = new LangchainAgent({ conversationId: 'test-123' });
      expect(agent.getState().conversationId).toBe('test-123');
    });

    it('accepts initial messages', () => {
      const messages = [{ role: 'user' as const, text: 'Hello' }];
      const agent = new LangchainAgent({ messages });
      expect(agent.getMessages()).toHaveLength(1);
      expect(agent.getMessages()[0].text).toBe('Hello');
    });
  });

  // ===========================================================================
  // State management
  // ===========================================================================

  describe('state management', () => {
    it('getState returns a copy (not a reference)', () => {
      const agent = new LangchainAgent({ conversationId: 'test' });
      const state1 = agent.getState();
      const state2 = agent.getState();
      expect(state1).toEqual(state2);
      expect(state1).not.toBe(state2);
    });

    it('getMessages returns a copy', () => {
      const agent = new LangchainAgent({
        messages: [{ role: 'user', text: 'Hi' }],
      });
      const msgs1 = agent.getMessages();
      const msgs2 = agent.getMessages();
      expect(msgs1).toEqual(msgs2);
      expect(msgs1).not.toBe(msgs2);
    });

    it('clearMessages empties messages but preserves conversationId', () => {
      const agent = new LangchainAgent({
        conversationId: 'keep-me',
        messages: [{ role: 'user', text: 'Hi' }],
      });

      agent.clearMessages();

      expect(agent.getMessages()).toHaveLength(0);
      expect(agent.getState().conversationId).toBe('keep-me');
    });

    it('reset creates fresh state with new conversationId', () => {
      const agent = new LangchainAgent({
        conversationId: 'old-id',
        messages: [{ role: 'user', text: 'Hi' }],
      });

      agent.reset('new-id');

      expect(agent.getMessages()).toHaveLength(0);
      expect(agent.getState().conversationId).toBe('new-id');
      expect(agent.getState().variables).toEqual({});
    });

    it('reset without new ID preserves existing conversationId', () => {
      const agent = new LangchainAgent({ conversationId: 'keep' });
      agent.reset();
      expect(agent.getState().conversationId).toBe('keep');
    });
  });

  // ===========================================================================
  // handleMessage (non-streaming)
  // ===========================================================================

  describe('handleMessage', () => {
    it('adds user message and returns assistant message', async () => {
      const agent = new LangchainAgent();
      const reply = await agent.handleMessage({ role: 'user', text: 'Hi' });

      expect(reply.role).toBe('assistant');
      expect(reply.text).toBe('Hello! How can I help you today?');
      expect(reply.createdAt).toBeDefined();
    });

    it('grows message count by 2 per turn', async () => {
      const agent = new LangchainAgent();
      expect(agent.getMessages()).toHaveLength(0);

      await agent.handleMessage({ role: 'user', text: 'First' });
      expect(agent.getMessages()).toHaveLength(2);

      mockInvoke.mockResolvedValueOnce(
        new AIMessage({ content: 'Second response' })
      );
      await agent.handleMessage({ role: 'user', text: 'Second' });
      expect(agent.getMessages()).toHaveLength(4);
    });

    it('calls model.bindTools and invoke', async () => {
      const agent = new LangchainAgent();
      await agent.handleMessage({ role: 'user', text: 'Hi' });

      expect(mockBindTools).toHaveBeenCalledWith(agent.tools);
      expect(mockInvoke).toHaveBeenCalled();
    });

    it('sets createdAt on user message if not provided', async () => {
      const agent = new LangchainAgent();
      await agent.handleMessage({ role: 'user', text: 'Hi' });

      const messages = agent.getMessages();
      expect(messages[0].createdAt).toBeDefined();
    });
  });

  // ===========================================================================
  // handleMessage with tool calls
  // ===========================================================================

  describe('handleMessage with tool calls', () => {
    it('executes tool and feeds result back to model', async () => {
      // First invoke: model requests a tool call
      const toolCallResponse = new AIMessage({ content: '' });
      toolCallResponse.tool_calls = [
        { name: 'database_lookup', args: { table: 'clinics' }, id: 'call-1', type: 'tool_call' },
      ];

      // Second invoke: model returns text after seeing tool result
      const finalResponse = new AIMessage({ content: 'Here are the clinics I found.' });

      mockInvoke
        .mockResolvedValueOnce(toolCallResponse)
        .mockResolvedValueOnce(finalResponse);

      const agent = new LangchainAgent();
      const reply = await agent.handleMessage({ role: 'user', text: 'Show me clinics' });

      expect(reply.text).toBe('Here are the clinics I found.');
      expect(mockInvoke).toHaveBeenCalledTimes(2);
    });
  });

  // ===========================================================================
  // handleMessageStream
  // ===========================================================================

  describe('handleMessageStream', () => {
    beforeEach(() => {
      // Mock streaming: yields chunks
      async function* mockStreamGenerator() {
        yield new AIMessage({ content: 'Hello' });
        yield new AIMessage({ content: ' world' });
        yield new AIMessage({ content: '!' });
      }
      mockStream.mockReturnValue(mockStreamGenerator());
    });

    it('calls onChunk for each streamed token', async () => {
      const agent = new LangchainAgent();
      const chunks: string[] = [];

      await agent.handleMessageStream(
        { role: 'user', text: 'Hi' },
        (chunk) => chunks.push(chunk)
      );

      expect(chunks).toEqual(['Hello', ' world', '!']);
    });

    it('returns complete text as assistant message', async () => {
      const agent = new LangchainAgent();
      const reply = await agent.handleMessageStream(
        { role: 'user', text: 'Hi' }
      );

      expect(reply.role).toBe('assistant');
      expect(reply.text).toBe('Hello world!');
    });

    it('updates state with both user and assistant messages', async () => {
      const agent = new LangchainAgent();
      await agent.handleMessageStream({ role: 'user', text: 'Hi' });

      const messages = agent.getMessages();
      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe('user');
      expect(messages[1].role).toBe('assistant');
    });
  });

  // ===========================================================================
  // handleMessageStream with tools
  // ===========================================================================

  describe('handleMessageStream with tools', () => {
    it('resolves tools via invoke then streams final response', async () => {
      // Tool resolution round (non-streaming invoke)
      const toolCallResponse = new AIMessage({ content: '' });
      toolCallResponse.tool_calls = [
        { name: 'database_lookup', args: { table: 'clinics' }, id: 'call-1', type: 'tool_call' },
      ];

      // Second invoke: no more tool calls
      const noToolResponse = new AIMessage({ content: '' });

      mockInvoke
        .mockResolvedValueOnce(toolCallResponse)
        .mockResolvedValueOnce(noToolResponse);

      // Final streaming response
      async function* streamGen() {
        yield new AIMessage({ content: 'Found clinics.' });
      }
      mockStream.mockReturnValue(streamGen());

      const agent = new LangchainAgent();
      const chunks: string[] = [];
      const reply = await agent.handleMessageStream(
        { role: 'user', text: 'List clinics' },
        (c) => chunks.push(c)
      );

      expect(reply.text).toBe('Found clinics.');
      expect(chunks).toEqual(['Found clinics.']);
      // 2 invoke calls for tool resolution, then streaming
      expect(mockInvoke).toHaveBeenCalledTimes(2);
    });
  });

  // ===========================================================================
  // Prompt and tool registration
  // ===========================================================================

  describe('prompt configuration', () => {
    it('BASE_PROMPT mentions hair transplant', () => {
      expect(BASE_PROMPT).toContain('hair transplant');
    });

    it('BASE_PROMPT mentions database_lookup tool', () => {
      expect(BASE_PROMPT).toContain('database_lookup');
    });

    it('BASE_PROMPT mentions GDPR', () => {
      expect(BASE_PROMPT).toContain('GDPR');
    });
  });

  describe('tool registration', () => {
    it('has exactly 1 tool registered', () => {
      const agent = new LangchainAgent();
      expect(agent.tools).toHaveLength(1);
    });

    it('registered tool is database_lookup', () => {
      const agent = new LangchainAgent();
      expect(agent.tools[0].name).toBe('database_lookup');
    });
  });

  // ===========================================================================
  // Error handling
  // ===========================================================================

  describe('error handling', () => {
    it('propagates model invoke errors', async () => {
      mockInvoke.mockRejectedValueOnce(new Error('API key invalid'));

      const agent = new LangchainAgent();
      await expect(
        agent.handleMessage({ role: 'user', text: 'Hi' })
      ).rejects.toThrow('API key invalid');
    });
  });

  // ===========================================================================
  // createAgent convenience function
  // ===========================================================================

  describe('createAgent', () => {
    it('returns a LangchainAgent instance', () => {
      const agent = createAgent('session-1');
      expect(agent).toBeInstanceOf(LangchainAgent);
      expect(agent.getState().conversationId).toBe('session-1');
    });
  });
});
