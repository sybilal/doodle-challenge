import { describe, it, expect, vi, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { useMessages } from './useMessages';
import { renderHookWithClient } from '../test/test-utils';
import type { IMessage } from '../models/IMessage';

vi.mock('../services/messages.service', () => ({
  getMessages: vi.fn(),
}));

import { getMessages } from '../services/messages.service';
const mockedGetMessages = vi.mocked(getMessages);

const messages: IMessage[] = [
  { _id: '1', message: 'first', author: 'Alice', createdAt: '2026-01-01T10:00:00.000Z' },
  { _id: '2', message: 'second', author: 'Bob', createdAt: '2026-01-02T10:00:00.000Z' },
];

describe('useMessages', () => {
  beforeEach(() => {
    mockedGetMessages.mockResolvedValue(messages);
  });

  it('fetches and returns the messages', async () => {
    const { result } = renderHookWithClient(() => useMessages());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(messages);
  });

  it('requests the default limit of 20 with a "before" cursor', async () => {
    const { result } = renderHookWithClient(() => useMessages());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const params = mockedGetMessages.mock.calls[0][0];
    expect(params).toMatchObject({ limit: 20 });
    expect(typeof params?.before).toBe('string');
    expect(() => new Date(params!.before!).toISOString()).not.toThrow();
  });

  it('honours a custom limit', async () => {
    const { result } = renderHookWithClient(() => useMessages(5));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedGetMessages.mock.calls[0][0]).toMatchObject({ limit: 5 });
  });

  it('surfaces an error when the request fails', async () => {
    mockedGetMessages.mockRejectedValue(new Error('boom'));

    const { result } = renderHookWithClient(() => useMessages());

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('boom'));
  });
});
