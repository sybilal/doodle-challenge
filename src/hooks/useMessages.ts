import { useQuery } from '@tanstack/react-query';
import { getMessages } from '../services/messages.service';
import { QUERY_KEY } from '../utils/constants';

export const useMessages = (limit = 20) => {

  const dt = new Date();

  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => getMessages({ limit, before: dt.toISOString() }), // same for initial messages
    staleTime: Infinity,          // no auto refetch
    refetchOnWindowFocus: false,
  });
}