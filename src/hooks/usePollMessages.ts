import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { IMessage } from "../models/IMessage";
import { getMessagesAfter } from "../services/messages.service";
import { mergeMessages } from "../utils/merge-messages";
import { POLL_INTERVAL, QUERY_KEY } from "../utils/constants";

export const usePollMessages = (enabled: boolean) => {
  const qc = useQueryClient();
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      if (!document.hidden) {
        const dt = new Date();
        const current = qc.getQueryData<IMessage[]>(QUERY_KEY) ?? [];

        const noOptimistic = current.filter(e => !e.isAppendedLocally);

        const cursor = noOptimistic[noOptimistic.length - 1]?.createdAt ?? dt.toISOString();
        if (cursor) {
          try {
            const fresh = await getMessagesAfter(cursor, 50);
            if (fresh.length) {
              qc.setQueryData<IMessage[]>(QUERY_KEY, (old = []) => mergeMessages(old, fresh));
            }
          } catch (e) {
            console.error("Polling failed:", e)

          }
        }
      }
      if (!cancelled) timer = setTimeout(tick, POLL_INTERVAL);
    };

    timer = setTimeout(tick, POLL_INTERVAL);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [enabled, qc]);
}