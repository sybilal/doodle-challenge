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
  return (
    <div className={`${styles.container} ${isYou ? styles.is_you : ''}`}>
      <div className={styles.message_box}>
        {!isYou && <span className={styles.grey_text}>{author}</span>}
        {decodeHtml(message)}
        <span className={styles.grey_text}>{format(createdAt,"dd MMM yyyy HH:mm")}</span>
      </div>
    </div>
  )
}

export default Message;
