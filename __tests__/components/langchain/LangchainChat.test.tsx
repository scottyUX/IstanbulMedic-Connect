import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LangchainChat from '@/components/langchain/LangchainChat';

// Helper: create a ReadableStream from text chunks
function createMockStream(chunks: string[]) {
  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
        // Small delay to simulate streaming
        await new Promise((r) => setTimeout(r, 10));
      }
      controller.close();
    },
  });
}

// Mock fetch
const mockFetch = vi.fn();

// Mock crypto.randomUUID for deterministic IDs
let uuidCounter = 0;

beforeEach(() => {
  vi.clearAllMocks();
  uuidCounter = 0;

  global.fetch = mockFetch;
  vi.spyOn(crypto, 'randomUUID').mockImplementation(
    () => `test-uuid-${++uuidCounter}` as `${string}-${string}-${string}-${string}-${string}`
  );

  // Default mock: successful streaming response
  mockFetch.mockResolvedValue(
    new Response(createMockStream(['Hello', ' from', ' Leila']), {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  );
});

describe('LangchainChat', () => {
  // ===========================================================================
  // Initial render
  // ===========================================================================

  describe('initial render', () => {
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
  });

  // ===========================================================================
  // Sending messages
  // ===========================================================================

  describe('sending messages', () => {
    it('clicking a suggestion sends the message', async () => {
      const user = userEvent.setup();
      render(<LangchainChat />);

      await user.click(screen.getByText('What is a hair transplant?'));

      expect(mockFetch).toHaveBeenCalledWith('/api/langchain-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('What is a hair transplant?'),
      });
    });

    it('hides greeting after sending a message', async () => {
      const user = userEvent.setup();
      render(<LangchainChat />);

      await user.click(screen.getByText('What is a hair transplant?'));

      await waitFor(() => {
        expect(screen.queryByText('Schedule a free consultation')).not.toBeInTheDocument();
      });
    });

    it('shows user message after sending', async () => {
      const user = userEvent.setup();
      render(<LangchainChat />);

      await user.click(screen.getByText('What is a hair transplant?'));

      await waitFor(() => {
        expect(screen.getByText('What is a hair transplant?')).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // Loading and streaming
  // ===========================================================================

  describe('loading and streaming', () => {
    it('shows thinking dots during loading', async () => {
      // Delay the fetch response so we can observe loading state
      mockFetch.mockReturnValueOnce(new Promise(() => {})); // never resolves

      const user = userEvent.setup();
      render(<LangchainChat />);

      await user.click(screen.getByText('What is a hair transplant?'));

      await waitFor(() => {
        expect(document.querySelector('.langchain-thinking-dots')).toBeInTheDocument();
      });
    });

    it('displays assistant message after stream completes', async () => {
      const user = userEvent.setup();
      render(<LangchainChat />);

      await user.click(screen.getByText('How much does it cost?'));

      await waitFor(() => {
        expect(screen.getByText('Hello from Leila')).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // Error handling
  // ===========================================================================

  describe('error handling', () => {
    it('shows error message when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const user = userEvent.setup();
      render(<LangchainChat />);

      await user.click(screen.getByText('What is a hair transplant?'));

      await waitFor(() => {
        expect(
          screen.getByText('Sorry, something went wrong. Please try again.')
        ).toBeInTheDocument();
      });
    });

    it('shows error message when response is not ok', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(null, { status: 500 })
      );

      const user = userEvent.setup();
      render(<LangchainChat />);

      await user.click(screen.getByText('What is a hair transplant?'));

      await waitFor(() => {
        expect(
          screen.getByText('Sorry, something went wrong. Please try again.')
        ).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // Multiple messages
  // ===========================================================================

  describe('multiple messages', () => {
    it('renders both user and assistant message pairs', async () => {
      mockFetch
        .mockResolvedValueOnce(
          new Response(createMockStream(['First response']), { status: 200 })
        )
        .mockResolvedValueOnce(
          new Response(createMockStream(['Second response']), { status: 200 })
        );

      const user = userEvent.setup();
      render(<LangchainChat />);

      // First message
      await user.click(screen.getByText('What is a hair transplant?'));
      await waitFor(() => {
        expect(screen.getByText('First response')).toBeInTheDocument();
      });

      // Type second message manually
      const textarea = screen.getByPlaceholderText('Ask me anything about your hair transplant...');
      await user.type(textarea, 'Tell me more');
      await user.click(screen.getByLabelText('Send message'));

      await waitFor(() => {
        expect(screen.getByText('Second response')).toBeInTheDocument();
      });

      // Both user messages should be visible
      expect(screen.getByText('What is a hair transplant?')).toBeInTheDocument();
      expect(screen.getByText('Tell me more')).toBeInTheDocument();
    });
  });
});
