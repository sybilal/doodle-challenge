import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IMessage } from '../models/IMessage';

vi.mock('../utils/interceptor', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { http } from '../utils/interceptor';
import {
  getMessages,
  getMessagesAfter,
  getMessagesBefore,
  createMessage,
} from './messages.service';

const mockedGet = vi.mocked(http.get);
const mockedPost = vi.mocked(http.post);

const message: IMessage = {
  _id: '1',
  message: 'hi',
  author: 'Alice',
  createdAt: '2026-01-01T10:00:00.000Z',
};

describe('messages.service', () => {
  beforeEach(() => {
    mockedGet.mockResolvedValue([message]);
    mockedPost.mockResolvedValue(message);
  });

  describe('getMessages', () => {
    it('requests /messages with no params by default', async () => {
      const result = await getMessages();
      expect(mockedGet).toHaveBeenCalledWith('/messages', { params: {} });
      expect(result).toEqual([message]);
    });

    it('forwards the provided params', async () => {
      await getMessages({ limit: 5, before: '2026-01-02T00:00:00.000Z' });
      expect(mockedGet).toHaveBeenCalledWith('/messages', {
        params: { limit: 5, before: '2026-01-02T00:00:00.000Z' },
      });
    });
  });

  describe('getMessagesAfter', () => {
    it('requests /messages with the after cursor and a default limit of 50', async () => {
      await getMessagesAfter('2026-01-01T10:00:00.000Z');
      expect(mockedGet).toHaveBeenCalledWith('/messages', {
        params: { after: '2026-01-01T10:00:00.000Z', limit: 50 },
      });
    });

    it('honours a custom limit', async () => {
      await getMessagesAfter('2026-01-01T10:00:00.000Z', 10);
      expect(mockedGet).toHaveBeenCalledWith('/messages', {
        params: { after: '2026-01-01T10:00:00.000Z', limit: 10 },
      });
    });
  });

  describe('getMessagesBefore', () => {
    it('requests /messages with the before cursor and a default limit of 20', async () => {
      await getMessagesBefore('2026-01-01T10:00:00.000Z');
      expect(mockedGet).toHaveBeenCalledWith('/messages', {
        params: { before: '2026-01-01T10:00:00.000Z', limit: 20 },
      });
    });

    it('honours a custom limit', async () => {
      await getMessagesBefore('2026-01-01T10:00:00.000Z', 25);
      expect(mockedGet).toHaveBeenCalledWith('/messages', {
        params: { before: '2026-01-01T10:00:00.000Z', limit: 25 },
      });
    });
  });

  describe('createMessage', () => {
    it('posts the message body to /messages and returns the created message', async () => {
      const body = { message: 'hello', author: 'Alice' };
      const result = await createMessage(body);
      expect(mockedPost).toHaveBeenCalledWith('/messages', body);
      expect(result).toEqual(message);
    });
  });
});
