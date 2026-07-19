import styles from "./NewMessagePill.module.css";

interface PropTypes {
  message: string;
  actionFn: () => void;
}

const NewMessagePill = ({ message, actionFn }: PropTypes) => {
  return (
    <button
      type="button"
      className={styles.container}
      onClick={actionFn}
      aria-label="Scroll to newest messages"
    >
      <span>{message}</span>
    </button>
  )
}

export default NewMessagePill;
