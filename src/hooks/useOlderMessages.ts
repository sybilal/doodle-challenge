import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import type { IMessage } from "../models/IMessage";
import { getMessagesBefore } from "../services/messages.service";
import { mergeMessages } from "../utils/merge-messages";
import { MESSAGES_LIMIT, QUERY_KEY } from "../utils/constants";

export const useOlderMessages = () => {
    const qc = useQueryClient();
    const [isLoadingOlder, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadOlder = useCallback(async () => {
        if (isLoadingOlder || !hasMore) return;
        const current = qc.getQueryData<IMessage[]>(QUERY_KEY) ?? [];
        const cursor = current[0]?.createdAt;
        if (!cursor) return;

        setLoading(true);
        setError(null);
        try {
            const older = await getMessagesBefore(cursor, MESSAGES_LIMIT);
            if (older.length < MESSAGES_LIMIT) setHasMore(false);
            if (older.length) {
                qc.setQueryData<IMessage[]>(QUERY_KEY, (old = []) => mergeMessages(old, older));
            }
        } catch (e) {
            setError(e instanceof Error ? e : new Error('Failed to load older messages'));
        } finally {
            setLoading(false);
        }
    }, [qc, isLoadingOlder, hasMore]);

    return { loadOlder, isLoadingOlder, hasMore, error };
}