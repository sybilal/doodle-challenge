import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import { usePollMessages } from './usePollMessages';
import { renderHookWithClient } from '../test/test-utils';
import { POLL_INTERVAL, QUERY_KEY } from '../utils/constants';
import type { IMessage } from '../models/IMessage';

vi.mock('../services/messages.service', () => ({
  getMessagesAfter: vi.fn(),
}));

import { getMessagesAfter } from '../services/messages.service';
const mockedGetAfter = vi.mocked(getMessagesAfter);


const seeded: IMessage = {
  _id: '1',
  message: 'existing',
  author: 'Alice',
  createdAt: '2026-01-01T10:00:00.000Z',
};

const fresh: IMessage = {
  _id: '2',
  message: 'brand new',
  author: 'Bob',
  createdAt: '2026-01-02T10:00:00.000Z',
};

// Advance fake timers by one interval and flush the async tick.
const advanceOneTick = () =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL);
  });

describe('usePollMessages', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockedGetAfter.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not poll when disabled', async () => {
    renderHookWithClient(() => usePollMessages(false));

    await advanceOneTick();

    expect(mockedGetAfter).not.toHaveBeenCalled();
  });

  it('polls after the interval using the newest cached message as the cursor', async () => {
    const { client } = renderHookWithClient(() => usePollMessages(true));
    client.setQueryData<IMessage[]>(QUERY_KEY, [seeded]);

    await advanceOneTick();

    expect(mockedGetAfter).toHaveBeenCalledWith(seeded.createdAt, 50);
  });

  it('falls back to the current time as the cursor when the cache is empty', async () => {
    renderHookWithClient(() => usePollMessages(true));

    await advanceOneTick();

    expect(mockedGetAfter).toHaveBeenCalledTimes(1);
    const [cursor, limit] = mockedGetAfter.mock.calls[0];
    expect(typeof cursor).toBe('string');
    expect(Number.isNaN(new Date(cursor).getTime())).toBe(false);
    expect(limit).toBe(50);
  });

  it('merges freshly polled messages into the cache', async () => {
    mockedGetAfter.mockResolvedValue([fresh]);
    const { client } = renderHookWithClient(() => usePollMessages(true));
    client.setQueryData<IMessage[]>(QUERY_KEY, [seeded]);

    await advanceOneTick();

    expect(client.getQueryData<IMessage[]>(QUERY_KEY)).toEqual([seeded, fresh]);
  });

  it('does not touch the cache when no new messages arrive', async () => {
    mockedGetAfter.mockResolvedValue([]);
    const { client } = renderHookWithClient(() => usePollMessages(true));
    client.setQueryData<IMessage[]>(QUERY_KEY, [seeded]);

    await advanceOneTick();

    expect(client.getQueryData<IMessage[]>(QUERY_KEY)).toEqual([seeded]);
  });

  it('skips the fetch while the tab is hidden but keeps polling', async () => {
    const hiddenSpy = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    const { client } = renderHookWithClient(() => usePollMessages(true));
    client.setQueryData<IMessage[]>(QUERY_KEY, [seeded]);

    await advanceOneTick();
    expect(mockedGetAfter).not.toHaveBeenCalled();

    // Tab becomes visible again — the next scheduled tick should fetch.
    hiddenSpy.mockReturnValue(false);
    await advanceOneTick();
    expect(mockedGetAfter).toHaveBeenCalledTimes(1);
  });

  it('logs and continues polling when a poll fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    mockedGetAfter.mockRejectedValue(new Error('poll failed'));
    const { client } = renderHookWithClient(() => usePollMessages(true));
    client.setQueryData<IMessage[]>(QUERY_KEY, [seeded]);

    await advanceOneTick();
    expect(consoleSpy).toHaveBeenCalled();

    // Still polling on the next interval despite the earlier failure.
    await advanceOneTick();
    expect(mockedGetAfter).toHaveBeenCalledTimes(2);
  });

  it('stops polling after unmount', async () => {
    const { unmount, client } = renderHookWithClient(() => usePollMessages(true));
    client.setQueryData<IMessage[]>(QUERY_KEY, [seeded]);

    unmount();
    await advanceOneTick();

    expect(mockedGetAfter).not.toHaveBeenCalled();
  });
});
