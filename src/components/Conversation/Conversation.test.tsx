import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { IMessage } from '../../models/IMessage';

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: (options: {
    count: number;
    getItemKey?: (index: number) => string;
  }) => {
    const items = Array.from({ length: options.count }, (_, index) => ({
      index,
      key: options.getItemKey ? options.getItemKey(index) : index,
      start: index * 130,
      end: (index + 1) * 130,
      size: 130,
    }));
    return {
      getVirtualItems: () => items,
      getTotalSize: () => options.count * 130,
      scrollToIndex: vi.fn(),
      measureElement: () => {},
    };
  },
}));

vi.mock('../../hooks/useMessages', () => ({ useMessages: vi.fn() }));
vi.mock('../../hooks/usePollMessages', () => ({ usePollMessages: vi.fn() }));
vi.mock('../../hooks/useOlderMessages', () => ({ useOlderMessages: vi.fn() }));

import Conversation from './Conversation';
import { useMessages } from '../../hooks/useMessages';
import { useOlderMessages } from '../../hooks/useOlderMessages';

const mockedUseMessages = vi.mocked(useMessages);
const mockedUseOlderMessages = vi.mocked(useOlderMessages);

const messages: IMessage[] = [
  { _id: 'a', author: 'Alice', message: 'Hello there', createdAt: '2026-01-01T10:00:00.000Z' },
  { _id: 'b', author: 'Syed Bilal', message: 'Hi back', createdAt: '2026-01-02T10:00:00.000Z' },
];

// Minimal shapes matching what Conversation reads off each hook.
const messagesResult = (overrides: Partial<ReturnType<typeof useMessages>> = {}) =>
  ({ data: messages, isLoading: false, isError: false, error: null, ...overrides }) as ReturnType<
    typeof useMessages
  >;

const olderResult = (overrides: Partial<ReturnType<typeof useOlderMessages>> = {}) => ({
  loadOlder: vi.fn(),
  hasMore: true,
  isLoadingOlder: false,
  error: null,
  ...overrides,
});

describe('Conversation', () => {
  beforeEach(() => {
    mockedUseMessages.mockReturnValue(messagesResult());
    mockedUseOlderMessages.mockReturnValue(olderResult());
  });

  it('shows a loading state while the first page is loading', () => {
    mockedUseMessages.mockReturnValue(messagesResult({ data: undefined, isLoading: true }));

    render(<Conversation />);

    expect(screen.getByText('Loading messages…')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('shows the error message when the first page fails to load', () => {
    mockedUseMessages.mockReturnValue(
      messagesResult({ data: undefined, isError: true, error: new Error('Boom') }),
    );

    render(<Conversation />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Failed to load messages: Boom');
  });

  it('renders the messages as an accessible list', () => {
    render(<Conversation />);

    expect(screen.getByRole('region', { name: 'Conversation messages' })).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(screen.getByText('Hello there')).toBeInTheDocument();
    expect(screen.getByText('Hi back')).toBeInTheDocument();
    // Author is shown for others, hidden for your own message.
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(items[1]).toHaveAccessibleName(/^You,/);
  });

  it('announces the newest message in a live region', () => {
    render(<Conversation />);
    expect(screen.getByText('You: Hi back')).toBeInTheDocument();
  });

  it('shows a "loading older messages" indicator when paging back', () => {
    mockedUseOlderMessages.mockReturnValue(olderResult({ isLoadingOlder: true }));

    render(<Conversation />);

    expect(screen.getByText('Loading older messages…')).toBeInTheDocument();
  });

  it('shows a retryable error bar when loading older messages fails', async () => {
    const loadOlder = vi.fn();
    mockedUseOlderMessages.mockReturnValue(
      olderResult({ error: new Error('older failed'), loadOlder }),
    );

    render(<Conversation />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent("Couldn't load older messages.");

    expect(loadOlder).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(loadOlder).toHaveBeenCalledTimes(1);
  });
});
