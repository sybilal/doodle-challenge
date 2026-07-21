import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { IMessage } from '../models/IMessage';
import { createMessage } from '../services/messages.service';
import { mergeMessages } from '../utils/merge-messages';
import { QUERY_KEY } from '../utils/constants';

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMessage,
    onSuccess: (created) => {
      const fromPOST = { ...created, isAppendedLocally: true }
      queryClient.setQueryData<IMessage[]>(QUERY_KEY, (old = []) => mergeMessages(old, [fromPOST]));
    },
  });
}