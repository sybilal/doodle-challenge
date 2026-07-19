import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, waitFor } from '@testing-library/react';
import { useOlderMessages } from './useOlderMessages';
import { renderHookWithClient } from '../test/test-utils';
import { MESSAGES_LIMIT, QUERY_KEY } from '../utils/constants';
import type { IMessage } from '../models/IMessage';

vi.mock('../services/messages.service', () => ({
  getMessagesBefore: vi.fn(),
}));

import { getMessagesBefore } from '../services/messages.service';
const mockedGetBefore = vi.mocked(getMessagesBefore);

const makeMessages = (count: number, startDay: number): IMessage[] =>
  Array.from({ length: count }, (_, i) => ({
    _id: `old-${startDay}-${i}`,
    message: `old ${startDay}-${i}`,
    author: 'Alice',
    createdAt: `2026-01-${String(startDay + i).padStart(2, '0')}T10:00:00.000Z`,
  }));

// A message already in the cache; its createdAt is the "before" cursor.
const seeded: IMessage = {
  _id: 'seed',
  message: 'newest so far',
  author: 'Bob',
  createdAt: '2026-02-01T10:00:00.000Z',
};

describe('useOlderMessages', () => {
  beforeEach(() => {
    mockedGetBefore.mockResolvedValue([]);
  });

  it('starts with hasMore true and not loading', () => {
    const { result } = renderHookWithClient(() => useOlderMessages());
    expect(result.current.hasMore).toBe(true);
    expect(result.current.isLoadingOlder).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('does nothing when there is no cursor (empty cache)', async () => {
    const { result } = renderHookWithClient(() => useOlderMessages());

    await act(async () => {
      await result.current.loadOlder();
    });

    expect(mockedGetBefore).not.toHaveBeenCalled();
  });

  it('fetches older messages using the oldest cached message as the cursor', async () => {
    const older = makeMessages(MESSAGES_LIMIT, 1);
    mockedGetBefore.mockResolvedValue(older);

    const { result, client } = renderHookWithClient(() => useOlderMessages());
    client.setQueryData<IMessage[]>(QUERY_KEY, [seeded]);

    await act(async () => {
      await result.current.loadOlder();
    });

    expect(mockedGetBefore).toHaveBeenCalledWith(seeded.createdAt, MESSAGES_LIMIT);
    // Older messages are prepended (merged + sorted) ahead of the seed.
    const cached = client.getQueryData<IMessage[]>(QUERY_KEY)!;
    expect(cached).toHaveLength(MESSAGES_LIMIT + 1);
    expect(cached[cached.length - 1]._id).toBe('seed');
  });

  it('keeps hasMore true when a full page is returned', async () => {
    mockedGetBefore.mockResolvedValue(makeMessages(MESSAGES_LIMIT, 1));

    const { result, client } = renderHookWithClient(() => useOlderMessages());
    client.setQueryData<IMessage[]>(QUERY_KEY, [seeded]);

    await act(async () => {
      await result.current.loadOlder();
    });

    expect(result.current.hasMore).toBe(true);
  });

  it('sets hasMore false when a partial (final) page is returned', async () => {
    mockedGetBefore.mockResolvedValue(makeMessages(MESSAGES_LIMIT - 1, 1));

    const { result, client } = renderHookWithClient(() => useOlderMessages());
    client.setQueryData<IMessage[]>(QUERY_KEY, [seeded]);

    await act(async () => {
      await result.current.loadOlder();
    });

    await waitFor(() => expect(result.current.hasMore).toBe(false));
  });

  it('leaves the cache untouched and stops paging when an empty page is returned', async () => {
    mockedGetBefore.mockResolvedValue([]);

    const { result, client } = renderHookWithClient(() => useOlderMessages());
    client.setQueryData<IMessage[]>(QUERY_KEY, [seeded]);

    await act(async () => {
      await result.current.loadOlder();
    });

    expect(mockedGetBefore).toHaveBeenCalledWith(seeded.createdAt, MESSAGES_LIMIT);
    expect(client.getQueryData<IMessage[]>(QUERY_KEY)).toEqual([seeded]);
    await waitFor(() => expect(result.current.hasMore).toBe(false));
  });

  it('wraps a non-Error rejection in a generic Error', async () => {
    mockedGetBefore.mockRejectedValue('just a string');

    const { result, client } = renderHookWithClient(() => useOlderMessages());
    client.setQueryData<IMessage[]>(QUERY_KEY, [seeded]);

    await act(async () => {
      await result.current.loadOlder();
    });

    await waitFor(() =>
      expect(result.current.error).toEqual(new Error('Failed to load older messages')),
    );
  });

  it('captures an error when the request fails', async () => {
    mockedGetBefore.mockRejectedValue(new Error('cannot load older'));

    const { result, client } = renderHookWithClient(() => useOlderMessages());
    client.setQueryData<IMessage[]>(QUERY_KEY, [seeded]);

    await act(async () => {
      await result.current.loadOlder();
    });

    await waitFor(() => expect(result.current.error).toEqual(new Error('cannot load older')));
    expect(result.current.isLoadingOlder).toBe(false);
  });

  it('does not fetch again once hasMore is false', async () => {
    mockedGetBefore.mockResolvedValue(makeMessages(MESSAGES_LIMIT - 1, 1));

    const { result, client } = renderHookWithClient(() => useOlderMessages());
    client.setQueryData<IMessage[]>(QUERY_KEY, [seeded]);

    await act(async () => {
      await result.current.loadOlder();
    });
    await waitFor(() => expect(result.current.hasMore).toBe(false));

    mockedGetBefore.mockClear();
    await act(async () => {
      await result.current.loadOlder();
    });

    expect(mockedGetBefore).not.toHaveBeenCalled();
  });
});
