import type { IMessage, IMessageBody } from '../models/IMessage';
import type { IGetMessagesParams } from '../models/IMessageParams';
import { http } from '../utils/interceptor';

export const getMessages = (params: IGetMessagesParams = {}) =>
  http.get('/messages', { params }) as unknown as Promise<IMessage[]>;

export const getMessagesAfter = (after: string, limit = 50) =>
  http.get('/messages', { params: { after, limit } }) as unknown as Promise<IMessage[]>;

export const getMessagesBefore = (before: string, limit = 10) =>
  http.get('/messages', { params: { before, limit } }) as unknown as Promise<IMessage[]>;


export const createMessage = (body: IMessageBody) =>
  http.post('/messages', body) as unknown as Promise<IMessage>;
