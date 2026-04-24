import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LangchainInput from '@/components/langchain/LangchainInput';

describe('LangchainInput', () => {
  const mockOnSend = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Rendering
  // ===========================================================================

  describe('rendering', () => {
    it('renders textarea and send button', () => {
      render(<LangchainInput onSend={mockOnSend} isLoading={false} />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByLabelText('Send message')).toBeInTheDocument();
    });

    it('shows correct placeholder text', () => {
      render(<LangchainInput onSend={mockOnSend} isLoading={false} />);

      expect(
        screen.getByPlaceholderText('Ask me anything about your hair transplant...')
      ).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Sending messages
  // ===========================================================================

  describe('sending messages', () => {
    it('calls onSend with trimmed text when send button is clicked', async () => {
      const user = userEvent.setup();
      render(<LangchainInput onSend={mockOnSend} isLoading={false} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, '  Hello world  ');
      await user.click(screen.getByLabelText('Send message'));

      expect(mockOnSend).toHaveBeenCalledWith('Hello world');
    });

    it('clears textarea after sending', async () => {
      const user = userEvent.setup();
      render(<LangchainInput onSend={mockOnSend} isLoading={false} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello');
      await user.click(screen.getByLabelText('Send message'));

      expect(textarea).toHaveValue('');
    });

    it('submits on Enter key', async () => {
      const user = userEvent.setup();
      render(<LangchainInput onSend={mockOnSend} isLoading={false} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello{Enter}');

      expect(mockOnSend).toHaveBeenCalledWith('Hello');
    });

    it('does not submit on Shift+Enter', async () => {
      const user = userEvent.setup();
      render(<LangchainInput onSend={mockOnSend} isLoading={false} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello{Shift>}{Enter}{/Shift}');

      expect(mockOnSend).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Disabled states
  // ===========================================================================

  describe('disabled states', () => {
    it('send button is disabled when textarea is empty', () => {
      render(<LangchainInput onSend={mockOnSend} isLoading={false} />);
      expect(screen.getByLabelText('Send message')).toBeDisabled();
    });

    it('send button is disabled when textarea is whitespace only', async () => {
      const user = userEvent.setup();
      render(<LangchainInput onSend={mockOnSend} isLoading={false} />);

      await user.type(screen.getByRole('textbox'), '   ');
      expect(screen.getByLabelText('Send message')).toBeDisabled();
    });

    it('does not send empty messages', async () => {
      const user = userEvent.setup();
      render(<LangchainInput onSend={mockOnSend} isLoading={false} />);

      await user.click(screen.getByLabelText('Send message'));
      expect(mockOnSend).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Loading state
  // ===========================================================================

  describe('loading state', () => {
    it('disables textarea when loading', () => {
      render(<LangchainInput onSend={mockOnSend} isLoading={true} />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('disables send button when loading', () => {
      render(<LangchainInput onSend={mockOnSend} isLoading={true} />);
      expect(screen.getByLabelText('Send message')).toBeDisabled();
    });

    it('shows spinner instead of send icon when loading', () => {
      render(<LangchainInput onSend={mockOnSend} isLoading={true} />);
      expect(document.querySelector('.langchain-spinner')).toBeInTheDocument();
    });

    it('does not show spinner when not loading', () => {
      render(<LangchainInput onSend={mockOnSend} isLoading={false} />);
      expect(document.querySelector('.langchain-spinner')).not.toBeInTheDocument();
    });
  });
});
