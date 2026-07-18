import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { IMessage } from "../models/IMessage";
import { getMessagesAfter } from "../services/messages.service";
import { mergeMessages } from "../utils/merge-messages";
import { QUERY_KEY } from "../utils/constants";

export const usePollMessages = (enabled: boolean) => {
  const qc = useQueryClient();
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      if (!document.hidden) {
        const current = qc.getQueryData<IMessage[]>(QUERY_KEY) ?? [];
        const cursor = current[current.length - 1]?.createdAt;
        if (cursor) {
          try {
            const fresh = await getMessagesAfter(cursor, 50);
            if (fresh.length) {
              qc.setQueryData<IMessage[]>(QUERY_KEY, (old = []) => mergeMessages(old, fresh));
            }
          } catch {
            // next tick retries, add backoff later
          }
        }
      }
      if (!cancelled) timer = setTimeout(tick, 2000);
    };

    timer = setTimeout(tick, 2000);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [enabled, qc]);
}