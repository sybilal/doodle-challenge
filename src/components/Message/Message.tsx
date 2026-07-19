import { memo, useMemo } from "react";
import styles from "./Message.module.css"
import { decodeHtml } from "../../utils/decode-html";
import { format } from "date-fns";

interface IMessage {
  author: string;
  message: string;
  createdAt: string;
  isYou?: boolean;
}

const Message = ({ author, message, createdAt, isYou = false }: IMessage) => {
  const decoded = useMemo(() => decodeHtml(message), [message]);
  const timestamp = useMemo(() => format(createdAt, "dd MMM yyyy HH:mm"), [createdAt]);

  return (
    <div
      className={`${styles.container} ${isYou ? styles.is_you : ''}`}
      role="listitem"
      aria-label={`${isYou ? 'You' : author}, ${timestamp}`}
    >
      <div className={styles.message_box}>
        {!isYou && <span className={styles.grey_text}>{author}</span>}
        {decoded}
        <span className={styles.grey_text}>{timestamp}</span>
      </div>
    </div>
  )
}

export default memo(Message);
