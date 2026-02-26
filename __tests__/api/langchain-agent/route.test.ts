import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the agent
const mockHandleMessageStream = vi.fn();
const MockLangchainAgent = vi.fn();

vi.mock('@/lib/agents/langchain/agent', () => {
  function LangchainAgent(this: any) {
    MockLangchainAgent(...arguments);
    this.handleMessageStream = mockHandleMessageStream;
  }
  return { LangchainAgent };
});

import { POST } from '@/app/api/langchain-agent/route';

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/langchain-agent', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/langchain-agent', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock: streams "Hello world" then resolves
    mockHandleMessageStream.mockImplementation(
      async (_msg: unknown, onChunk?: (chunk: string) => void) => {
        onChunk?.('Hello');
        onChunk?.(' world');
        return { role: 'assistant', text: 'Hello world', createdAt: new Date().toISOString() };
      }
    );
  });

  it('returns 200 with streaming response for valid messages', async () => {
    const req = makeRequest({
      messages: [{ role: 'user', text: 'Hi' }],
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const text = await res.text();
    expect(text).toBe('Hello world');
  });

  it('returns 400 for empty messages array', async () => {
    const req = makeRequest({ messages: [] });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('returns 400 for missing messages field', async () => {
    const req = makeRequest({});
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('sets correct streaming headers', async () => {
    const req = makeRequest({
      messages: [{ role: 'user', text: 'Hi' }],
    });

    const res = await POST(req);

    expect(res.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
    expect(res.headers.get('Cache-Control')).toBe('no-cache');
  });

  it('constructs agent with history (all but last message)', async () => {
    const messages = [
      { role: 'user', text: 'First' },
      { role: 'assistant', text: 'Response' },
      { role: 'user', text: 'Second' },
    ];

    const req = makeRequest({ messages });
    await POST(req);

    // Agent constructed with first 2 messages as history
    expect(MockLangchainAgent).toHaveBeenCalledWith({
      messages: [messages[0], messages[1]],
    });

    // handleMessageStream called with last message
    expect(mockHandleMessageStream).toHaveBeenCalledWith(
      messages[2],
      expect.any(Function)
    );
  });

  it('handles agent streaming error without crashing', async () => {
    mockHandleMessageStream.mockRejectedValueOnce(new Error('OpenAI error'));

    const req = makeRequest({
      messages: [{ role: 'user', text: 'Hi' }],
    });

    // Should not throw — the route catches and aborts the stream
    const res = await POST(req);
    expect(res.status).toBe(200); // response is created before error
  });

  it('returns 500 for invalid JSON body', async () => {
    const req = new NextRequest('http://localhost:3000/api/langchain-agent', {
      method: 'POST',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});
