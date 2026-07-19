import { useVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useMessages } from '../../hooks/useMessages';
import { useOlderMessages } from '../../hooks/useOlderMessages';
import { usePollMessages } from '../../hooks/usePollMessages';
import { CURRENT_USER } from '../../utils/constants';
import { decodeHtml } from '../../utils/decode-html';
import ErrorBar from '../ErrorBar';
import Message from '../Message';
import NewMessagePill from '../NewMessagePill';
import styles from "./Conversation.module.css";
import LoadingBar from '../LoadingBar';

/* 
How close to the top (in rows) the user must scroll before we fetch older
messages, and how close to the bottom counts as "pinned" for auto-scroll.
*/
const LOAD_OLDER_THRESHOLD = 2;
const STICK_TO_BOTTOM_PX = 140;

const Conversation = () => {
  const { data: messages = [], isLoading, isError, error } = useMessages();
  usePollMessages(!isLoading);

  const { loadOlder, hasMore, isLoadingOlder, error: olderError } = useOlderMessages();

  const [isNewMessage, setIsNewMessage] = useState(false);

  const parentRef = useRef<HTMLDivElement>(null);
  const didInitialScroll = useRef(false);
  // scrollHeight captured just before a prepend, used to restore position after.
  const beforePrependHeightRef = useRef<number | null>(null);
  const prevCountRef = useRef(messages.length);
  /*
    Whether the user is currently pinned near the bottom. Updated on scroll so
    we know their position *before* a new message grows the scroll height.
  */
  const atBottomRef = useRef(true);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 130,                 // rough average row height; measured for real below
    overscan: 8,
    getItemKey: useCallback((index: number) => messages[index]._id, [messages]),
  });

  const virtualItems = virtualizer.getVirtualItems();
  const firstIndex = virtualItems[0]?.index ?? 0;

  /* 
     Keep atBottomRef in sync with the user's scroll position. Runs once the
     real scroll container is mounted (after the initial loading state).
  */
  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    const update = () => {
      const atBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight <= STICK_TO_BOTTOM_PX;
      atBottomRef.current = atBottom;
      // Scrolling back down to the bottom hide the pill.
      if (atBottom) {
        setIsNewMessage(false);
      }
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    return () => el.removeEventListener('scroll', update);
  }, [isLoading]);

  /* The newest message; its id lets us tell a real append at the tail apart from a prepend of older messages. */

  const lastMessage = messages[messages.length - 1];
  const lastIdRef = useRef<string | undefined>(undefined);

  // Initial scroll to the newest message once the first page has loaded.
  useEffect(() => {
    if (didInitialScroll.current || messages.length === 0) return;
    virtualizer.scrollToIndex(messages.length - 1, { align: 'end' });
    didInitialScroll.current = true;
  }, [messages.length, virtualizer]);

  /*
  React to the message list growing: restore position on a prepend, or handle
  a new message at the start (auto-scroll vs. "new messages" pill).
  */
  useLayoutEffect(() => {
    const el = parentRef.current;
    const prevCount = prevCountRef.current;
    const prevLastId = lastIdRef.current;
    prevCountRef.current = messages.length;
    lastIdRef.current = lastMessage?._id;

    if (!el || !didInitialScroll.current) return;
    if (messages.length <= prevCount) return;


    /* if list prepends, scrollTop updates so
    the visible items stays at same position on the screen
    */
    if (beforePrependHeightRef.current !== null) {
      el.scrollTop += el.scrollHeight - beforePrependHeightRef.current;
      beforePrependHeightRef.current = null;
      return;
    }

    // A new message arrived at the tail (from polling or one the user sent).
    // The first list is handled by the initial-scroll effect above.
    if (prevLastId === undefined || lastMessage?._id === prevLastId) return;

    const iSentIt = lastMessage?.author === CURRENT_USER;
    if (iSentIt || atBottomRef.current) {

      virtualizer.scrollToIndex(messages.length - 1, { align: 'end', behavior: 'smooth' });
      setIsNewMessage(false);
    } else {
      setIsNewMessage(true);
    }
  }, [messages.length, virtualizer]);

  //for the scroll, auto-trigger and the manual Retry button.
  const startLoadOlder = useCallback(() => {
    if (isLoadingOlder || !hasMore) return;
    beforePrependHeightRef.current = parentRef.current?.scrollHeight ?? null;
    loadOlder();
  }, [isLoadingOlder, hasMore, loadOlder]);

  useEffect(() => {
    if (!isLoadingOlder && beforePrependHeightRef.current !== null) {
      beforePrependHeightRef.current = null;
    }
  }, [isLoadingOlder]);

  // for the Retry button below.
  useEffect(() => {
    if (!didInitialScroll.current || olderError) return;
    if (firstIndex > LOAD_OLDER_THRESHOLD) return;
    if (beforePrependHeightRef.current !== null) return;
    startLoadOlder();
  }, [firstIndex, olderError, startLoadOlder]);

  if (isLoading || isError) {
    return <LoadingBar isError={isError} message={isError ? `Failed to load messages: ${error.message}` : "Loading messages…"} />;
  }

  return (
    <section className={styles.container} ref={parentRef} aria-label="Conversation messages">
      {/* {<div className={styles.debug}><pre >{JSON.stringify({ firstIndex, hasMore, isLoadingOlder, loadOlder, olderError, virtualItems }, null, 3)}</pre></div>} */}
      {isLoadingOlder && (

        <LoadingBar message={"Loading older messages…"} />


      )}
      {!isLoadingOlder && olderError && (
        <ErrorBar message={"Couldn't load older messages."} retryFn={startLoadOlder} />
      )}

      {isNewMessage && <NewMessagePill message='New Messages ⬇️' actionFn={() => {
        virtualizer.scrollToIndex(messages.length - 1, { align: 'end', behavior: 'smooth' });
        setIsNewMessage(false);
      }} />}

      {/* Off-screen live region so screen readers announce the newest message. */}
      <div className="sr-only" role="status" aria-live="polite">
        {lastMessage
          ? `${lastMessage.author === CURRENT_USER ? 'You' : lastMessage.author}: ${decodeHtml(lastMessage.message)}`
          : ''}
      </div>

      <div
        className={styles.inner}
        style={{ height: virtualizer.getTotalSize() }}
        role="list"
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
