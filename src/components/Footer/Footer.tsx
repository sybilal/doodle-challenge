import { useState, type SubmitEvent } from 'react';
import { useSendMessage } from '../../hooks/useSendMessage';
import { CURRENT_USER } from '../../utils/constants';
import styles from "./Footer.module.css";

const Footer = () => {
  const [message, setMessage] = useState('');
  const { mutate: sendMessage, isPending } = useSendMessage();

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || isPending) return;

    sendMessage(
      { message: trimmed, author: CURRENT_USER },
      { onSuccess: () => setMessage('') },
    );
  };

  return (
    <form className={styles.container} onSubmit={handleSubmit}>
      <div className={styles.compose_area}>
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Message"
          disabled={isPending}
        />
        <button type="submit" disabled={isPending || !message.trim()}>
          {isPending ? 'Sending…' : 'Send'}
        </button>
      </div>
    </form>
  )
}
export default Footer;
