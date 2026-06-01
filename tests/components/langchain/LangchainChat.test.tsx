import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Message } from '@ag-ui/core';

// =============================================================================
// Mocks — must be defined before component import
// =============================================================================

const mockCopilotChat = vi.hoisted(() => ({
  messages: [] as Message[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendMessage: vi.fn() as any,
  isLoading: false,
}));

vi.mock('@copilotkit/react-core', () => ({
  useCopilotChatInternal: () => mockCopilotChat,
}));

// Stub sub-components that have their own test files or CopilotKit dependencies
vi.mock('@/components/langchain/MessageBubble', () => ({
  default: ({ message }: { message: { id: string; role: string; content: unknown } }) => (
    <div
      data-testid={`bubble-${message.role}`}
      data-message-id={message.id}
    >
      {typeof message.content === 'string' ? message.content : ''}
    </div>
  ),
}));

vi.mock('@/components/langchain/TypingIndicator', () => ({
  default: () => <div data-testid="typing-indicator" />,
}));

vi.mock('@/components/langchain/LangchainInput', () => ({
  default: ({ onSend, isLoading }: { onSend: (t: string) => void; isLoading: boolean }) => (
    <div data-testid="langchain-input">
      <button data-testid="input-send" disabled={isLoading} onClick={() => onSend('typed message')}>
        Send
      </button>
    </div>
  ),
}));

import LangchainChat from '@/components/langchain/LangchainChat';

// =============================================================================
// Per-test setup
// =============================================================================

beforeEach(() => {
  vi.clearAllMocks();
  mockCopilotChat.messages = [];
  mockCopilotChat.sendMessage = vi.fn().mockResolvedValue(undefined);
  mockCopilotChat.isLoading = false;

  // jsdom doesn't implement ResizeObserver or scrollTo; arrow fns can't be `new`-ed
  global.ResizeObserver = class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_cb: ResizeObserverCallback) {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.scrollTo = vi.fn() as unknown as typeof Element.prototype.scrollTo;

  vi.spyOn(crypto, 'randomUUID').mockReturnValue(
    'test-uuid' as `${string}-${string}-${string}-${string}-${string}`
  );
});

// =============================================================================
// Tests
// =============================================================================

describe('LangchainChat', () => {
  // ---------------------------------------------------------------------------
  // Greeting state
  // ---------------------------------------------------------------------------

  describe('initial render (no messages)', () => {
    it('shows greeting text', () => {
      render(<LangchainChat />);
      expect(screen.getByText(/Hi, I'm Leila/)).toBeInTheDocument();
    });

    it('shows 4 quick suggestion buttons', () => {
      render(<LangchainChat />);
      expect(screen.getByText('Schedule a free consultation')).toBeInTheDocument();
      expect(screen.getByText('What is a hair transplant?')).toBeInTheDocument();
      expect(screen.getByText('How much does it cost?')).toBeInTheDocument();
      expect(screen.getByText('What is the recovery time?')).toBeInTheDocument();
    });

    it('does not show a typing indicator when idle', () => {
      render(<LangchainChat />);
      expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Message thread
  // ---------------------------------------------------------------------------

  describe('message rendering', () => {
    it('hides greeting when messages exist', () => {
      mockCopilotChat.messages = [{ id: 'u1', role: 'user', content: 'Hello' }];
      render(<LangchainChat />);
      expect(screen.queryByText(/Hi, I'm Leila/)).not.toBeInTheDocument();
    });

    it('renders user message bubbles', () => {
      mockCopilotChat.messages = [
        { id: 'u1', role: 'user', content: 'What is FUE?' },
      ];
      render(<LangchainChat />);
      expect(screen.getByTestId('bubble-user')).toBeInTheDocument();
      expect(screen.getByText('What is FUE?')).toBeInTheDocument();
    });

    it('renders assistant message bubbles', () => {
      mockCopilotChat.messages = [
        { id: 'u1', role: 'user', content: 'Hi' },
        { id: 'a1', role: 'assistant', content: 'Hello! How can I help?' },
      ];
      render(<LangchainChat />);
      expect(screen.getByTestId('bubble-assistant')).toBeInTheDocument();
    });

    it('filters out tool and activity messages', () => {
      mockCopilotChat.messages = [
        { id: 'u1', role: 'user', content: 'Show me clinics' },
        { id: 't1', role: 'tool', content: '{"results":[]}', toolCallId: 'tc1' },
        { id: 'a1', role: 'assistant', content: 'Here are the results.' },
      ];
      render(<LangchainChat />);
      // Only user + assistant bubbles should render; tool message is filtered
      expect(screen.getAllByTestId(/^bubble-/).length).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // Sending messages
  // ---------------------------------------------------------------------------

  describe('sending messages', () => {
    it('calls sendMessage with correct payload when a suggestion is clicked', async () => {
      const user = userEvent.setup();
      render(<LangchainChat />);

      await user.click(screen.getByText('What is a hair transplant?'));

      expect(mockCopilotChat.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-uuid',
          role: 'user',
          content: 'What is a hair transplant?',
        })
      );
    });

    it('does not call sendMessage when isLoading is true', async () => {
      // When isLoading=true the greeting is hidden (showGreeting requires !isLoading),
      // so suggestion buttons are gone. Use a message so the thread/input bar is shown,
      // then click the (disabled) input send button.
      mockCopilotChat.messages = [{ id: 'u1', role: 'user', content: 'Hi' }];
      mockCopilotChat.isLoading = true;
      const user = userEvent.setup();
      render(<LangchainChat />);

      await user.click(screen.getByTestId('input-send'));

      expect(mockCopilotChat.sendMessage).not.toHaveBeenCalled();
    });

    it('hides greeting immediately after send (awaitingAssistant becomes true)', async () => {
      const user = userEvent.setup();
      render(<LangchainChat />);

      await user.click(screen.getByText('What is a hair transplant?'));

      await waitFor(() => {
        expect(screen.queryByText(/Hi, I'm Leila/)).not.toBeInTheDocument();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Typing indicator
  // ---------------------------------------------------------------------------

  describe('typing indicator', () => {
    it('shows typing indicator when isLoading is true', () => {
      mockCopilotChat.messages = [{ id: 'u1', role: 'user', content: 'Hi' }];
      mockCopilotChat.isLoading = true;
      render(<LangchainChat />);
      expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
    });

    it('shows typing indicator after sending while awaiting assistant', async () => {
      // sendMessage never resolves so awaitingAssistant stays true
      mockCopilotChat.sendMessage = vi.fn().mockReturnValue(new Promise(() => {}));
      const user = userEvent.setup();
      render(<LangchainChat />);

      await user.click(screen.getByText('What is a hair transplant?'));

      await waitFor(() => {
        expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
      });
    });

    it('clears typing indicator when assistant message arrives', async () => {
      mockCopilotChat.sendMessage = vi.fn().mockResolvedValue(undefined);
      const { rerender } = render(<LangchainChat />);
      const user = userEvent.setup();

      await user.click(screen.getByText('What is a hair transplant?'));

      // Simulate assistant response arriving in the next render
      mockCopilotChat.messages = [
        { id: 'u1', role: 'user', content: 'What is a hair transplant?' },
        { id: 'a1', role: 'assistant', content: 'FUE is a minimally invasive technique.' },
      ];
      rerender(<LangchainChat />);

      await waitFor(() => {
        expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument();
      });
    });
  });
});
