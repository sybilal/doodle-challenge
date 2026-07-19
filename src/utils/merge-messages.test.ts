import { describe, it, expect } from 'vitest';
import { mergeMessages } from './merge-messages';
import type { IMessage } from '../models/IMessage';

const msg = (id: string, createdAt: string, overrides: Partial<IMessage> = {}): IMessage => ({
  _id: id,
  message: `message ${id}`,
  author: 'Someone',
  createdAt,
  ...overrides,
});

describe('mergeMessages', () => {
  it('returns messages sorted by createdAt ascending', () => {
    const existing = [
      msg('b', '2026-01-02T10:00:00.000Z'),
      msg('a', '2026-01-01T10:00:00.000Z'),
    ];

    const result = mergeMessages(existing, []);

    expect(result.map((m) => m._id)).toEqual(['a', 'b']);
  });

  it('merges incoming messages into existing ones', () => {
    const existing = [msg('a', '2026-01-01T10:00:00.000Z')];
    const incoming = [msg('b', '2026-01-02T10:00:00.000Z')];

    const result = mergeMessages(existing, incoming);

    expect(result.map((m) => m._id)).toEqual(['a', 'b']);
  });

  it('deduplicates by _id, keeping the incoming version', () => {
    const existing = [msg('a', '2026-01-01T10:00:00.000Z', { message: 'old' })];
    const incoming = [msg('a', '2026-01-01T10:00:00.000Z', { message: 'edited' })];

    const result = mergeMessages(existing, incoming);

    expect(result).toHaveLength(1);
    expect(result[0].message).toBe('edited');
  });

  it('interleaves incoming messages into the correct chronological position', () => {
    const existing = [
      msg('a', '2026-01-01T10:00:00.000Z'),
      msg('c', '2026-01-03T10:00:00.000Z'),
    ];
    const incoming = [msg('b', '2026-01-02T10:00:00.000Z')];

    const result = mergeMessages(existing, incoming);

    expect(result.map((m) => m._id)).toEqual(['a', 'b', 'c']);
  });

  it('does not mutate the input arrays', () => {
    const existing = [msg('a', '2026-01-01T10:00:00.000Z')];
    const incoming = [msg('b', '2026-01-02T10:00:00.000Z')];

    mergeMessages(existing, incoming);

    expect(existing).toHaveLength(1);
    expect(incoming).toHaveLength(1);
  });

  it('returns an empty array when both inputs are empty', () => {
    expect(mergeMessages([], [])).toEqual([]);
  });
});
