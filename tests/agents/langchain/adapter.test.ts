import { describe, it, expect, vi, beforeEach } from 'vitest';
import { firstValueFrom, toArray, lastValueFrom } from 'rxjs';
import { EventType } from '@ag-ui/core';
import type { RunAgentInput, BaseEvent } from '@ag-ui/core';

// =============================================================================
// Mock LangchainAgent BEFORE importing the adapter so the adapter picks up the
// mock when it instantiates a fresh agent per run.
// =============================================================================

const { mockHandleMessageStream, MockAgentCtor } = vi.hoisted(() => {
  const mockHandleMessageStream = vi.fn();
  const MockAgentCtor = vi.fn();
  return { mockHandleMessageStream, MockAgentCtor };
});

vi.mock('@/lib/agents/langchain/agent', () => {
  class LangchainAgent {
    state = { messages: [], lastUpdated: new Date().toISOString(), variables: {} };
    constructor(initial?: unknown) {
      MockAgentCtor(initial);
    }
    handleMessageStream = mockHandleMessageStream;
  }
  return {
    LangchainAgent,
    createAgent: (id?: string) => new LangchainAgent({ conversationId: id }),
    PROMPT_VERSION: 'test-version',
  };
});

// Import AFTER mocks are set up
import { LangchainAgentAdapter } from '@/lib/agents/langchain/adapter';

// =============================================================================
// Helpers
// =============================================================================

function buildInput(text: string, threadId = 'thread-1', runId = 'run-1'): RunAgentInput {
  return {
    threadId,
    runId,
    state: {},
    messages: [
      { id: 'm1', role: 'user', content: text },
    ],
    tools: [],
    context: [],
    forwardedProps: {},
  } as unknown as RunAgentInput;
}

async function collectEvents(adapter: LangchainAgentAdapter, input: RunAgentInput): Promise<BaseEvent[]> {
  return lastValueFrom(adapter.run(input).pipe(toArray()));
}

// =============================================================================
// Tests
// =============================================================================

describe('LangchainAgentAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('event sequence — happy path (text only, no tools)', () => {
    beforeEach(() => {
      mockHandleMessageStream.mockImplementation(async (_msg, onChunk) => {
        onChunk?.('Hello, ');
        onChunk?.('world!');
        return { role: 'assistant', text: 'Hello, world!' };
      });
    });

    it('emits RUN_STARTED first and RUN_FINISHED last', async () => {
      const adapter = new LangchainAgentAdapter({ agentId: 'test-agent' });
      const events = await collectEvents(adapter, buildInput('hi'));

      expect(events[0].type).toBe(EventType.RUN_STARTED);
      expect(events[events.length - 1].type).toBe(EventType.RUN_FINISHED);
    });

    it('threads threadId and runId on RUN_STARTED and RUN_FINISHED', async () => {
      const adapter = new LangchainAgentAdapter({ agentId: 'test-agent' });
      const events = await collectEvents(
        adapter,
        buildInput('hi', 'thread-xyz', 'run-abc'),
      );

      const started = events[0] as BaseEvent & { threadId: string; runId: string };
      const finished = events[events.length - 1] as BaseEvent & { threadId: string; runId: string };
      expect(started.threadId).toBe('thread-xyz');
      expect(started.runId).toBe('run-abc');
      expect(finished.threadId).toBe('thread-xyz');
      expect(finished.runId).toBe('run-abc');
    });

    it('emits TEXT_MESSAGE_START before any TEXT_MESSAGE_CONTENT', async () => {
      const adapter = new LangchainAgentAdapter({ agentId: 'test-agent' });
      const events = await collectEvents(adapter, buildInput('hi'));

      const startIdx = events.findIndex(e => e.type === EventType.TEXT_MESSAGE_START);
      const contentIdx = events.findIndex(e => e.type === EventType.TEXT_MESSAGE_CONTENT);
      expect(startIdx).toBeGreaterThan(-1);
      expect(contentIdx).toBeGreaterThan(startIdx);
    });

    it('emits TEXT_MESSAGE_END before RUN_FINISHED', async () => {
      const adapter = new LangchainAgentAdapter({ agentId: 'test-agent' });
      const events = await collectEvents(adapter, buildInput('hi'));

      const endIdx = events.findIndex(e => e.type === EventType.TEXT_MESSAGE_END);
      const finishedIdx = events.findIndex(e => e.type === EventType.RUN_FINISHED);
      expect(endIdx).toBeGreaterThan(-1);
      expect(finishedIdx).toBeGreaterThan(endIdx);
    });

    it('uses the same messageId across START / CONTENT / END for a single message', async () => {
      const adapter = new LangchainAgentAdapter({ agentId: 'test-agent' });
      const events = await collectEvents(adapter, buildInput('hi'));

      const start = events.find(e => e.type === EventType.TEXT_MESSAGE_START) as BaseEvent & { messageId: string };
      const content = events.find(e => e.type === EventType.TEXT_MESSAGE_CONTENT) as BaseEvent & { messageId: string };
      const end = events.find(e => e.type === EventType.TEXT_MESSAGE_END) as BaseEvent & { messageId: string };

      expect(start.messageId).toBeTruthy();
      expect(content.messageId).toBe(start.messageId);
      expect(end.messageId).toBe(start.messageId);
    });

    it('delivers the full buffered response text in TEXT_MESSAGE_CONTENT events', async () => {
      const adapter = new LangchainAgentAdapter({ agentId: 'test-agent' });
      const events = await collectEvents(adapter, buildInput('hi'));

      const contentEvents = events.filter(e => e.type === EventType.TEXT_MESSAGE_CONTENT) as Array<BaseEvent & { delta: string }>;
      const total = contentEvents.map(e => e.delta).join('');
      expect(total).toBe('Hello, world!');
    });
  });

  describe('chunk buffering — guardrails run before emission', () => {
    it('does not emit TEXT_MESSAGE_CONTENT for empty-string chunks', async () => {
      mockHandleMessageStream.mockImplementation(async (_msg, onChunk) => {
        onChunk?.('');
        onChunk?.('real ');
        onChunk?.('');
        onChunk?.('content');
        onChunk?.('');
        return { role: 'assistant', text: 'real content' };
      });

      const adapter = new LangchainAgentAdapter({ agentId: 'test-agent' });
      const events = await collectEvents(adapter, buildInput('hi'));

      const contentEvents = events.filter(e => e.type === EventType.TEXT_MESSAGE_CONTENT) as Array<BaseEvent & { delta: string }>;
      for (const ev of contentEvents) {
        expect(ev.delta).not.toBe('');
        expect(ev.delta.length).toBeGreaterThan(0);
      }
      const total = contentEvents.map(e => e.delta).join('');
      expect(total).toBe('real content');
    });

    it('does not emit TEXT_MESSAGE_CONTENT or TEXT_MESSAGE_END when final text is empty', async () => {
      mockHandleMessageStream.mockImplementation(async () => {
        // No chunks, no text — e.g. guardrail-blocked or silent response.
        return { role: 'assistant', text: '' };
      });

      const adapter = new LangchainAgentAdapter({ agentId: 'test-agent' });
      const events = await collectEvents(adapter, buildInput('hi'));

      // The adapter always opens a message envelope (TEXT_MESSAGE_START) before
      // calling the agent so that tool-call events are associated correctly.
      // When there is nothing to emit, content and end events are suppressed.
      expect(events.find(e => e.type === EventType.TEXT_MESSAGE_START)).toBeDefined();
      expect(events.find(e => e.type === EventType.TEXT_MESSAGE_CONTENT)).toBeUndefined();
      expect(events.find(e => e.type === EventType.TEXT_MESSAGE_END)).toBeUndefined();
      expect(events[0].type).toBe(EventType.RUN_STARTED);
      expect(events[events.length - 1].type).toBe(EventType.RUN_FINISHED);
    });
  });

  describe('tool call events', () => {
    it('emits TOOL_CALL_START / ARGS / END / RESULT in order when a tool fires', async () => {
      mockHandleMessageStream.mockImplementation(async (_msg, onChunk, onToolCall) => {
        await onToolCall?.({
          id: 'call-1',
          name: 'clinic_summary',
          args: { clinic_name: 'Vera' },
          result: JSON.stringify({ summary: { id: 'x', display_name: 'Vera Clinic' } }),
        });
        onChunk?.('Here is the clinic.');
        return { role: 'assistant', text: 'Here is the clinic.' };
      });

      const adapter = new LangchainAgentAdapter({ agentId: 'test-agent' });
      const events = await collectEvents(adapter, buildInput('tell me about Vera'));

      const startIdx = events.findIndex(e => e.type === EventType.TOOL_CALL_START);
      const argsIdx = events.findIndex(e => e.type === EventType.TOOL_CALL_ARGS);
      const endIdx = events.findIndex(e => e.type === EventType.TOOL_CALL_END);
      const resultIdx = events.findIndex(e => e.type === EventType.TOOL_CALL_RESULT);

      expect(startIdx).toBeGreaterThan(-1);
      expect(argsIdx).toBeGreaterThan(startIdx);
      expect(endIdx).toBeGreaterThan(argsIdx);
      expect(resultIdx).toBeGreaterThan(endIdx);
    });

    it('includes the tool name and args in TOOL_CALL_START / ARGS', async () => {
      mockHandleMessageStream.mockImplementation(async (_msg, _onChunk, onToolCall) => {
        await onToolCall?.({
          id: 'call-7',
          name: 'database_lookup',
          args: { table: 'clinics' },
          result: JSON.stringify({ results: [] }),
        });
        return { role: 'assistant', text: 'done' };
      });

      const adapter = new LangchainAgentAdapter({ agentId: 'test-agent' });
      const events = await collectEvents(adapter, buildInput('lookup'));

      const start = events.find(e => e.type === EventType.TOOL_CALL_START) as BaseEvent & { toolCallId: string; toolCallName: string };
      const args = events.find(e => e.type === EventType.TOOL_CALL_ARGS) as BaseEvent & { toolCallId: string; delta: string };
      const result = events.find(e => e.type === EventType.TOOL_CALL_RESULT) as BaseEvent & { toolCallId: string; content: string };

      expect(start.toolCallId).toBe('call-7');
      expect(start.toolCallName).toBe('database_lookup');
      expect(args.toolCallId).toBe('call-7');
      expect(JSON.parse(args.delta)).toEqual({ table: 'clinics' });
      expect(result.toolCallId).toBe('call-7');
      expect(JSON.parse(result.content)).toEqual({ results: [] });
    });
  });

  describe('error handling', () => {
    it('emits RUN_ERROR with the error message when the agent throws before any chunk', async () => {
      mockHandleMessageStream.mockImplementation(async () => {
        throw new Error('boom');
      });

      const adapter = new LangchainAgentAdapter({ agentId: 'test-agent' });
      const events = await collectEvents(adapter, buildInput('hi'));

      const errorEv = events.find(e => e.type === EventType.RUN_ERROR) as BaseEvent & { message: string };
      expect(errorEv).toBeDefined();
      expect(errorEv.message).toBe('boom');
      // The adapter opens a message envelope before calling the agent (for tool-call ordering),
      // so TEXT_MESSAGE_START is always emitted. No content should be emitted, and the
      // envelope must be closed with TEXT_MESSAGE_END before the error event.
      expect(events.find(e => e.type === EventType.TEXT_MESSAGE_START)).toBeDefined();
      expect(events.find(e => e.type === EventType.TEXT_MESSAGE_CONTENT)).toBeUndefined();
      expect(events.find(e => e.type === EventType.TEXT_MESSAGE_END)).toBeDefined();
    });

    it('emits TEXT_MESSAGE_END before RUN_ERROR if a message had already been opened', async () => {
      mockHandleMessageStream.mockImplementation(async (_msg, onChunk) => {
        onChunk?.('partial...');
        throw new Error('mid-stream failure');
      });

      const adapter = new LangchainAgentAdapter({ agentId: 'test-agent' });
      const events = await collectEvents(adapter, buildInput('hi'));

      const endIdx = events.findIndex(e => e.type === EventType.TEXT_MESSAGE_END);
      const errorIdx = events.findIndex(e => e.type === EventType.RUN_ERROR);

      expect(endIdx).toBeGreaterThan(-1);
      expect(errorIdx).toBeGreaterThan(endIdx);
    });
  });

  describe('per-run agent instances', () => {
    it('creates a fresh LangchainAgent for each run() call', async () => {
      mockHandleMessageStream.mockImplementation(async () => ({ role: 'assistant', text: 'ok' }));

      const adapter = new LangchainAgentAdapter({ agentId: 'test-agent' });
      await firstValueFrom(adapter.run(buildInput('first', 'thread-a')));
      await firstValueFrom(adapter.run(buildInput('second', 'thread-b')));

      // Two runs → two constructions
      expect(MockAgentCtor).toHaveBeenCalledTimes(2);
    });

    it('does not share state across two runs on the same threadId', async () => {
      mockHandleMessageStream.mockImplementation(async () => ({ role: 'assistant', text: 'ok' }));

      const adapter = new LangchainAgentAdapter({ agentId: 'test-agent' });
      await firstValueFrom(adapter.run(buildInput('first', 'thread-same')));
      await firstValueFrom(adapter.run(buildInput('second', 'thread-same')));

      // Both runs build a fresh agent — no sharing
      expect(MockAgentCtor).toHaveBeenCalledTimes(2);
    });
  });

  describe('conversational memory', () => {
    it('passes prior turns (excluding current user message) to the agent constructor', async () => {
      mockHandleMessageStream.mockImplementation(async () => ({ role: 'assistant', text: 'ok' }));

      const adapter = new LangchainAgentAdapter({ agentId: 'test-agent' });
      const input: RunAgentInput = {
        ...buildInput('ignored'),
        messages: [
          { id: 'm1', role: 'user', content: 'hello' },
          { id: 'm2', role: 'assistant', content: 'hi there' },
          { id: 'm3', role: 'user', content: 'current message' },
        ],
      } as unknown as RunAgentInput;

      await firstValueFrom(adapter.run(input));

      expect(MockAgentCtor).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            expect.objectContaining({ role: 'user', text: 'hello' }),
            expect.objectContaining({ role: 'assistant', text: 'hi there' }),
          ],
        })
      );
    });

    it('filters out empty assistant messages (GenUI-only turns) from prior history', async () => {
      mockHandleMessageStream.mockImplementation(async () => ({ role: 'assistant', text: 'ok' }));

      const adapter = new LangchainAgentAdapter({ agentId: 'test-agent' });
      const input: RunAgentInput = {
        ...buildInput('ignored'),
        messages: [
          { id: 'm1', role: 'user', content: 'show me a clinic' },
          { id: 'm2', role: 'assistant', content: '' }, // GenUI-only, no text
          { id: 'm3', role: 'user', content: 'what did you show me' },
        ],
      } as unknown as RunAgentInput;

      await firstValueFrom(adapter.run(input));

      const ctorArg = MockAgentCtor.mock.calls[0][0] as { messages: unknown[] };
      // Empty assistant message should be filtered; only the user message remains
      expect(ctorArg.messages).toHaveLength(1);
      expect(ctorArg.messages[0]).toMatchObject({ role: 'user', text: 'show me a clinic' });
    });

    it('passes threadId as conversationId to the agent constructor', async () => {
      mockHandleMessageStream.mockImplementation(async () => ({ role: 'assistant', text: 'ok' }));

      const adapter = new LangchainAgentAdapter({ agentId: 'test-agent' });
      await firstValueFrom(adapter.run(buildInput('hi', 'thread-xyz')));

      expect(MockAgentCtor).toHaveBeenCalledWith(
        expect.objectContaining({ conversationId: 'thread-xyz' })
      );
    });
  });

  describe('message extraction', () => {
    it('passes the latest user message text to handleMessageStream', async () => {
      mockHandleMessageStream.mockImplementation(async () => ({ role: 'assistant', text: 'ok' }));

      const adapter = new LangchainAgentAdapter({ agentId: 'test-agent' });
      const input: RunAgentInput = {
        ...buildInput('ignored'),
        messages: [
          { id: 'm1', role: 'user', content: 'first' },
          { id: 'm2', role: 'assistant', content: 'response' },
          { id: 'm3', role: 'user', content: 'latest user prompt' },
        ],
      } as unknown as RunAgentInput;

      await firstValueFrom(adapter.run(input));

      expect(mockHandleMessageStream).toHaveBeenCalledTimes(1);
      const firstArg = mockHandleMessageStream.mock.calls[0][0];
      expect(firstArg.role).toBe('user');
      expect(firstArg.text).toBe('latest user prompt');
    });
  });
});
