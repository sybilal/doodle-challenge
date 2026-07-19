import { describe, it, expect, vi, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { useSendMessage } from './useSendMessage';
import { renderHookWithClient } from '../test/test-utils';
import { QUERY_KEY } from '../utils/constants';
import type { IMessage } from '../models/IMessage';

vi.mock('../services/messages.service', () => ({
  createMessage: vi.fn(),
}));

import { createMessage } from '../services/messages.service';
const mockedCreate = vi.mocked(createMessage);

const created: IMessage = {
  _id: 'new',
  message: 'hello',
  author: 'Alice',
  createdAt: '2026-01-03T10:00:00.000Z',
};

describe('useSendMessage', () => {
  beforeEach(() => {
    mockedCreate.mockResolvedValue(created);
  });

  it('calls the service with the message body', async () => {
    const { result } = renderHookWithClient(() => useSendMessage());

    result.current.mutate({ message: 'hello', author: 'Alice' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // React Query passes a context object as a second arg, so assert on the payload only.
    expect(mockedCreate.mock.calls[0][0]).toEqual({ message: 'hello', author: 'Alice' });
  });

  it('merges the created message into the cache on success', async () => {
    const existing: IMessage[] = [
      { _id: '1', message: 'earlier', author: 'Bob', createdAt: '2026-01-01T10:00:00.000Z' },
    ];
    const { result, client } = renderHookWithClient(() => useSendMessage());
    client.setQueryData<IMessage[]>(QUERY_KEY, existing);

    result.current.mutate({ message: 'hello', author: 'Alice' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.getQueryData<IMessage[]>(QUERY_KEY)).toEqual([existing[0], created]);
  });

  it('seeds the cache when it is empty', async () => {
    const { result, client } = renderHookWithClient(() => useSendMessage());

    result.current.mutate({ message: 'hello', author: 'Alice' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.getQueryData<IMessage[]>(QUERY_KEY)).toEqual([created]);
  });

  it('reports an error and leaves the cache untouched when sending fails', async () => {
    mockedCreate.mockRejectedValue(new Error('network down'));
    const { result, client } = renderHookWithClient(() => useSendMessage());

    result.current.mutate({ message: 'hello', author: 'Alice' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(client.getQueryData<IMessage[]>(QUERY_KEY)).toBeUndefined();
  });
});
