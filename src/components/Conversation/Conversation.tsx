import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useMessages } from '../../hooks/useMessages';
import { useOlderMessages } from '../../hooks/useOlderMessages';
import { usePollMessages } from '../../hooks/usePollMessages';
import { CURRENT_USER } from '../../utils/constants';
import Message from '../Message';
import styles from "./Conversation.module.css";
import { useVirtualizer } from '@tanstack/react-virtual';

/* 
How close to the top (in rows) the user must scroll before we fetch older
messages, and how close to the bottom counts as "pinned" for auto-scroll.
*/
const LOAD_OLDER_THRESHOLD = 2;
const STICK_TO_BOTTOM_PX = 80;

const Conversation = () => {
  const { data: messages = [], isLoading, isError, error } = useMessages();
  usePollMessages(!isLoading);

  const { loadOlder, hasMore, isLoadingOlder, error: olderError } = useOlderMessages();

  const parentRef = useRef<HTMLDivElement>(null);
  const didInitialScroll = useRef(false);
  // scrollHeight captured just before a prepend, used to restore position after.
  const restoreHeightRef = useRef<number | null>(null);
  const prevCountRef = useRef(messages.length);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,                 // rough average row height; measured for real below
    overscan: 8,
    getItemKey: useCallback((index: number) => messages[index]._id, [messages]),
  });

  const virtualItems = virtualizer.getVirtualItems();
  const firstIndex = virtualItems[0]?.index ?? 0;

  // Initial scroll to the newest message once the first page has loaded.
  useLayoutEffect(() => {
    if (didInitialScroll.current || messages.length === 0) return;
    virtualizer.scrollToIndex(messages.length - 1, { align: 'end' });
    didInitialScroll.current = true;
  }, [messages.length, virtualizer]);

  // React to the message list changing size (prepend older / append new).
  useLayoutEffect(() => {
    const el = parentRef.current;
    const prevCount = prevCountRef.current;
    prevCountRef.current = messages.length;
    if (!el || !didInitialScroll.current) return;

    const added = messages.length - prevCount;
    if (added <= 0) return;

    if (restoreHeightRef.current !== null) {
      /*
       Older messages were prepended: keep the previously-top row in place by
       pushing scrollTop down by however much taller the content just got.
      */
      el.scrollTop += el.scrollHeight - restoreHeightRef.current;
      restoreHeightRef.current = null;
    } else {
      /* 
      New messages appended by polling: stay pinned to the bottom only if the
      user was already there, otherwise leave their scroll position alone.
      */
      const distanceFromBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight;
      if (distanceFromBottom - 0 <= STICK_TO_BOTTOM_PX + added * 72) {
        virtualizer.scrollToIndex(messages.length - 1, { align: 'end' });
      }
    }
  }, [messages.length, virtualizer]);

  //for both the scroll, auto-trigger and the manual Retry button.
  const startLoadOlder = useCallback(() => {
    if (isLoadingOlder || !hasMore) return;
    restoreHeightRef.current = parentRef.current?.scrollHeight ?? null;
    loadOlder();
  }, [isLoadingOlder, hasMore, loadOlder]);

  useEffect(() => {
    if (!isLoadingOlder && restoreHeightRef.current !== null) {
      restoreHeightRef.current = null;
    }
  }, [isLoadingOlder]);

  // for the Retry button below.
  useEffect(() => {
    if (!didInitialScroll.current || olderError) return;
    if (firstIndex > LOAD_OLDER_THRESHOLD) return;
    if (restoreHeightRef.current !== null) return;
    startLoadOlder();
  }, [firstIndex, olderError, startLoadOlder]);

  if (isLoading) {
    return <section className={styles.container}>Loading messages…</section>;
  }

  if (isError) {
    return (
      <section className={styles.container}>
        Failed to load messages: {error.message}
      </section>
    );
  }

  return (
    <section className={styles.container} ref={parentRef}>
      {/* {<div className={styles.debug}><pre >{JSON.stringify({ firstIndex, hasMore, isLoadingOlder, loadOlder, olderError, virtualItems }, null, 3)}</pre></div>} */}
      {isLoadingOlder && <div className={styles.spinner}>Loading...</div>}
      {!isLoadingOlder && olderError && (
        <div className={styles.olderError}>
          <span>Couldn’t load older messages.</span>
          <button type="button" onClick={startLoadOlder}>Retry</button>
        </div>
      )}

      <div
        className={styles.inner}
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualItems.map((vItem) => {
          const message = messages[vItem.index];
          return (
            <div
              key={vItem.key}
              className={styles.row}
              data-index={vItem.index}
              ref={virtualizer.measureElement}
              style={{ transform: `translateY(${vItem.start}px)` }}
            >
              <Message
                author={message.author}
                message={message.message}
                createdAt={message.createdAt}
                isYou={message.author === CURRENT_USER}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Conversation;
